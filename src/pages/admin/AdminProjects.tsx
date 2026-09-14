import React, { useEffect, useState } from 'react';
import { FolderKanban } from 'lucide-react';
import { fetchSpacesApi } from '../../api/spaces';
import { fetchProjectsApi } from '../../api/projects';
import { Space, Project } from '../../types';

export const AdminProjects: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, p] = await Promise.all([fetchSpacesApi(), fetchProjectsApi()]);
        setSpaces(s);
        setProjects(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in text-[#292524]">
      <div>
        <h1 className="text-xl font-bold text-[#292524]">Cross-Tenant Spaces & Projects</h1>
        <p className="text-xs text-[#78716C] font-mono mt-1">
          Monitor all active study spaces, document counts, and concept graph indices across tenants.
        </p>
      </div>

      <div className="p-6 bg-white border border-[#F1E8E3] rounded-xl shadow-sm text-xs font-mono space-y-3">
        {spaces.length > 0 ? (
          spaces.map((space) => {
            const spaceProjects = projects.filter((p) => p.spaceId === space.id);
            const totalMaterials = spaceProjects.reduce((sum, p) => sum + p.materialCount, 0);
            const avgMastery =
              spaceProjects.length > 0
                ? Math.round(spaceProjects.reduce((sum, p) => sum + p.masteryScore, 0) / spaceProjects.length)
                : 0;

            return (
              <div key={space.id} className="flex items-center justify-between p-3 bg-[#FFF8F5] rounded-lg border border-[#F1E8E3]">
                <div>
                  <p className="font-bold text-[#292524]">{space.name}</p>
                  <p className="text-[11px] text-[#78716C]">
                    {spaceProjects.length} Active Project{spaceProjects.length === 1 ? '' : 's'} • {totalMaterials} Ingested Material{totalMaterials === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="text-[#137333] font-bold bg-[#E6F4EA] px-2.5 py-1 rounded border border-[#CEEAD6]">{avgMastery}% Avg Mastery</span>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-[#78716C] font-mono">
            No active spaces registered in the platform.
          </div>
        )}
      </div>
    </div>
  );
};
