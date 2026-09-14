import React from 'react';
import { useParams, Outlet, useLocation, Link } from 'react-router-dom';
import { ProjectProvider, useProject } from '../../context/ProjectContext';
import { TabNav, TabItem } from '../../components/ui/TabNav';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Sparkles, Brain, BookOpen, Clock, ShieldAlert } from 'lucide-react';

const ProjectHeader: React.FC = () => {
  const { project, materials, concepts, loading, error } = useProject();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center text-xs font-mono text-ink-faint">
        Loading project workspace...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-paper-raised border border-rust/40 rounded-2xl text-center space-y-4 shadow-card">
        <div className="w-12 h-12 bg-rust-soft text-rust rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="font-display text-xl font-semibold text-ink">Access Restricted</h3>
        <p className="text-xs text-ink-soft leading-relaxed">
          {error || 'Project not found or you do not have permission to view this learning workspace.'}
        </p>
        <Link to="/projects" className="inline-block pt-2">
          <Button variant="primary" size="sm">
            Back to My Projects
          </Button>
        </Link>
      </div>
    );
  }

  const projectId = project.id;
  const isAppPrefixed = location.pathname.startsWith('/app/');
  const baseUrl = isAppPrefixed ? `/app/projects/${projectId}` : `/projects/${projectId}`;

  const tabs: TabItem[] = [
    { key: 'overview', label: 'Overview', to: `${baseUrl}/overview` },
    { key: 'tutor', label: 'AI Tutor', to: `${baseUrl}/tutor` },
    { key: 'materials', label: 'Materials', to: `${baseUrl}/materials`, badge: materials.length },
    { key: 'quiz', label: 'Adaptive Quiz', to: `${baseUrl}/quiz` },
    { key: 'assessment', label: 'Assessment', to: `${baseUrl}/assessment` },
    { key: 'mastery', label: 'Mastery Landscape', to: `${baseUrl}/mastery`, badge: `${project.masteryScore}%` },
    { key: 'growth', label: 'Growth Trajectory', to: `${baseUrl}/growth` },
    { key: 'analytics', label: 'Analytics', to: `${baseUrl}/analytics` },
    { key: 'activity', label: 'Activity', to: `${baseUrl}/activity` },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Floating Project Header Banner */}
      <div className="p-6 bg-paper-raised border border-line/70 rounded-2xl shadow-card space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-mono text-indigo-strong font-semibold uppercase tracking-wider bg-indigo-soft px-2.5 py-0.5 rounded-full">
                {project.spaceName || 'Subject Domain'}
              </span>
              <span className="text-xs font-mono text-ink-faint flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-signal" /> Active Workspace
              </span>
            </div>

            <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink leading-tight">
              {project.title}
            </h1>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed max-w-2xl">{project.description}</p>
          </div>

          <div className="p-4 bg-paper-sunken/80 border border-line/60 rounded-xl text-right flex-shrink-0">
            <span className="text-[10px] font-mono text-ink-faint uppercase font-semibold">Learning Goal Mastery</span>
            <div className="font-display text-3xl font-semibold text-indigo-strong">
              {project.masteryScore}%
            </div>
            <div className="w-36 mt-1.5">
              <ProgressBar value={project.masteryScore} size="sm" variant="indigo" />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-line/60 flex flex-wrap items-center gap-6 text-xs font-mono text-ink-faint">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo" />
            {materials.length} Sources Ingested
          </span>
          <span className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-signal" />
            {concepts.length} Concepts Indexed
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber" />
            Goal: {project.targetGoal}
          </span>
        </div>
      </div>

      {/* Floating Segmented Project Navigation */}
      <div className="p-1 bg-paper-sunken/80 border border-line/70 rounded-xl shadow-sm overflow-x-auto">
        <TabNav tabs={tabs} />
      </div>

      {/* Nested View */}
      <div className="pt-2">
        <Outlet />
      </div>
    </div>
  );
};

export const ProjectLayout: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) return null;

  return (
    <ProjectProvider projectId={projectId}>
      <ProjectHeader />
    </ProjectProvider>
  );
};
