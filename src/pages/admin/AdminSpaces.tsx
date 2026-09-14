import React, { useEffect, useState } from 'react';
import { Space, User } from '../../types';
import { fetchSpacesApi, createSpaceApi } from '../../api/spaces';
import { fetchUsersApi } from '../../api/admin';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { FolderKanban, Plus, Search, Users, BookOpen, Layers, Shield } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminSpaces: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { success } = useToast();

  useEffect(() => {
    async function loadSpaces() {
      try {
        const [sData, uData] = await Promise.all([
          fetchSpacesApi(),
          fetchUsersApi(),
        ]);
        setSpaces(sData);
        setUsers(uData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSpaces();
  }, []);

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const created = await createSpaceApi({ name, description });
      const formattedSpace: Space = {
        ...created,
        color: created.color || '#F29B73',
        icon: created.icon || 'Folder',
        createdAt: created.createdAt || new Date().toISOString(),
        updatedAt: created.updatedAt || new Date().toISOString(),
        projectCount: created.projectCount ?? 0,
      };
      setSpaces((prev) => [formattedSpace, ...prev.filter((s) => s.id !== formattedSpace.id)]);
      setIsModalOpen(false);
      setName('');
      setDescription('');
      success('Space Registered', `"${formattedSpace.name}" added to platform governance registry.`);
    } catch (err) {
      console.error('Failed to create space:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = spaces.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in text-[#292524] max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1E8E3]">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono text-[#E9825B] font-semibold uppercase tracking-wider bg-[#FFF0E8] border border-[#F8C9B0] px-2.5 py-0.5 rounded-full">
              Platform Registry
            </span>
            <span className="text-xs font-mono text-[#78716C]">
              {spaces.length} Managed Subject Spaces
            </span>
          </div>
          <h1 className="text-2xl font-bold font-sans text-[#292524] tracking-tight">
            Subject Spaces Governance
          </h1>
          <p className="text-xs text-[#78716C] font-mono mt-1">
            Configure subject domain boundaries, monitor learner enrollments, and manage cross-project resources.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="bg-[#F29B73] hover:bg-[#E9825B] text-white gap-2 font-mono text-xs shadow-sm"
        >
          <Plus className="w-4 h-4" /> Provision Space
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 bg-white border border-[#F1E8E3] rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono text-[#78716C] uppercase">Active Subject Spaces</span>
          <div className="text-2xl font-mono font-bold text-[#292524]">{spaces.length}</div>
          <span className="text-[10px] font-mono text-[#137333]">100% Operational</span>
        </div>

        <div className="p-5 bg-white border border-[#F1E8E3] rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono text-[#78716C] uppercase">Total Child Projects</span>
          <div className="text-2xl font-mono font-bold text-[#E9825B]">
            {spaces.reduce((sum, s) => sum + s.projectCount, 0)}
          </div>
          <span className="text-[10px] font-mono text-[#78716C]">Linked to vector indices</span>
        </div>

        <div className="p-5 bg-white border border-[#F1E8E3] rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono text-[#78716C] uppercase">Enrolled Active Learners</span>
          <div className="text-2xl font-mono font-bold text-[#137333]">{users.length}</div>
          <span className="text-[10px] font-mono text-[#78716C]">Across all institutions</span>
        </div>
      </div>

      {/* Spaces Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search managed spaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FFF8F5] border border-[#F1E8E3] rounded-lg text-[#292524] focus:outline-none focus:border-[#F29B73]"
            />
          </div>
        </div>

        <div className="bg-white border border-[#F1E8E3] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#FFF8F5] text-[#78716C] border-b border-[#F1E8E3] uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3">Space Domain</th>
                  <th className="px-5 py-3">Child Projects</th>
                  <th className="px-5 py-3">Learners</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1E8E3]">
                {filtered.map((space) => (
                  <tr key={space.id} className="hover:bg-[#FFF0E8]/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3 font-sans">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                          style={{ backgroundColor: space.color || '#F29B73' }}
                        >
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#292524]">{space.name}</p>
                          <p className="text-[11px] text-[#78716C] line-clamp-1">{space.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#78716C]">
                      {space.projectCount} Projects
                    </td>
                    <td className="px-5 py-3.5 text-[#78716C]">
                      {users.length} Enrolled
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#78716C]">
                      {new Date(space.createdAt || space.updatedAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="px-2.5 py-1 text-xs text-[#E9825B] hover:text-[#F29B73] bg-[#FFF0E8] hover:bg-[#FFF0E8]/80 rounded border border-[#F8C9B0] transition-colors font-semibold">
                        Configure
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Space Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Platform Space"
        description="Register a new academic subject domain in the system governance catalog."
      >
        <form onSubmit={handleCreateSpace} className="space-y-4 text-xs">
          <Input
            label="Space Title"
            placeholder="e.g. Cognitive Neuroscience & AI"
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
              placeholder="Domain scope, targeted learner levels, and department..."
              className="w-full px-3.5 py-2 text-xs bg-paper-raised border border-line rounded-md text-ink focus:outline-none"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="signal" type="submit" isLoading={isCreating}>
              Provision Space
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
