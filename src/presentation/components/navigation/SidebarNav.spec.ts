import { createPinia, setActivePinia } from 'pinia';

import { RouterLinkStub, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SidebarNav from './SidebarNav.vue';
import { useAuthStore } from '../../store/auth';

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useRoute: () => ({ path: '/dashboard' }),
    useRouter: () => ({ push: vi.fn() }),
  };
});

function mountSidebar(role: 'ADMIN' | 'USER') {
  const pinia = createPinia();
  setActivePinia(pinia);

  const auth = useAuthStore();
  auth.user = {
    id: 'u-1',
    email: `${role.toLowerCase()}@lascar.dev`,
    name: role,
    role,
    createdAt: '',
  };

  return mount(SidebarNav, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: RouterLinkStub,
        UIcon: true,
        UButton: true,
      },
    },
  });
}

function navPaths(wrapper: ReturnType<typeof mountSidebar>): string[] {
  return wrapper
    .findAllComponents(RouterLinkStub)
    .map((link) => String((link.props('to') as string) ?? ''));
}

describe('SidebarNav.vue - Integraciones entry (S10)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows Integraciones next to Usuarios for an ADMIN', () => {
    const wrapper = mountSidebar('ADMIN');
    const paths = navPaths(wrapper);

    expect(paths).toContain('/integraciones');
    expect(paths.indexOf('/integraciones')).toBe(
      paths.indexOf('/admin/users') + 1,
    );
    expect(
      wrapper
        .findAllComponents(RouterLinkStub)
        .find((link) => link.props('to') === '/integraciones')
        ?.text(),
    ).toContain('Integraciones');
  });

  it('does not show Integraciones for a regular USER', () => {
    const wrapper = mountSidebar('USER');

    expect(navPaths(wrapper)).not.toContain('/integraciones');
    expect(navPaths(wrapper)).not.toContain('/admin/users');
  });
});
