import { Project, LearningGoal } from '../types';
import { appStorage } from './storage/localStorageStore';
import { activityService } from './activity.service';
import { authService } from './auth.service';

export class ProjectsService {
  /**
   * Enforces server/service-side project access authorization.
   * Throws an error if the project does not exist or does not belong to the user.
   */
  assertProjectAccess(projectId: string, userId?: string): Project {
    const currentUser = authService.getCurrentUser();
    const targetUserId = userId || currentUser?.id;
    const projects = appStorage.get('projects');
    const project = projects.find((p) => p.id === projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    if (currentUser?.role === 'admin') {
      return project;
    }

    if (!targetUserId || (project.userId && project.userId !== targetUserId)) {
      throw new Error('Unauthorized: You do not have permission to access this project');
    }

    return project;
  }

  async getProjects(spaceId?: string, userId?: string): Promise<Project[]> {
    const currentUser = authService.getCurrentUser();
    const targetUserId = userId || currentUser?.id;
    const allProjects = appStorage.get('projects');

    // Admin can view all projects if requesting global admin overview
    let projects = allProjects;
    if (currentUser?.role !== 'admin' || userId) {
      if (!targetUserId) return [];
      projects = allProjects.filter((p) => p.userId === targetUserId);
    }

    if (spaceId) {
      return projects.filter((p) => p.spaceId === spaceId);
    }
    return projects;
  }

  async getProject(id: string, userId?: string): Promise<Project | null> {
    try {
      return this.assertProjectAccess(id, userId);
    } catch {
      return null;
    }
  }

  async getLearningGoal(projectId: string): Promise<LearningGoal | null> {
    this.assertProjectAccess(projectId);
    const goals = appStorage.get('learningGoals');
    return goals[projectId] || null;
  }

  async createProject(
    data: {
      spaceId: string;
      title: string;
      description: string;
      targetGoal: string;
    },
    userId?: string
  ): Promise<Project> {
    const currentUser = authService.getCurrentUser();
    const ownerId = userId || currentUser?.id;
    if (!ownerId) {
      throw new Error('Unauthorized: Authentication required to create a project');
    }

    const spaces = appStorage.get('spaces');
    const space = spaces.find((s) => s.id === data.spaceId);

    const projectId = `proj-${Date.now()}`;
    const newProject: Project = {
      id: projectId,
      userId: ownerId,
      spaceId: data.spaceId,
      spaceName: space ? space.name : 'General',
      title: data.title,
      description: data.description,
      targetGoal: data.targetGoal,
      masteryScore: 0,
      materialCount: 0,
      conceptCount: 0,
      lastStudiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Increment project count in space
    if (space) {
      appStorage.update('spaces', (spList) =>
        spList.map((s) =>
          s.id === data.spaceId ? { ...s, projectCount: s.projectCount + 1 } : s
        )
      );
    }

    // Set initial learning goal
    const newGoal: LearningGoal = {
      id: `goal-${Date.now()}`,
      projectId,
      title: data.targetGoal,
      targetScore: 85,
      currentScore: 0,
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    appStorage.update('learningGoals', (goals) => ({
      ...goals,
      [projectId]: newGoal,
    }));

    appStorage.update('projects', (prev) => [newProject, ...prev]);

    await activityService.logActivity({
      userId: ownerId,
      userName: currentUser?.name || 'Learner',
      projectId,
      projectTitle: newProject.title,
      type: 'material_uploaded',
      description: `Created new project "${newProject.title}" with learning goal: "${data.targetGoal}".`,
    });

    return newProject;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const existing = this.assertProjectAccess(id);
    const updated: Project = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    appStorage.update('projects', (list) => list.map((p) => (p.id === id ? updated : p)));
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    this.assertProjectAccess(id);

    const projects = appStorage.get('projects');
    const project = projects.find((p) => p.id === id);
    if (!project) return false;

    // Decrement space project count
    appStorage.update('spaces', (spaces) =>
      spaces.map((s) =>
        s.id === project.spaceId ? { ...s, projectCount: Math.max(0, s.projectCount - 1) } : s
      )
    );

    // Delete project
    appStorage.update('projects', (list) => list.filter((p) => p.id !== id));

    // Delete child entities
    appStorage.update('materials', (list) => list.filter((m) => m.projectId !== id));
    appStorage.update('documentChunks', (list) => list.filter((c) => c.projectId !== id));
    appStorage.update('concepts', (list) => list.filter((c) => c.projectId !== id));
    appStorage.update('quizQuestions', (map) => {
      const copy = { ...map };
      delete copy[id];
      return copy;
    });
    appStorage.update('quizResults', (map) => {
      const copy = { ...map };
      delete copy[id];
      return copy;
    });
    appStorage.update('assessmentSubmissions', (map) => {
      const copy = { ...map };
      delete copy[id];
      return copy;
    });

    return true;
  }
}

export const projectsService = new ProjectsService();
