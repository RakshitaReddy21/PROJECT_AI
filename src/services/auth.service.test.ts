import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { appStorage } from './storage/localStorageStore';

describe('AuthService Authentication Tests', () => {
  beforeEach(() => {
    appStorage.resetToSeed();
  });

  it('allows registering a new user with valid email and password', async () => {
    const res = await authService.register({
      name: 'User A',
      email: 'usera@test.com',
      password: 'PasswordA123',
    });

    expect(res.user).toBeDefined();
    expect(res.user.email).toBe('usera@test.com');
    expect(res.user.name).toBe('User A');
    expect(res.token).toContain('jwt-');

    // Ensure plain text password or hash is NOT present on user object returned to client
    expect((res.user as any).password).toBeUndefined();
    expect((res.user as any).passwordHash).toBeUndefined();
  });

  it('rejects registering with an email that already exists', async () => {
    await authService.register({
      name: 'User A',
      email: 'usera@test.com',
      password: 'PasswordA123',
    });

    await expect(
      authService.register({
        name: 'User A Duplicate',
        email: 'usera@test.com',
        password: 'DifferentPassword123',
      })
    ).rejects.toThrow('An account with this email already exists. Please sign in instead.');
  });

  it('allows login with correct email and password', async () => {
    await authService.register({
      name: 'User A',
      email: 'usera@test.com',
      password: 'PasswordA123',
    });

    const loginRes = await authService.login('usera@test.com', 'PasswordA123');
    expect(loginRes.user.email).toBe('usera@test.com');
    expect(loginRes.token).toBeDefined();
  });

  it('rejects login with incorrect password', async () => {
    await authService.register({
      name: 'User A',
      email: 'usera@test.com',
      password: 'PasswordA123',
    });

    await expect(
      authService.login('usera@test.com', 'WrongPassword123')
    ).rejects.toThrow('Invalid email or password.');
  });

  it('rejects login for non-existent email', async () => {
    await expect(
      authService.login('nonexistent@test.com', 'SomePassword123')
    ).rejects.toThrow('Invalid email or password.');
  });

  it('isolates authentication credentials between User A and User B', async () => {
    await authService.register({
      name: 'User A',
      email: 'userA@test.com',
      password: 'PasswordA123',
    });

    await authService.register({
      name: 'User B',
      email: 'userB@test.com',
      password: 'PasswordB123',
    });

    // User A credentials work for User A
    const loginA = await authService.login('userA@test.com', 'PasswordA123');
    expect(loginA.user.email).toBe('usera@test.com');

    // User B credentials work for User B
    const loginB = await authService.login('userB@test.com', 'PasswordB123');
    expect(loginB.user.email).toBe('userb@test.com');

    // User A password fails for User B
    await expect(
      authService.login('userB@test.com', 'PasswordA123')
    ).rejects.toThrow('Invalid email or password.');
  });
});
