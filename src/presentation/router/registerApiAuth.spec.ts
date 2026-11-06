import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { defineComponent } from 'vue';

import { ApiClient } from '../../infrastructure/api/api-client';
import { useAuthStore } from '../store/auth';
import { registerApiAuth } from './registerApiAuth';

const Blank = defineComponent({ template: '<div />' });

const buildRouter = (): Router =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: Blank },
      { path: '/dashboard', name: 'dashboard', component: Blank, meta: { requiresAuth: true } },
      { path: '/about', name: 'about', component: Blank },
    ],
  });

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('registerApiAuth', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    ApiClient.configureAuth(null);
  });

  it('sends the signed-in user token on calls that pass none', async () => {
    const router = buildRouter();
    const authStore = useAuthStore();
    authStore.accessToken = 'session-token';
    registerApiAuth(router, authStore);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse([]));

    await ApiClient.get('/accounts?userId=u1');

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(options?.headers).toEqual({ Authorization: 'Bearer session-token' });
  });

  it('logs out and goes to login when a protected page gets a 401', async () => {
    const router = buildRouter();
    await router.push('/dashboard');
    const authStore = useAuthStore();
    authStore.accessToken = 'expired-token';
    localStorage.setItem('tique_access_token', 'expired-token');
    registerApiAuth(router, authStore);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401));

    await expect(ApiClient.get('/accounts')).rejects.toThrow('Unauthorized');
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));

    expect(authStore.accessToken).toBeNull();
    expect(localStorage.getItem('tique_access_token')).toBeNull();
  });

  it('logs out without navigating when the current page is public', async () => {
    const router = buildRouter();
    await router.push('/about');
    const authStore = useAuthStore();
    authStore.accessToken = 'expired-token';
    registerApiAuth(router, authStore);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401));

    await expect(ApiClient.get('/accounts')).rejects.toThrow('Unauthorized');

    expect(authStore.accessToken).toBeNull();
    expect(router.currentRoute.value.name).toBe('about');
  });
});
