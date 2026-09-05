import { describe, expect, it, vi } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
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
      stubs: {
        RouterLink: RouterLinkStub,
        UIcon: true,
        UButton: true,
        USlideover: {
          template: '<div v-if="open" data-testid="slideover"><slot /><slot name="content" /></div>',
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
});
