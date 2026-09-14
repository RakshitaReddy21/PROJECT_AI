import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { ActivityItem } from '../../types';
import { fetchActivitiesApi } from '../../api/analytics';
import { Card } from '../../components/ui/Card';
import {
  Activity,
  FileText,
  Brain,
  HelpCircle,
  FileSignature,
  TrendingUp,
  Filter,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProjectActivity: React.FC = () => {
  const { project } = useProject();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivities() {
      try {
        const data = await fetchActivitiesApi();
        // Filter to project-related activities or display contextual list
        const projectActivities = data.filter(
          (a) => !a.projectId || a.projectId === project?.id
        );
        setActivities(projectActivities);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadActivities();
  }, [project?.id]);

  if (!project) return null;

  const filtered = activities.filter((act) => {
    if (filterType === 'all') return true;
    return act.type === filterType;
  });

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'material_uploaded':
        return <FileText className="w-4 h-4 text-indigo" />;
      case 'tutor_queried':
        return <Brain className="w-4 h-4 text-signal-strong" />;
      case 'quiz_completed':
        return <HelpCircle className="w-4 h-4 text-amber" />;
      case 'assessment_submitted':
        return <FileSignature className="w-4 h-4 text-indigo-strong" />;
      case 'mastery_changed':
        return <TrendingUp className="w-4 h-4 text-signal" />;
      default:
        return <Activity className="w-4 h-4 text-ink-faint" />;
    }
  };

  const getBadgeStyle = (type: ActivityItem['type']) => {
    switch (type) {
      case 'material_uploaded':
        return 'bg-indigo-soft/60 text-indigo-strong border-indigo/20';
      case 'tutor_queried':
        return 'bg-signal-soft text-signal-strong border-signal/20';
      case 'quiz_completed':
        return 'bg-amber-soft text-amber border-amber/20';
      case 'assessment_submitted':
        return 'bg-indigo-soft text-indigo-strong border-indigo/20';
      case 'mastery_changed':
        return 'bg-signal-soft/60 text-signal border-signal/20';
      default:
        return 'bg-paper-sunken text-ink-faint border-line';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono text-signal-strong font-semibold uppercase tracking-wider bg-signal-soft px-2.5 py-0.5 rounded-full">
              Audit Stream
            </span>
            <span className="text-xs font-mono text-ink-faint">
              {project.title} Activity
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink">
            Project Activity Timeline
          </h2>
          <p className="text-xs text-ink-faint mt-1">
            Chronological log of document ingestions, AI tutor dialogues, quiz scores, and concept mastery updates.
          </p>
        </div>

        {/* Filter Pill Select */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-ink-faint" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-xs bg-paper-raised border border-line rounded-lg text-ink focus:outline-none"
          >
            <option value="all">All Events</option>
            <option value="quiz_completed">Quizzes</option>
            <option value="tutor_queried">Tutor Inquiries</option>
            <option value="material_uploaded">Materials</option>
            <option value="assessment_submitted">Assessments</option>
            <option value="mastery_changed">Mastery Updates</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-paper-raised rounded-2xl border border-line/70 space-y-2">
            <Activity className="w-8 h-8 text-ink-faint mx-auto" />
            <h3 className="text-sm font-semibold text-ink">No activity matching filter</h3>
            <p className="text-xs text-ink-faint">
              Interact with the tutor, take a quiz, or upload a document to generate timeline telemetry.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((act) => (
              <Card
                key={act.id}
                className="p-4.5 bg-paper-raised border border-line/70 rounded-xl transition-all duration-150 hover:shadow-card hover:-translate-y-0.5 flex items-start justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-paper-sunken border border-line rounded-xl flex-shrink-0 mt-0.5">
                    {getIcon(act.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                          act.type
                        )}`}
                      >
                        {act.type.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-ink-faint flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(act.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-ink leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 self-center">
                  <Link
                    to={
                      act.type === 'quiz_completed'
                        ? `/projects/${project.id}/quiz`
                        : act.type === 'material_uploaded'
                        ? `/projects/${project.id}/materials`
                        : act.type === 'assessment_submitted'
                        ? `/projects/${project.id}/assessment`
                        : `/projects/${project.id}/tutor`
                    }
                    className="p-1.5 text-ink-faint hover:text-signal-strong hover:bg-signal-soft rounded-lg transition-colors inline-flex"
                    title="View related view"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
