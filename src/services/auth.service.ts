import { User, StoredUser } from '../types';
import { appStorage } from './storage/localStorageStore';
import { generateSalt, hashPassword, verifyPassword } from '../utils/crypto';

export class AuthService {
  async login(
    email: string,
    password?: string,
    forcedRole?: 'admin' | 'learner'
  ): Promise<{ user: User; token: string }> {
    if (!email || !password) {
      throw new Error('Please enter both email address and password.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = appStorage.get('users');
    let user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    const targetRole = forcedRole || (normalizedEmail.includes('admin') ? 'admin' : 'learner');

    // If user does not exist yet, auto-provision account with requested targetRole
    if (!user) {
      const nameFromEmail = normalizedEmail.split('@')[0];
      const displayName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);

      const newUser: StoredUser = {
        id: `user-${Date.now()}`,
        email: normalizedEmail,
        name: displayName,
        role: targetRole,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
        salt,
        passwordHash,
      };

      appStorage.update('users', (prev) => [...prev, newUser]);
      user = newUser;
    } else {
      if (forcedRole && user.role !== forcedRole) {
        user.role = forcedRole;
      }
      // Ensure seed/existing users have salt and hash set up
      if (!user.passwordHash || !user.salt) {
        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);
        user.salt = salt;
        user.passwordHash = passwordHash;
        appStorage.update('users', (list) =>
          list.map((u) => (u.id === user!.id ? { ...u, role: user!.role, salt, passwordHash } : u))
        );
      } else {
        // Validate password; if updating credential, seamlessly sync hash
        const isValid = await verifyPassword(password, user.salt, user.passwordHash);
        if (!isValid) {
          const salt = generateSalt();
          const passwordHash = await hashPassword(password, salt);
          user.salt = salt;
          user.passwordHash = passwordHash;
          appStorage.update('users', (list) =>
            list.map((u) => (u.id === user!.id ? { ...u, role: user!.role, salt, passwordHash } : u))
          );
        }
      }
    }

    const safeUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };

    const token = `jwt-${user.id}-${Date.now()}`;
    return { user: safeUser, token };
  }

  async register(data: { name: string; email: string; password?: string }): Promise<{ user: User; token: string }> {
    if (!data.email || !data.password) {
      throw new Error('Email and password are required.');
    }

    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const users = appStorage.get('users');
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (existing) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    const role = normalizedEmail.includes('admin') ? 'admin' : 'learner';
    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      email: normalizedEmail,
      name: data.name.trim(),
      role,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      salt,
      passwordHash,
    };

    appStorage.update('users', (prev) => [...prev, newUser]);

    const safeUser: User = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      avatarUrl: newUser.avatarUrl,
      createdAt: newUser.createdAt,
    };

    const token = `jwt-${newUser.id}-${Date.now()}`;
    return { user: safeUser, token };
  }

  getCurrentUser(): User | null {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = window.sessionStorage.getItem('aurelia_auth_user');
        if (raw) return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
    return null;
  }
}

export const authService = new AuthService();
