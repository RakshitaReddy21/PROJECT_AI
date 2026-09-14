import React, { useEffect, useState } from 'react';
import { Space, Project } from '../../types';
import { fetchSpacesApi, createSpaceApi } from '../../api/spaces';
import { fetchProjectsApi } from '../../api/projects';
import { SpaceCard } from '../../components/learning/SpaceCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/motion';
import { FolderPlus, FolderKanban, Sparkles, Compass } from 'lucide-react';

export const SpacesList: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadSpacesAndProjects() {
      try {
        const [spacesData, projectsData] = await Promise.all([
          fetchSpacesApi(),
          fetchProjectsApi(),
        ]);
        setSpaces(spacesData);
        setProjects(projectsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSpacesAndProjects();
  }, []);

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const created = await createSpaceApi({ name, description });
      const formattedSpace: Space = {
        ...created,
        color: created.color || '#FF6B35',
        icon: created.icon || 'Folder',
        createdAt: created.createdAt || new Date().toISOString(),
        updatedAt: created.updatedAt || new Date().toISOString(),
        projectCount: created.projectCount ?? 0,
      };
      setSpaces((prev) => [formattedSpace, ...prev.filter((s) => s.id !== formattedSpace.id)]);
      setIsModalOpen(false);
      setName('');
      setDescription('');
    } catch (err) {
      console.error('Failed to create space:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <PageTransition className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F4E3D8]">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono text-[#E85A2A] font-semibold uppercase tracking-wider bg-[#FFEBE0] border border-[#FFC8B0] px-2.5 py-0.5 rounded-full">
              YOUR LEARNING UNIVERSE
            </span>
            <span className="text-xs font-mono text-[#574E4A]">
              {spaces.length} Active Subject Worlds
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-[#1F1917]">
            Study Spaces & Learning Domains
          </h1>
          <p className="text-xs text-[#574E4A] mt-1">
            Organize your projects, document materials, and concept graphs by academic subject domain.
          </p>
        </div>
        <Button variant="signal" onClick={() => setIsModalOpen(true)} className="gap-2 font-semibold bg-[#FF6B35] hover:bg-[#E85A2A] text-white shadow-sm">
          <FolderPlus className="w-4 h-4" /> Create Space
        </Button>
      </div>

      {spaces.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#F4E3D8] space-y-4 max-w-lg mx-auto my-8 relative overflow-hidden shadow-sm">
          <div className="p-4 bg-[#FFEBE0] text-[#FF6B35] border border-[#FFC8B0] rounded-2xl w-14 h-14 mx-auto flex items-center justify-center shadow-sm">
            <Compass className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-xl font-semibold text-[#1F1917]">Your Learning Universe is Empty</h3>
            <p className="text-xs text-[#574E4A] leading-relaxed">
              Nothing here yet. Create your first subject space to begin building your concept knowledge tree.
            </p>
          </div>
          <Button variant="signal" onClick={() => setIsModalOpen(true)} className="gap-2 font-semibold bg-[#FF6B35] hover:bg-[#E85A2A] text-white shadow-sm">
            <FolderPlus className="w-4 h-4" /> Create First Space
          </Button>
        </div>
      ) : (
        <StaggerContainer staggerDelay={0.08} baseDelay={0.05} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => {
            const spaceProjects = projects.filter((p) => p.spaceId === space.id);
            const activeProjectNames = spaceProjects.map((p) => p.title);
            const overallProgress =
              spaceProjects.length > 0
                ? Math.round(
                    spaceProjects.reduce((sum, p) => sum + (p.masteryScore || 0), 0) /
                      spaceProjects.length
                  )
                : 0;

            return (
              <StaggerItem key={space.id}>
                <SpaceCard
                  space={space}
                  activeProjectNames={activeProjectNames}
                  overallProgress={overallProgress}
                />
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}

      {/* Create Space Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Study Space"
        description="A space groups related projects, textbooks, and concept mastery goals."
      >
        <form onSubmit={handleCreateSpace} className="space-y-4">
          <Input
            label="Space Title"
            placeholder="e.g. Computer Science & AI"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of subjects covered in this space..."
              className="w-full px-3.5 py-2 text-xs bg-paper-raised border border-line rounded-md text-ink focus:outline-none focus:border-ink-soft"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="signal" type="submit" isLoading={isCreating}>
              Create Space
            </Button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
};
