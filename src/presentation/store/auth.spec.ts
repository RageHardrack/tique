import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './auth';
import { ApiClient } from '../../infrastructure/api/api-client';

describe('useAuthStore - Authentication & Logout Safety', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('login flow', () => {
    it('should successfully authenticate, store token in localStorage and set user state', async () => {
      const authStore = useAuthStore();
      const mockResponse = {
        accessToken: 'jwt-token-12345',
        user: {
          id: 'user-1',
          email: 'daniel@lascar.dev',
          name: 'Daniel Colmenares',
          role: 'ADMIN' as const,
          createdAt: new Date().toISOString(),
        },
      };

      vi.spyOn(ApiClient, 'post').mockResolvedValueOnce(mockResponse);

      const user = await authStore.login('daniel@lascar.dev', 'admin123456');

      expect(user.id).toBe('user-1');
      expect(authStore.isAuthenticated).toBe(true);
      expect(authStore.isAdmin).toBe(true);
      expect(authStore.accessToken).toBe('jwt-token-12345');
      expect(localStorage.getItem('tique_access_token')).toBe('jwt-token-12345');
    });

    it('should handle invalid credentials error and keep state unauthenticated', async () => {
      const authStore = useAuthStore();
      vi.spyOn(ApiClient, 'post').mockRejectedValueOnce(
        new Error('Credenciales inválidas.')
      );

      await expect(
        authStore.login('wrong@lascar.dev', 'wrongpass')
      ).rejects.toThrow('Credenciales inválidas.');

      expect(authStore.isAuthenticated).toBe(false);
      expect(authStore.accessToken).toBeNull();
      expect(localStorage.getItem('tique_access_token')).toBeNull();
      expect(authStore.error).toBe('Credenciales inválidas.');
    });
  });

  describe('logout flow', () => {
    it('should completely clear user state and purge token from localStorage', async () => {
      const authStore = useAuthStore();
      
      // Simulate active session
      localStorage.setItem('tique_access_token', 'jwt-token-active');
      authStore.accessToken = 'jwt-token-active';
      authStore.user = {
        id: 'user-1',
        email: 'daniel@lascar.dev',
        name: 'Daniel',
        role: 'ADMIN' as const,
        createdAt: '',
      };

      expect(authStore.isAuthenticated).toBe(true);

      // Perform logout
      authStore.logout();

      expect(authStore.isAuthenticated).toBe(false);
      expect(authStore.user).toBeNull();
      expect(authStore.accessToken).toBeNull();
      expect(localStorage.getItem('financiapp_access_token')).toBeNull();
    });
  });

  describe('fetchMe session verification', () => {
    it('should automatically logout if token is expired or invalid on server', async () => {
      const authStore = useAuthStore();
      localStorage.setItem('financiapp_access_token', 'expired-token');
      authStore.accessToken = 'expired-token';

      vi.spyOn(ApiClient, 'get').mockRejectedValueOnce(
        new Error('API GET request failed with status 401')
      );

      await authStore.fetchMe();

      expect(authStore.isAuthenticated).toBe(false);
      expect(authStore.user).toBeNull();
      expect(authStore.accessToken).toBeNull();
      expect(localStorage.getItem('financiapp_access_token')).toBeNull();
    });
  });
});
