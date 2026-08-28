import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY_THEME = 'tique_theme_mode';

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeMode>('dark');

  const isDark = computed(() => currentTheme.value === 'dark');

  function applyThemeToDom(theme: ThemeMode) {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
  }

  function initTheme() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(
          STORAGE_KEY_THEME,
        ) as ThemeMode | null;
        if (saved === 'dark' || saved === 'light') {
          currentTheme.value = saved;
        } else if (
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: light)').matches
        ) {
          currentTheme.value = 'light';
        } else {
          currentTheme.value = 'dark';
        }
      }
    } catch {
      currentTheme.value = 'dark';
    }

    applyThemeToDom(currentTheme.value);
  }

  function setTheme(theme: ThemeMode) {
    currentTheme.value = theme;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_THEME, theme);
      }
    } catch {
      // ignore storage errors
    }
    applyThemeToDom(theme);
  }

  function toggleTheme() {
    setTheme(currentTheme.value === 'dark' ? 'light' : 'dark');
  }

  return {
    currentTheme,
    isDark,
    initTheme,
    setTheme,
    toggleTheme,
  };
});
