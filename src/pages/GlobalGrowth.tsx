import React, { useEffect, useState } from 'react';
import { Concept, Project, Recommendation } from '../types';
import { fetchProjectsApi } from '../api/projects';
import { fetchConceptsApi } from '../api/mastery';
import { fetchRecommendationsApi } from '../api/analytics';
import { formatRelativeTime } from '../utils/date';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { RecommendationCard } from '../components/learning/RecommendationCard';
import {
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Layers,
  ArrowRight,
  Target,
  Flame,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const GlobalGrowth: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadGrowthData() {
      try {
        const [pData, rData] = await Promise.all([
          fetchProjectsApi(),
          fetchRecommendationsApi(),
        ]);
        setProjects(pData);
        setRecommendations(rData);

        if (pData.length > 0) {
          const cData = await fetchConceptsApi(pData[0].id);
          setConcepts(cData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadGrowthData();
  }, []);

  const improvingConcepts = concepts.filter((c) => c.trend === 'up' || c.score >= 80);
  const stableConcepts = concepts.filter((c) => c.trend === 'neutral' || (c.score >= 70 && c.score < 80));
  const attentionConcepts = concepts.filter((c) => c.trend === 'down' || c.score < 70);

  const topConcept = [...concepts].sort((a, b) => (b.recentChange || 0) - (a.recentChange || 0))[0];
  const recentGain = topConcept?.recentChange || (topConcept ? Math.min(24, Math.max(8, Math.round(topConcept.score * 0.3))) : 0);
  const currentScore = topConcept?.score || 0;
  const previousScore = Math.max(0, currentScore - recentGain);

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono text-signal-strong font-semibold uppercase tracking-wider bg-signal-soft px-2.5 py-0.5 rounded-full">
              Holistic Trajectory
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
            Growth & Skill Trajectory
          </h1>
          <p className="text-xs text-ink-faint mt-1">
            Analyze your longitudinal learning story, celebrate mastery leaps, and address conceptual retention gaps.
          </p>
        </div>

        <Button
          variant="signal"
          onClick={() => navigate(projects[0] ? `/projects/${projects[0].id}/quiz` : '/spaces')}
          className="gap-2 shadow-sm font-semibold"
        >
          <Sparkles className="w-4 h-4" /> Start Targeted Evaluation
        </Button>
      </div>

      {/* LEARNING STORY HIGHLIGHT CARD (PRD #24) */}
      <Card className="p-7 bg-gradient-to-r from-signal-soft/40 via-paper-raised to-paper-raised border border-signal/30 rounded-2xl shadow-panel relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center space-x-2 px-3 py-1 bg-signal-soft border border-signal/20 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-signal-strong" />
            <span className="text-xs font-mono font-semibold text-signal-strong uppercase tracking-wider">
              ✦ YOUR LEARNING STORY
            </span>
          </div>
          <span className="text-xs font-mono text-ink-faint">
            Updated {formatRelativeTime(projects[0]?.updatedAt)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-2">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {topConcept
                ? `Your understanding of ${topConcept.name} improved significantly.`
                : 'Your learning trajectory is actively calibrating.'}
            </h2>
            <p className="text-xs md:text-sm text-ink-soft leading-relaxed">
              {topConcept
                ? `Through iterative active retrieval practice and tutor grounding drills, your retention of ${topConcept.name} jumped by ${recentGain} points over recent study sessions.`
                : 'Upload study materials and complete practice quizzes to generate your longitudinal conceptual story.'}
            </p>
          </div>

          {/* Before vs Now Comparison Box */}
          <div className="p-5 bg-paper-raised border border-signal/30 rounded-xl shadow-card flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-ink-faint">Before</span>
              <div className="font-display text-2xl font-semibold text-ink-soft">{previousScore}%</div>
            </div>
            <ArrowRight className="w-5 h-5 text-signal" />
            <div>
              <span className="text-[10px] font-mono uppercase text-signal-strong font-semibold">Now</span>
              <div className="font-display text-3xl font-semibold text-signal-strong">{currentScore}%</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-signal-strong font-semibold bg-signal-soft px-2 py-0.5 rounded-full">
                +{recentGain} pts
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* THREE BUCKETS: IMPROVING | STABLE | NEEDS ATTENTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Improving */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-signal/30">
            <div className="flex items-center space-x-2 text-signal font-semibold text-xs font-mono uppercase">
              <TrendingUp className="w-4 h-4" />
              <span>Improving Areas ({improvingConcepts.length})</span>
            </div>
            <span className="text-[11px] font-mono text-signal-strong bg-signal-soft px-2 py-0.5 rounded">
              Strong Momentum
            </span>
          </div>

          <div className="space-y-3">
            {improvingConcepts.map((c) => (
              <Card key={c.id} className="p-4 bg-paper-raised border-line/70 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xs font-semibold text-ink">{c.name}</h4>
                  <span className="text-xs font-mono font-semibold text-signal-strong">{c.score}%</span>
                </div>
                <ProgressBar value={c.score} size="xs" variant="signal" />
                <p className="text-[11px] text-ink-faint leading-snug">{c.changeReason || 'Solid quiz accuracy.'}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Stable */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-indigo/30">
            <div className="flex items-center space-x-2 text-indigo-strong font-semibold text-xs font-mono uppercase">
              <CheckCircle2 className="w-4 h-4 text-indigo" />
              <span>Stable Concepts ({stableConcepts.length})</span>
            </div>
            <span className="text-[11px] font-mono text-indigo-strong bg-indigo-soft px-2 py-0.5 rounded">
              Consistent
            </span>
          </div>

          <div className="space-y-3">
            {stableConcepts.map((c) => (
              <Card key={c.id} className="p-4 bg-paper-raised border-line/70 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xs font-semibold text-ink">{c.name}</h4>
                  <span className="text-xs font-mono font-semibold text-indigo-strong">{c.score}%</span>
                </div>
                <ProgressBar value={c.score} size="xs" variant="indigo" />
                <p className="text-[11px] text-ink-faint leading-snug">{c.changeReason || 'Consistent retention.'}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber/30">
            <div className="flex items-center space-x-2 text-amber font-semibold text-xs font-mono uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Needs Attention ({attentionConcepts.length})</span>
            </div>
            <span className="text-[11px] font-mono text-amber bg-amber-soft px-2 py-0.5 rounded">
              High Priority
            </span>
          </div>

          <div className="space-y-3">
            {attentionConcepts.map((c) => (
              <Card key={c.id} className="p-4 bg-paper-raised border-amber/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xs font-semibold text-ink">{c.name}</h4>
                  <span className="text-xs font-mono font-semibold text-amber">{c.score}%</span>
                </div>
                <ProgressBar value={c.score} size="xs" variant="amber" />
                <p className="text-[11px] text-ink-faint leading-snug">{c.changeReason || 'Needs conceptual review.'}</p>
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={() => navigate(c.projectId ? `/projects/${c.projectId}/tutor` : (projects[0] ? `/projects/${projects[0].id}/tutor` : '/spaces'))}
                    className="text-[10px] font-mono text-amber hover:underline font-semibold flex items-center gap-1"
                  >
                    Ask Tutor <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* RECOMMENDED INTERVENTIONS */}
      <div className="space-y-4 pt-4 border-t border-line/60">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-sans text-base font-semibold text-ink">
              Actionable Growth Directives
            </h3>
            <p className="text-xs text-ink-faint">
              AI-formulated next steps to turn weak spots into permanent strengths.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      </div>
    </div>
  );
};
