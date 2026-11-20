import { createPinia, setActivePinia } from 'pinia';

import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useAuthStore } from '../../store/auth';
import MobileBottomNav from './MobileBottomNav.vue';

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useRoute: () => ({ path: '/dashboard' }),
  };
});

describe('MobileBottomNav.vue - Mobile First Navigation', () => {
  const defaultMountOptions = {
    global: {
      plugins: [createPinia()],
      stubs: {
        RouterLink: RouterLinkStub,
        UIcon: true,
        UButton: true,
        USlideover: {
          template:
            '<div v-if="open" data-testid="slideover"><slot /><slot name="content" /></div>',
          props: ['open'],
        },
      },
    },
  };

  it('renders at most 4 primary navigation tabs plus 1 "Más" button in the bottom bar', () => {
    const wrapper = mount(MobileBottomNav, defaultMountOptions);

    const primaryLinks = wrapper
      .findAllComponents(RouterLinkStub)
      .filter((c) => c.element.closest('nav') !== null);

    expect(primaryLinks).toHaveLength(4);
    expect(primaryLinks[0].props('to')).toBe('/dashboard');
    expect(primaryLinks[1].props('to')).toBe('/cuentas');
    expect(primaryLinks[2].props('to')).toBe('/movimientos');
    expect(primaryLinks[3].props('to')).toBe('/presupuestos');

    const moreButton = wrapper.find('[data-testid="more-nav-btn"]');
    expect(moreButton.exists()).toBe(true);
    expect(moreButton.text()).toContain('Más');
  });

  it('toggles the secondary destinations drawer when clicking "Más"', async () => {
    const wrapper = mount(MobileBottomNav, defaultMountOptions);

    const vm = wrapper.vm as any;
    expect(vm.isDrawerOpen).toBe(false);

    const moreButton = wrapper.find('[data-testid="more-nav-btn"]');
    await moreButton.trigger('click');

    expect(vm.isDrawerOpen).toBe(true);

    const secondaryLinks = wrapper.findAllComponents(RouterLinkStub);
    expect(secondaryLinks.length).toBeGreaterThan(4);
  });

  function mountWithRole(role: 'ADMIN' | 'USER') {
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

    const wrapper = mount(MobileBottomNav, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: RouterLinkStub,
          UIcon: true,
          UButton: true,
          USlideover: {
            template:
              '<div v-if="open" data-testid="slideover"><slot /><slot name="content" /></div>',
            props: ['open'],
          },
        },
      },
    });

    return {
      wrapper,
      drawerPaths: async () => {
        await wrapper.find('[data-testid="more-nav-btn"]').trigger('click');
        return wrapper
          .findAllComponents(RouterLinkStub)
          .map((link) => String((link.props('to') as string) ?? ''));
      },
    };
  }

  describe('"Más" sheet admin sections (S15)', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('lists Usuarios & Accesos and Integraciones for an ADMIN', async () => {
      const { wrapper, drawerPaths } = mountWithRole('ADMIN');
      const paths = await drawerPaths();

      expect(paths).toContain('/admin/users');
      expect(paths).toContain('/integraciones');

      const link = wrapper
        .findAllComponents(RouterLinkStub)
        .find((l) => l.props('to') === '/integraciones');
      expect(link?.text()).toContain('Integraciones');
      const usersLink = wrapper
        .findAllComponents(RouterLinkStub)
        .find((l) => l.props('to') === '/admin/users');
      expect(usersLink?.text()).toContain('Usuarios & Accesos');
    });

    it('does not list the admin sections for a regular USER', async () => {
      const { drawerPaths } = mountWithRole('USER');
      const paths = await drawerPaths();

      expect(paths).not.toContain('/admin/users');
      expect(paths).not.toContain('/integraciones');
    });
  });
});
