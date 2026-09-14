import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Space, Project, ActivityItem } from '../../types';
import { fetchSpaceApi } from '../../api/spaces';
import { fetchProjectsApi, createProjectApi } from '../../api/projects';
import { fetchActivitiesApi } from '../../api/analytics';
import { ProjectCard } from '../../components/learning/ProjectCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  Plus,
  FolderKanban,
  Sparkles,
  Clock,
  AlertTriangle,
  Brain,
  Activity as ActivityIcon,
  Search,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const SpaceDetail: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [space, setSpace] = useState<Space | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { success } = useToast();

  useEffect(() => {
    async function loadSpaceData() {
      if (!spaceId) return;
      try {
        const [sData, pData, aData] = await Promise.all([
          fetchSpaceApi(spaceId),
          fetchProjectsApi(spaceId),
          fetchActivitiesApi(),
        ]);
        setSpace(sData);
        setProjects(pData);
        const spaceProjectIds = new Set(pData.map((p) => p.id));
        setActivities(aData.filter((a) => a.projectId && spaceProjectIds.has(a.projectId)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSpaceData();
  }, [spaceId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !spaceId) return;
    setIsCreating(true);
    try {
      const newProj = await createProjectApi({
        spaceId,
        title,
        description,
        targetGoal: targetGoal || 'Master foundational and advanced concepts',
      });
      setProjects([newProj, ...projects]);
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setTargetGoal('');
      success('Project created', `"${newProj.title}" added to ${space?.name}.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  if (!space && !loading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-ink">Space not found</h2>
        <Link to="/spaces" className="text-signal-strong text-xs mt-2 inline-block">
          Return to Spaces List
        </Link>
      </div>
    );
  }

  const avgMastery =
    projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.masteryScore, 0) / projects.length)
      : 0;

  const firstProject = projects[0];
  const totalMaterialsCount = projects.reduce((sum, p) => sum + p.materialCount, 0);

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Space Hero Dashboard Banner */}
      <div className="p-6 md:p-8 bg-paper-raised border border-line/70 rounded-2xl shadow-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-signal via-indigo to-amber" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-signal-strong font-semibold uppercase tracking-wider bg-signal-soft px-2.5 py-0.5 rounded-full">
                Subject Domain Workspace
              </span>
              <span className="text-xs font-mono text-ink-faint">
                {space?.projectCount} active projects
              </span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink tracking-tight">
              {space?.name}
            </h1>
            <p className="text-xs md:text-sm text-ink-soft max-w-2xl leading-relaxed">
              {space?.description}
            </p>
          </div>

          {/* Overall Space Mastery Widget */}
          <div className="p-4 bg-paper-sunken/80 border border-line/60 rounded-xl text-right flex-shrink-0 min-w-[200px]">
            <span className="text-[10px] font-mono text-ink-faint uppercase font-semibold">
              Domain Overall Progress
            </span>
            <div className="font-display text-3xl font-semibold text-signal-strong">
              {avgMastery}%
            </div>
            <div className="w-full mt-1.5">
              <ProgressBar value={avgMastery} size="sm" variant="signal" />
            </div>
            <span className="text-[10px] font-mono text-ink-faint mt-1 block">
              Calculated across {projects.length} learning paths
            </span>
          </div>
        </div>
      </div>

      {/* Domain Insights Bar: Attention Areas & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Attention Areas */}
        <div className="p-5 bg-amber-soft/30 border border-amber/20 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-amber text-xs font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Attention Areas in this Domain</span>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed">
            {firstProject
              ? `Focus on reinforcement drills for "${firstProject.title}" to advance mastery from ${firstProject.masteryScore}%.`
              : 'Create a project to begin mapping conceptual strengths and retention gaps.'}
          </p>
          {firstProject && (
            <Link
              to={`/projects/${firstProject.id}/quiz`}
              className="inline-flex items-center text-xs text-amber font-semibold hover:underline pt-1"
            >
              Take Targeted Practice Quiz <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          )}
        </div>

        {/* Recently Studied Project */}
        <div className="p-5 bg-indigo-soft/30 border border-indigo/20 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-indigo-strong text-xs font-semibold">
            <Brain className="w-4 h-4" />
            <span>Recently Active Journey</span>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed">
            {firstProject ? (
              <>
                <strong className="text-ink">{firstProject.title}</strong> studied recently. {firstProject.materialCount} materials ingested, {firstProject.conceptCount} concepts indexed.
              </>
            ) : (
              'No active learning journeys yet in this space.'
            )}
          </p>
          {firstProject && (
            <Link
              to={`/projects/${firstProject.id}/overview`}
              className="inline-flex items-center text-xs text-indigo-strong font-semibold hover:underline pt-1"
            >
              Resume Journey <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          )}
        </div>

        {/* Ingestion & Grounding Status */}
        <div className="p-5 bg-signal-soft/30 border border-signal/20 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-signal-strong text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Domain Knowledge Index</span>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed">
            {totalMaterialsCount > 0
              ? `All ${totalMaterialsCount} source documents across this space are indexed and searchable. AI Tutor is prepared for cross-document synthesis.`
              : 'No documents uploaded yet. Add materials to initialize semantic vector search.'}
          </p>
          {firstProject && (
            <Link
              to={`/projects/${firstProject.id}/materials`}
              className="inline-flex items-center text-xs text-signal-strong font-semibold hover:underline pt-1"
            >
              Inspect Materials <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          )}
        </div>
      </div>

      {/* Projects List Header with Search & Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
          <div>
            <h2 className="font-sans text-lg font-semibold text-ink">
              Learning Journeys in {space?.name} ({projects.length})
            </h2>
            <p className="text-xs text-ink-faint">
              Each project is an individual learning pathway with its own materials, quizzes, and mastery model.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-paper-sunken border border-line rounded-lg w-40 sm:w-56 focus:outline-none focus:border-ink-soft"
              />
            </div>
            <Button variant="signal" size="sm" onClick={() => setIsModalOpen(true)} className="gap-1.5 whitespace-nowrap">
              <Plus className="w-3.5 h-3.5" /> New Project
            </Button>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center bg-paper-sunken rounded-xl border border-line/60 space-y-2">
            <BookOpen className="w-6 h-6 text-ink-faint mx-auto" />
            <p className="text-xs text-ink-soft">No projects match your filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => (
              <ProjectCard key={proj.id} project={proj} />
            ))}
          </div>
        )}
      </div>

      {/* Domain Activity Timeline */}
      {activities.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-line/60">
          <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-ink uppercase">
            <ActivityIcon className="w-4 h-4 text-signal-strong" />
            <span>Recent Domain Activity</span>
          </div>
          <div className="p-4 bg-paper-raised border border-line/60 rounded-xl divide-y divide-line/40">
            {activities.slice(0, 4).map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 rounded-full bg-signal" />
                  <span className="text-ink font-medium">{act.description}</span>
                </div>
                <span className="text-[11px] font-mono text-ink-faint">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Study Project"
        description={`Add a new study project inside ${space?.name}.`}
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Title"
            placeholder="e.g. Retrieval Augmented Generation (RAG)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Target Learning Goal</label>
            <input
              type="text"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              placeholder="e.g. Master vector indexing, chunking, and groundedness evaluation by Q4"
              className="w-full px-3.5 py-2 text-xs bg-paper-raised border border-line rounded-md text-ink focus:outline-none focus:border-ink-soft"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Scope and syllabus details..."
              className="w-full px-3.5 py-2 text-xs bg-paper-raised border border-line rounded-md text-ink focus:outline-none focus:border-ink-soft"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="signal" type="submit" isLoading={isCreating}>
              Create Learning Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
