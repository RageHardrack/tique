import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useThemeStore } from './theme';

describe('useThemeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.documentElement.className = '';
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  it('should initialize with dark mode by default', () => {
    const store = useThemeStore();
    store.initTheme();
    expect(store.currentTheme).toBe('dark');
    expect(store.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should toggle theme from dark to light and update DOM', () => {
    const store = useThemeStore();
    store.initTheme();

    store.toggleTheme();
    expect(store.currentTheme).toBe('light');
    expect(store.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'tique_theme_mode',
      'light',
    );
  });

  it('should load saved theme from localStorage', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('light');
    const store = useThemeStore();
    store.initTheme();

    expect(store.currentTheme).toBe('light');
    expect(store.isDark).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });
});
