import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Sparkles,
  Brain,
  HelpCircle,
  FileUp,
  TrendingUp,
  BarChart3,
  Settings,
  FolderKanban,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { appStorage } from '../../services/storage/localStorageStore';
import { fetchProjectsApi } from '../../api/projects';
import { fetchSpacesApi } from '../../api/spaces';
import { Project, Space } from '../../types';
import { motion, AnimatePresence } from '../motion';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Actions' | 'Navigation' | 'Study Modules' | 'Projects' | 'Spaces';
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  description?: string;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [spacesList, setSpacesList] = useState<Space[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      // Sync from local storage immediately
      const storedProjects = appStorage.get('projects') || [];
      const storedSpaces = appStorage.get('spaces') || [];
      setProjectsList(storedProjects);
      setSpacesList(storedSpaces);

      // Async fetch to ensure fresh server/mock data
      fetchProjectsApi()
        .then((data) => {
          if (data && data.length > 0) setProjectsList(data);
        })
        .catch(() => {});

      fetchSpacesApi()
        .then((data) => {
          if (data && data.length > 0) setSpacesList(data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const userProjects = user ? projectsList.filter((p) => p.userId === user.id || !p.userId || user.role === 'admin') : projectsList;
  const activeProject = userProjects[0] || projectsList[0] || null;

  // Build dynamic project search entries
  const projectCommands: CommandItem[] = userProjects.map((project) => ({
    id: `project-${project.id}`,
    title: project.title,
    category: 'Projects',
    icon: BookOpen,
    shortcut: project.spaceName || 'Project',
    description: project.description || project.targetGoal,
    onSelect: () => {
      navigate(`/projects/${project.id}/overview`);
      onClose();
    },
  }));

  // Build dynamic space search entries
  const spaceCommands: CommandItem[] = spacesList.map((space) => ({
    id: `space-${space.id}`,
    title: space.name,
    category: 'Spaces',
    icon: FolderKanban,
    shortcut: `${space.projectCount || 0} projects`,
    description: space.description,
    onSelect: () => {
      navigate('/spaces');
      onClose();
    },
  }));

  const baseCommands: CommandItem[] = [
    {
      id: 'continue-learning',
      title: activeProject
        ? `Continue Learning: ${activeProject.title}`
        : 'Explore Study Spaces',
      category: 'Actions',
      icon: Sparkles,
      shortcut: '↵',
      onSelect: () => {
        if (activeProject) {
          navigate(`/projects/${activeProject.id}/overview`);
        } else {
          navigate('/spaces');
        }
        onClose();
      },
    },
    {
      id: 'ask-tutor',
      title: activeProject
        ? `Ask AI Tutor (${activeProject.title})`
        : 'Ask AI Tutor',
      category: 'Actions',
      icon: Brain,
      shortcut: 'T',
      onSelect: () => {
        if (activeProject) {
          navigate(`/projects/${activeProject.id}/tutor`);
        } else {
          navigate('/spaces');
        }
        onClose();
      },
    },
    {
      id: 'take-quiz',
      title: activeProject
        ? `Start Adaptive Quiz: ${activeProject.title}`
        : 'Start Adaptive Quiz',
      category: 'Actions',
      icon: HelpCircle,
      shortcut: 'Q',
      onSelect: () => {
        if (activeProject) {
          navigate(`/projects/${activeProject.id}/quiz`);
        } else {
          navigate('/spaces');
        }
        onClose();
      },
    },
    {
      id: 'upload-material',
      title: activeProject
        ? `Upload Study Material (${activeProject.title})`
        : 'Upload Study Material',
      category: 'Actions',
      icon: FileUp,
      onSelect: () => {
        if (activeProject) {
          navigate(`/projects/${activeProject.id}/materials`);
        } else {
          navigate('/spaces');
        }
        onClose();
      },
    },
    {
      id: 'nav-dashboard',
      title: 'Go to Learner Dashboard',
      category: 'Navigation',
      icon: Layers,
      onSelect: () => {
        navigate('/dashboard');
        onClose();
      },
    },
    {
      id: 'nav-spaces',
      title: 'Explore Study Spaces',
      category: 'Navigation',
      icon: FolderKanban,
      onSelect: () => {
        navigate('/spaces');
        onClose();
      },
    },
    {
      id: 'nav-projects',
      title: 'Browse All Projects Catalog',
      category: 'Navigation',
      icon: BookOpen,
      onSelect: () => {
        navigate('/projects');
        onClose();
      },
    },
    {
      id: 'nav-mastery',
      title: 'View Concept Mastery Landscape',
      category: 'Study Modules',
      icon: Brain,
      onSelect: () => {
        if (activeProject) {
          navigate(`/projects/${activeProject.id}/mastery`);
        } else {
          navigate('/spaces');
        }
        onClose();
      },
    },
    {
      id: 'nav-growth',
      title: 'View Growth Trajectory & Insights',
      category: 'Study Modules',
      icon: TrendingUp,
      onSelect: () => {
        navigate('/growth');
        onClose();
      },
    },
    {
      id: 'nav-analytics',
      title: 'View Global Learning Analytics',
      category: 'Study Modules',
      icon: BarChart3,
      onSelect: () => {
        navigate('/analytics');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      title: 'Companion Settings & Profile',
      category: 'Navigation',
      icon: Settings,
      onSelect: () => {
        navigate('/settings');
        onClose();
      },
    },
  ];

  if (user?.role === 'admin') {
    baseCommands.push({
      id: 'nav-admin',
      title: 'Switch to Admin Governance Portal',
      category: 'Navigation',
      icon: ShieldAlertIcon,
      onSelect: () => {
        navigate('/admin');
        onClose();
      },
    });
  }

  const allCommands = [...projectCommands, ...spaceCommands, ...baseCommands];

  const filtered = allCommands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(query.toLowerCase())) ||
      (c.shortcut && c.shortcut.toLowerCase().includes(query.toLowerCase()))
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].onSelect();
        }
      }
    },
    [isOpen, onClose, filtered, selectedIndex]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-stone-900/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          className="w-full max-w-xl bg-white border border-[#F1E8E3] rounded-2xl shadow-xl overflow-hidden"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-[#F1E8E3] gap-3 bg-[#FFF8F5]">
            <Search className="w-4 h-4 text-[#78716C] flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search projects (e.g. DSA), spaces, topics, tutor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm bg-transparent border-none text-[#292524] placeholder:text-[#78716C] focus:outline-none"
            />
            <span className="text-[10px] font-mono text-[#78716C] bg-white px-2 py-0.5 rounded border border-[#F1E8E3]">
              ESC
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1 bg-white">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#78716C]">
                No matching projects, spaces, or actions found for "{query}".
              </div>
            ) : (
              filtered.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={item.onSelect}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors text-left ${
                      isSelected
                        ? 'bg-[#FFF0E8] text-[#E9825B] font-semibold'
                        : 'text-[#78716C] hover:bg-[#FFF8F5]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <div
                        className={`p-1 rounded flex-shrink-0 ${
                          isSelected ? 'bg-[#F29B73] text-white' : 'bg-[#FFF8F5] text-[#78716C]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <span className="block truncate">{item.title}</span>
                        {item.description && (
                          <span className="block text-[10px] text-[#A8A29E] font-normal truncate">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-mono text-[#78716C] uppercase bg-[#FFF0E8] px-1.5 py-0.5 rounded border border-[#F8C9B0]/40">
                        {item.category}
                      </span>
                      {item.shortcut && (
                        <span className="text-[10px] font-mono text-[#78716C] bg-[#FFF8F5] px-1.5 py-0.5 rounded border border-[#F1E8E3] max-w-[120px] truncate hidden sm:inline-block">
                          {item.shortcut}
                        </span>
                      )}
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#F29B73]" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[#F1E8E3] bg-[#FFF8F5] flex items-center justify-between text-[11px] font-mono text-[#78716C]">
            <span>Navigate with ↑ ↓ and Enter</span>
            <span>Aurelia Command Engine</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const ShieldAlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);
