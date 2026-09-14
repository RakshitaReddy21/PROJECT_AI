import { Space } from '../types';
import { appStorage } from './storage/localStorageStore';
import { activityService } from './activity.service';
import { authService } from './auth.service';

export class SpacesService {
  async getSpaces(userId?: string): Promise<Space[]> {
    const currentUser = authService.getCurrentUser();
    const targetUserId = userId || currentUser?.id;
    const allSpaces = appStorage.get('spaces');

    // Admin can view all spaces if requesting admin overview
    if (currentUser?.role === 'admin' && !userId) {
      return allSpaces;
    }

    if (!targetUserId) return allSpaces;
    return allSpaces.filter((s) => !s.userId || s.userId === targetUserId);
  }

  async getSpace(id: string, userId?: string): Promise<Space | null> {
    const currentUser = authService.getCurrentUser();
    const targetUserId = userId || currentUser?.id;
    const spaces = appStorage.get('spaces');
    const space = spaces.find((s) => s.id === id);
    if (!space) return null;

    if (currentUser?.role === 'admin') return space;
    if (space.userId && targetUserId && space.userId !== targetUserId) {
      // Allow fallback access for guest/demo view
      return space;
    }
    return space;
  }

  async createSpace(
    data: {
      name: string;
      description: string;
      color?: string;
      icon?: string;
    },
    userId?: string
  ): Promise<Space> {
    const currentUser = authService.getCurrentUser();
    const ownerId = userId || currentUser?.id || 'learner-user-id';

    const newSpace: Space = {
      id: `space-${Date.now()}`,
      userId: ownerId,
      name: data.name,
      description: data.description,
      color: data.color || '#3F7A5C',
      icon: data.icon || 'Folder',
      projectCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    appStorage.update('spaces', (prev) => [newSpace, ...prev]);

    await activityService.logActivity({
      userId: ownerId,
      userName: currentUser?.name || 'Learner',
      type: 'material_uploaded',
      description: `Created new subject space: "${newSpace.name}".`,
    });

    return newSpace;
  }

  async updateSpace(id: string, data: Partial<Space>): Promise<Space> {
    const currentUser = authService.getCurrentUser();
    const spaces = appStorage.get('spaces');
    const space = spaces.find((s) => s.id === id);
    if (!space) throw new Error('Space not found');

    if (currentUser?.role !== 'admin' && space.userId && space.userId !== currentUser?.id) {
      throw new Error('Unauthorized: Access to space denied');
    }

    const updated: Space = {
      ...space,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    appStorage.update('spaces', (list) => list.map((s) => (s.id === id ? updated : s)));
    return updated;
  }

  async deleteSpace(id: string): Promise<boolean> {
    const currentUser = authService.getCurrentUser();
    const spaces = appStorage.get('spaces');
    const space = spaces.find((s) => s.id === id);
    if (!space) return false;

    if (currentUser?.role !== 'admin' && space.userId && space.userId !== currentUser?.id) {
      throw new Error('Unauthorized: Access to space denied');
    }

    appStorage.update('spaces', (list) => list.filter((s) => s.id !== id));
    // Also remove associated projects
    appStorage.update('projects', (projects) => projects.filter((p) => p.spaceId !== id));
    return true;
  }
}

export const spacesService = new SpacesService();
