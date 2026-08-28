import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import { ApiClient } from '../../infrastructure/api/api-client';
import type { AuthResponse, User } from '../../core/entities/User';

const TOKEN_KEY = 'tique_access_token';
const LEGACY_TOKEN_KEY = 'financiapp_access_token';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(
    localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY),
  );
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  function setToken(token: string | null) {
    accessToken.value = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
  }

  async function login(email: string, password: string): Promise<User> {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await ApiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      setToken(res.accessToken);
      user.value = res.user;
      return res.user;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchMe() {
    if (!accessToken.value) return;
    isLoading.value = true;
    try {
      user.value = await ApiClient.get<User>('/auth/me', accessToken.value);
    } catch {
      logout();
    } finally {
      isLoading.value = false;
    }
  }

  function logout() {
    setToken(null);
    user.value = null;
  }

  return {
    user,
    accessToken,
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
    login,
    fetchMe,
    logout,
  };
});
