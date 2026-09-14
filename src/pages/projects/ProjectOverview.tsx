import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ConceptCard } from '../../components/learning/ConceptCard';
import { MaterialCard } from '../../components/materials/MaterialCard';
import { MasteryChart } from '../../components/learning/MasteryChart';
import {
  MessageSquare,
  CheckCircle,
  FileText,
  Brain,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchRecommendationsApi } from '../../api/analytics';
import { Recommendation } from '../../types';

export const ProjectOverview: React.FC = () => {
  const { project, materials, concepts } = useProject();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRecs() {
      try {
        const recs = await fetchRecommendationsApi();
        setRecommendations(recs);
      } catch (e) {
        console.error(e);
      }
    }
    loadRecs();
  }, [project?.id]);

  if (!project) return null;

  const topConcepts = concepts.slice(0, 4);
  const weakConcepts = concepts.filter((c) => c.score < 75);
  const projectRec =
    recommendations.find((r) => r.projectId === project.id) ||
    recommendations[0] ||
    null;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* CURRENT LEARNING TOPIC & TARGET GOAL BANNER */}
      <div className="p-6 bg-paper-raised border border-line rounded-2xl shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-signal-strong font-semibold uppercase tracking-wider bg-signal-soft px-2.5 py-0.5 rounded-full">
              Current Learning Topic
            </span>
            <span className="text-xs font-mono text-ink-faint">
              Active Focus: {weakConcepts[0]?.name || topConcepts[0]?.name || 'Comprehensive Topic Mastery'}
            </span>
          </div>
          <h2 className="font-display text-xl font-semibold text-ink">
            Target Goal: {project.targetGoal}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to={`/projects/${project.id}/tutor`}>
            <Button variant="signal" className="gap-2 font-semibold shadow-sm text-xs">
              <Brain className="w-4 h-4" /> Continue Learning
            </Button>
          </Link>
        </div>
      </div>

      {/* RECOMMENDED NEXT ACTION (PRD #12) */}
      {projectRec && (
        <Card className="p-7 bg-gradient-to-r from-indigo-soft/60 via-paper-raised to-paper-raised border border-indigo/30 rounded-2xl shadow-panel flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo" />
              <span className="text-xs font-mono font-semibold text-indigo-strong uppercase tracking-wider">
                ✦ Recommended Next Step
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold text-ink">
              {projectRec.title}
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              {projectRec.reason}
            </p>
            {projectRec.evidence && (
              <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-ink-faint">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo" /> Rationale: {projectRec.evidence}
                </span>
                <span>•</span>
                <span className="text-signal-strong font-medium">Priority: {projectRec.priority}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <Link to={projectRec.actionUrl || `/projects/${project.id}/quiz`}>
              <Button variant="primary" size="md" className="gap-2 font-semibold shadow-md">
                <CheckCircle className="w-4 h-4" /> Start Recommended Action →
              </Button>
            </Link>
            <Link to={`/projects/${project.id}/tutor`}>
              <Button variant="outline" size="md" className="gap-2 text-xs font-mono">
                <MessageSquare className="w-4 h-4 text-indigo" /> Ask Tutor
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* QUICK WORKSPACE LAUNCH MODULES */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Link to={`/projects/${project.id}/tutor`}>
          <Card className="p-4 bg-paper-raised border border-line/70 rounded-xl hover:border-indigo/50 hover:shadow-float transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-soft text-indigo-strong rounded-lg">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-xs font-semibold text-ink group-hover:text-indigo transition-colors">
                    AI Study Tutor
                  </h4>
                  <p className="text-[10px] font-mono text-ink-faint">Grounded citations</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-ink-faint group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        <Link to={`/projects/${project.id}/quiz`}>
          <Card className="p-4 bg-paper-raised border border-line/70 rounded-xl hover:border-indigo/50 hover:shadow-float transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-signal-soft text-signal-strong rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-xs font-semibold text-ink group-hover:text-signal-strong transition-colors">
                    Adaptive Quiz
                  </h4>
                  <p className="text-[10px] font-mono text-ink-faint">Test concept gaps</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-ink-faint group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        <Link to={`/projects/${project.id}/mastery`}>
          <Card className="p-4 bg-paper-raised border border-line/70 rounded-xl hover:border-indigo/50 hover:shadow-float transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-soft text-indigo-strong rounded-lg">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-xs font-semibold text-ink group-hover:text-indigo transition-colors">
                    Concept Mastery
                  </h4>
                  <p className="text-[10px] font-mono text-ink-faint">Landscape tree</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-ink-faint group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        <Link to={`/projects/${project.id}/assessment`}>
          <Card className="p-4 bg-paper-raised border border-line/70 rounded-xl hover:border-indigo/50 hover:shadow-float transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-soft text-amber rounded-lg">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-xs font-semibold text-ink group-hover:text-amber transition-colors">
                    Assessment
                  </h4>
                  <p className="text-[10px] font-mono text-ink-faint">Essay & Rubric</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-ink-faint group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>
      </div>

      {/* MASTERY TRAJECTORY & RECENT MATERIALS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-paper-raised border border-line/70 rounded-xl shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-line/60">
            <div>
              <span className="text-[10px] font-mono text-indigo-strong font-semibold uppercase">
                Progress Trajectory
              </span>
              <h3 className="font-display text-base font-semibold text-ink">
                Concept Mastery Over Time
              </h3>
            </div>
            <Link
              to={`/projects/${project.id}/growth`}
              className="text-xs font-mono text-signal-strong font-semibold flex items-center gap-1 hover:underline"
            >
              <TrendingUp className="w-3.5 h-3.5" /> View Growth Story →
            </Link>
          </div>
          <MasteryChart />
        </Card>

        {/* Ingested Sources Preview */}
        <Card className="p-6 bg-paper-raised border border-line/70 rounded-xl shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-line/60 mb-3">
              <h3 className="font-display text-sm font-semibold text-ink uppercase tracking-wider font-mono">
                Recent Materials ({materials.length})
              </h3>
              <Link
                to={`/projects/${project.id}/materials`}
                className="text-xs text-indigo font-semibold hover:underline"
              >
                Manage →
              </Link>
            </div>
            <div className="space-y-3">
              {materials.length > 0 ? (
                materials.slice(0, 2).map((m) => (
                  <MaterialCard key={m.id} material={m} />
                ))
              ) : (
                <p className="text-xs text-ink-faint py-3 text-center">
                  No materials uploaded yet. Upload a PDF or EPUB to extract concepts and start learning.
                </p>
              )}
            </div>
          </div>

          <Link to={`/projects/${project.id}/materials`} className="pt-2 block">
            <Button variant="outline" size="sm" className="w-full text-xs font-mono">
              + Upload More PDFs
            </Button>
          </Link>
        </Card>
      </div>

      {/* CONCEPT MASTERY LANDSCAPE PREVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">
              Core Concepts Indexed ({concepts.length})
            </h3>
            <p className="text-xs text-ink-faint">
              Visual knowledge distribution extracted from your ingested materials.
            </p>
          </div>
          <Link
            to={`/projects/${project.id}/mastery`}
            className="text-xs font-mono text-indigo-strong font-semibold hover:underline flex items-center gap-1"
          >
            Explore Concept Landscape →
          </Link>
        </div>
        {topConcepts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topConcepts.map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </div>
        ) : (
          <Card className="p-6 bg-paper-raised border border-line/70 rounded-xl text-center space-y-1">
            <Brain className="w-6 h-6 text-indigo/50 mx-auto" />
            <p className="font-semibold text-ink text-xs">No concepts indexed yet</p>
            <p className="text-[11px] text-ink-faint max-w-sm mx-auto">
              Uploading study materials will automatically extract key concepts and map your mastery landscape.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
