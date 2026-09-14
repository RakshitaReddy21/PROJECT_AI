import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, Material, Concept } from '../types';
import { fetchProjectApi } from '../api/projects';
import { fetchMaterialsApi } from '../api/materials';
import { fetchConceptsApi } from '../api/mastery';

interface ProjectContextType {
  projectId: string;
  project: Project | null;
  materials: Material[];
  concepts: Concept[];
  loading: boolean;
  error: string | null;
  refreshProject: () => Promise<void>;
  refreshMaterials: () => Promise<void>;
  refreshConcepts: () => Promise<void>;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ projectId: string; children: React.ReactNode }> = ({ projectId, children }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pData, mData, cData] = await Promise.all([
        fetchProjectApi(projectId),
        fetchMaterialsApi(projectId),
        fetchConceptsApi(projectId),
      ]);
      setProject(pData);
      setMaterials(mData);
      setConcepts(cData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const refreshProject = async () => {
    const pData = await fetchProjectApi(projectId);
    setProject(pData);
  };

  const refreshMaterials = async () => {
    const mData = await fetchMaterialsApi(projectId);
    setMaterials(mData);
  };

  const refreshConcepts = async () => {
    const cData = await fetchConceptsApi(projectId);
    setConcepts(cData);
  };

  return (
    <ProjectContext.Provider
      value={{
        projectId,
        project,
        materials,
        concepts,
        loading,
        error,
        refreshProject,
        refreshMaterials,
        refreshConcepts,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

