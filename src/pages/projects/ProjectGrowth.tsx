import React, { useEffect, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Card } from '../../components/ui/Card';
import { MasteryChart } from '../../components/learning/MasteryChart';
import { ConceptCard } from '../../components/learning/ConceptCard';
import { Sparkles, TrendingUp, Award, CheckCircle, Brain, ArrowUpRight } from 'lucide-react';
import { fetchGrowthInsightApi } from '../../api/mastery';
import { GrowthInsight } from '../../types';

export const ProjectGrowth: React.FC = () => {
  const { projectId, project, concepts } = useProject();
  const [growthInsight, setGrowthInsight] = useState<GrowthInsight | null>(null);

  useEffect(() => {
    async function loadInsight() {
      try {
        const data = await fetchGrowthInsightApi(projectId);
        setGrowthInsight(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadInsight();
  }, [projectId, project?.masteryScore]);

  if (!project) return null;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-[10px] font-mono text-signal-strong font-semibold uppercase tracking-wider bg-signal-soft px-2.5 py-0.5 rounded-full">
            Cognitive Trajectory
          </span>
          <span className="text-xs font-mono text-ink-faint">
            Real-Time Learning Narrative
          </span>
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink">
          Learning Growth & Mastery Trajectory
        </h2>
        <p className="text-xs text-ink-faint mt-1">
          Historical mastery evolution, milestone achievements, and personalized concept progression narrative.
        </p>
      </div>

      {/* Trajectory Summary Narrative */}
      {growthInsight && (
        <Card className="p-6 bg-gradient-to-r from-signal-soft/40 via-paper-raised to-paper-raised border border-signal/30 rounded-2xl shadow-card flex items-start gap-4">
          <div className="p-3 bg-signal text-white rounded-xl flex-shrink-0 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-semibold text-signal-strong uppercase tracking-wider">
                AI Synthesis Narrative
              </span>
              <span className="text-xs font-mono text-ink-faint">•</span>
              <span className="text-xs font-mono text-signal-strong">
                {growthInsight.recentProgress}
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">
              Mastery Evolution Report
            </h3>
            <p className="text-xs md:text-sm text-ink-soft leading-relaxed max-w-3xl">
              {growthInsight.narrative}
            </p>
          </div>
        </Card>
      )}

      {/* Quick Metrics Bar */}
      {growthInsight && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-paper-raised border border-line rounded-xl">
            <span className="text-[10px] font-mono text-ink-faint uppercase font-semibold">Starting Baseline</span>
            <p className="font-display text-2xl font-semibold text-ink mt-0.5">{growthInsight.startingMastery}%</p>
            <span className="text-[10px] font-mono text-ink-faint">Diagnostic score</span>
          </Card>
          <Card className="p-4 bg-paper-raised border border-line rounded-xl">
            <span className="text-[10px] font-mono text-ink-faint uppercase font-semibold">Current Mastery</span>
            <p className="font-display text-2xl font-semibold text-signal-strong mt-0.5">{growthInsight.currentMastery}%</p>
            <span className="text-[10px] font-mono text-signal-strong flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +{growthInsight.improvement}% net gain
            </span>
          </Card>
          <Card className="p-4 bg-paper-raised border border-line rounded-xl">
            <span className="text-[10px] font-mono text-ink-faint uppercase font-semibold">Consistency Velocity</span>
            <p className="font-display text-2xl font-semibold text-ink mt-0.5">{growthInsight.learningConsistency}%</p>
            <span className="text-[10px] font-mono text-ink-faint">Daily study streak</span>
          </Card>
          <Card className="p-4 bg-paper-raised border border-line rounded-xl">
            <span className="text-[10px] font-mono text-ink-faint uppercase font-semibold">Retention Gaps</span>
            <p className="font-display text-2xl font-semibold text-amber mt-0.5">{growthInsight.weakestConcepts.length}</p>
            <span className="text-[10px] font-mono text-amber">Requires practice</span>
          </Card>
        </div>
      )}

      {/* Chart & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-4 rounded-2xl shadow-card">
          <div className="flex items-center justify-between pb-2 border-b border-line/60">
            <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider font-mono">
              Overall Project Mastery History
            </h3>
            <span className="text-xs font-mono text-signal-strong font-medium">
              30-Day Window
            </span>
          </div>
          <MasteryChart />
        </Card>

        {/* Milestones */}
        <Card className="p-6 space-y-4 rounded-2xl shadow-card">
          <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider font-mono flex items-center gap-1.5 pb-2 border-b border-line/60">
            <Award className="w-4 h-4 text-amber" /> Milestone Badges
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-paper-sunken border border-line rounded-xl flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-signal-strong flex-shrink-0" />
              <div>
                <p className="font-semibold text-ink">{project.title} Ingestion</p>
                <p className="text-[10px] font-mono text-ink-faint">Indexed {project.materialCount} core documents</p>
              </div>
            </div>

            <div className="p-3 bg-paper-sunken border border-line rounded-xl flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-signal-strong flex-shrink-0" />
              <div>
                <p className="font-semibold text-ink">Adaptive Quiz Accuracy</p>
                <p className="text-[10px] font-mono text-ink-faint">Achieved &gt;80% accuracy threshold</p>
              </div>
            </div>

            <div className="p-3 bg-paper-sunken/50 border border-line/60 rounded-xl flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-indigo flex-shrink-0" />
              <div>
                <p className="font-semibold text-ink">Synthesis Rubric Completed</p>
                <p className="text-[10px] font-mono text-ink-faint">Evaluated across 5 dimensions</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Full Concept Mastery Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-line/60">
          <h3 className="font-sans text-base font-semibold text-ink">
            Detailed Concept Breakdown ({concepts.length})
          </h3>
          <span className="text-xs font-mono text-ink-faint">
            Color indicates current cognitive confidence
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {concepts.map((c) => (
            <ConceptCard key={c.id} concept={c} />
          ))}
        </div>
      </div>
    </div>
  );
};
