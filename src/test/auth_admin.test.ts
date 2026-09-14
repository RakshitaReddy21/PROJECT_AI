import { describe, it, expect, beforeEach } from 'vitest';
import { appStorage } from '../services/storage/localStorageStore';
import { authService } from '../services/auth.service';
import { adminService } from '../services/admin.service';

describe('Auth & Admin Governance Services', () => {
  beforeEach(() => {
    appStorage.resetToSeed();
  });

  it('authenticates learner with learner role and generated session token', async () => {
    const { user, token } = await authService.register({
      name: 'Student Learner',
      email: 'student@aurelia.app',
      password: 'Password123',
    });
    expect(user.role).toBe('learner');
    expect(token).toContain('jwt-');
  });

  it('authenticates admin with admin role when email contains admin', async () => {
    const { user, token } = await authService.register({
      name: 'Lead Admin',
      email: 'lead-admin@aurelia.app',
      password: 'Password123',
    });
    expect(user.role).toBe('admin');
    expect(token).toContain('jwt-');
  });

  it('registers a new user and persists in storage', async () => {
    const { user } = await authService.register({
      name: 'Jordan Lee',
      email: 'jordan@university.edu',
      password: 'Password123',
    });

    expect(user.id).toBeDefined();
    expect(user.name).toBe('Jordan Lee');

    const users = await adminService.getUsers();
    expect(users.some((u) => u.id === user.id)).toBe(true);
  });

  it('provides admin telemetry across system health and AI usage', async () => {
    const health = await adminService.getSystemHealth();
    expect(health.status).toBe('healthy');
    expect(health.vectorDbStatus).toBe('connected');

    const aiUsage = await adminService.getAIUsage();
    expect(aiUsage.length).toBeGreaterThan(0);
    expect(aiUsage[0].model).toBeDefined();

    const evaluation = await adminService.getAIEvaluation();
    expect(evaluation.groundednessScore).toBeGreaterThanOrEqual(90);
  });
});
