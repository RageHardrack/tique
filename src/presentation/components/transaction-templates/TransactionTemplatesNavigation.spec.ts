import { createPinia, setActivePinia } from 'pinia';

import { mount, RouterLinkStub } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../../store/auth';
import SidebarNav from '../navigation/SidebarNav.vue';
import MobileBottomNav from '../navigation/MobileBottomNav.vue';

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useRoute: () => ({ path: '/plantillas' }),
    useRouter: () => ({ push: vi.fn() }),
  };
});

const navStubs = {
  global: {
    stubs: {
      RouterLink: RouterLinkStub,
      UIcon: true,
      UButton: true,
      USlideover: {
        props: ['open'],
        template:
          '<div v-if="open" data-testid="slideover"><slot name="content" /></div>',
      },
    },
  },
};

/**
 * S6 gives templates their own window, so both navigations must reach
 * /plantillas: the desktop sidebar and the mobile secondary drawer.
 */
describe('Plantillas navigation entry (S6)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setActivePinia(createPinia());
    useAuthStore().user = {
      id: 'u1',
      email: 'd@l.dev',
      name: 'Daniel',
      role: 'USER',
      createdAt: '',
    };
  });

  it('lists Plantillas in the desktop sidebar', () => {
    const wrapper = mount(SidebarNav, navStubs);

    const targets = wrapper
      .findAllComponents(RouterLinkStub)
      .map((link) => link.props('to'));

    expect(targets).toContain('/plantillas');
  });

  it('lists Plantillas in the mobile secondary drawer', async () => {
    const wrapper = mount(MobileBottomNav, navStubs);

    await wrapper.find('[data-testid="more-nav-btn"]').trigger('click');

    const targets = wrapper
      .findAllComponents(RouterLinkStub)
      .map((link) => link.props('to'));

    expect(targets).toContain('/plantillas');
  });
});
