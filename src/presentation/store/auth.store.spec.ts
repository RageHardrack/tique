import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from './auth';
import { ApiClient } from '../../infrastructure/api/api-client';

vi.mock('../../infrastructure/api/api-client', () => ({
  ApiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initial state be unauthenticated', () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.accessToken).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('should login successfully and store token', async () => {
    const mockAuthRes = {
      accessToken: 'jwt-token-xyz',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        role: 'ADMIN' as const,
        createdAt: new Date().toISOString(),
      },
    };
    vi.mocked(ApiClient.post).mockResolvedValueOnce(mockAuthRes);

    const store = useAuthStore();
    await store.login('test@example.com', 'password123');

    expect(ApiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
    expect(store.accessToken).toBe('jwt-token-xyz');
    expect(store.user).toEqual(mockAuthRes.user);
    expect(store.isAuthenticated).toBe(true);
    expect(store.isAdmin).toBe(true);
    expect(localStorage.getItem('tique_access_token')).toBe(
      'jwt-token-xyz',
    );
  });

  it('should logout cleanly and clear localStorage', () => {
    const store = useAuthStore();
    localStorage.setItem('tique_access_token', 'token-123');

    store.logout();

    expect(store.user).toBeNull();
    expect(store.accessToken).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.getItem('tique_access_token')).toBeNull();
  });
});
