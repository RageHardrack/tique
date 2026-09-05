import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TopNav from './TopNav.vue';

describe('TopNav.vue - Mobile-First Header & Top Navigation', () => {
  const createWrapper = (props = {}) => {
    const pinia = createPinia();
    setActivePinia(pinia);

    return mount(TopNav, {
      props: {
        title: 'Movimientos',
        subtitle: 'Historial detallado',
        ...props,
      },
      global: {
        plugins: [pinia],
        stubs: {
          UIcon: true,
          UButton: {
            template: '<button type="button" v-bind="$attrs"><slot /></button>',
          },
          USelect: {
            template: '<select v-bind="$attrs"><slot /></select>',
          },
          ExchangeRatesModal: true,
        },
      },
    });
  };

  it('accommodates top safe areas and responsive padding in the header', () => {
    const wrapper = createWrapper();
    const header = wrapper.find('header');
    expect(header.classes().join(' ')).toContain('safe-area-inset-top');
  });

  it('renders title with flex-1 and truncation to prevent layout crowding', () => {
    const wrapper = createWrapper({ title: 'Resumen Financiero y Métricas del Mes' });
    const title = wrapper.find('h1');
    expect(title.classes()).toContain('truncate');

    const titleWrapper = title.element.parentElement?.parentElement;
    expect(titleWrapper?.className).toContain('min-w-0');
    expect(titleWrapper?.className).toContain('flex-1');
  });

  it('renders currency selector with compact width on mobile and expanded on desktop', () => {
    const wrapper = createWrapper();
    const select = wrapper.find('[aria-label="Moneda base"]');
    expect(select.exists()).toBe(true);
    const classes = select.classes().join(' ');
    expect(classes).toMatch(/w-\[\d+px\]/);
    expect(classes).toContain('sm:w-32');
  });

  it('renders accessible rates button with text hidden on mobile and aria-label', () => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAll('button');
    const ratesBtn = buttons.find((b) => b.attributes('aria-label') === 'Tasas de cambio');
    expect(ratesBtn).toBeDefined();
    expect(ratesBtn?.html()).toContain('hidden sm:inline');
  });
});
