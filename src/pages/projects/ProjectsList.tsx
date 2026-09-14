import React, { useEffect, useState } from 'react';
import { Project, Space } from '../../types';
import { fetchProjectsApi, createProjectApi } from '../../api/projects';
import { fetchSpacesApi } from '../../api/spaces';
import { ProjectCard } from '../../components/learning/ProjectCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Search, Plus, Filter, BookOpen, Layers, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'mastery' | 'recent' | 'title'>('recent');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { success } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [pData, sData] = await Promise.all([
          fetchProjectsApi(),
          fetchSpacesApi(),
        ]);
        setProjects(pData);
        setSpaces(sData);
        if (sData.length > 0) setSpaceId(sData[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !spaceId) return;
    setIsCreating(true);
    try {
      const newProj = await createProjectApi({
        spaceId,
        title,
        description,
        targetGoal: targetGoal || 'Master core concepts in this project',
      });
      setProjects([newProj, ...projects]);
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setTargetGoal('');
      success('Project Created', `"${newProj.title}" has been created successfully.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.targetGoal.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpace = selectedSpaceId === 'all' || p.spaceId === selectedSpaceId;
      return matchesSearch && matchesSpace;
    })
    .sort((a, b) => {
      if (sortBy === 'mastery') return b.masteryScore - a.masteryScore;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.lastStudiedAt).getTime() - new Date(a.lastStudiedAt).getTime();
    });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono text-signal-strong font-semibold uppercase tracking-wider bg-signal-soft px-2.5 py-0.5 rounded-full">
              Learning Journeys
            </span>
            <span className="text-xs font-mono text-ink-faint">
              {projects.length} Active Across {spaces.length} Spaces
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
            All Study Projects
          </h1>
          <p className="text-xs text-ink-faint mt-1">
            Browse, filter, and access all your topic-specific learning workspaces and AI companion contexts.
          </p>
        </div>

        <Button variant="signal" onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm font-semibold">
          <Plus className="w-4 h-4" /> Create Project
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-paper-sunken/60 border border-line rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-paper-raised border border-line rounded-lg text-ink focus:outline-none focus:border-ink-soft"
          />
        </div>

        {/* Space Filter & Sort Controls */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-ink-faint text-[11px] font-mono">Space:</span>
            <select
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-paper-raised border border-line rounded-lg text-ink focus:outline-none"
            >
              <option value="all">All Spaces</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-ink-faint text-[11px] font-mono">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-paper-raised border border-line rounded-lg text-ink focus:outline-none"
            >
              <option value="recent">Recently Studied</option>
              <option value="mastery">Highest Mastery</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-paper-raised rounded-2xl border border-line/70 space-y-4 max-w-lg mx-auto my-8">
          <div className="p-4 bg-signal-soft/60 text-signal-strong rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-xl font-semibold text-ink">
              {projects.length === 0 ? 'No projects yet' : 'No projects found'}
            </h3>
            <p className="text-xs text-ink-faint leading-relaxed">
              {projects.length === 0
                ? 'Create your first learning project to get started.'
                : 'Try adjusting your search terms or filter to view available study projects.'}
            </p>
          </div>
          <Button variant="signal" onClick={() => setIsModalOpen(true)} className="gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => (
            <ProjectCard key={proj.id} project={proj} />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Study Project"
        description="Configure a focused learning journey with target goals and companion materials."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Parent Space</label>
            <select
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-paper-raised border border-line rounded-md text-ink focus:outline-none"
              required
            >
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Project Title"
            placeholder="e.g. AI Agent Architectures & Tool Use"
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
              placeholder="e.g. Build multi-agent orchestration and evaluate ReAct loops"
              className="w-full px-3.5 py-2 text-xs bg-paper-raised border border-line rounded-md text-ink focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Key concepts, syllabus topics, and reference materials..."
              className="w-full px-3.5 py-2 text-xs bg-paper-raised border border-line rounded-md text-ink focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="signal" type="submit" isLoading={isCreating}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
