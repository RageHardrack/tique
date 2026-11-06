import type { Router } from 'vue-router';

import type { useAuthStore } from '../store/auth';
import { ApiClient } from '../../infrastructure/api/api-client';

type AuthStore = ReturnType<typeof useAuthStore>;

/**
 * Wires the session into the API client: every request carries the current
 * token, and a rejected token signs the user out. The JWT has no refresh flow,
 * so an expired session can only end in a new login.
 */
export function registerApiAuth(router: Router, authStore: AuthStore): void {
  ApiClient.configureAuth({
    getToken: () => authStore.accessToken,
    onUnauthorized: () => {
      authStore.logout();
      // Public pages stay put; the route guard covers the initial navigation.
      if (router.currentRoute.value.meta.requiresAuth) {
        void router.push({ name: 'login' });
      }
    },
  });
}
