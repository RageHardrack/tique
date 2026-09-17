import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CategoryDonutChart from './CategoryDonutChart.vue';
import type { CategoryExpenseBreakdown } from '../../../core/services/AnalyticsService';

describe('CategoryDonutChart.vue', () => {
  const mockCategories: CategoryExpenseBreakdown[] = [
    {
      categoryId: 'c1',
      categoryName: 'Alquiler',
      color: '#3B82F6',
      icon: 'i-heroicons-home',
      amount: 1000,
      formattedAmount: '$1,000.00',
      percentage: 45,
    },
    {
      categoryId: 'c2',
      categoryName: 'Supermercado',
      color: '#10B981',
      icon: 'i-heroicons-shopping-cart',
      amount: 500,
      formattedAmount: '$500.00',
      percentage: 22.5,
    },
    {
      categoryId: 'c3',
      categoryName: 'Servicios',
      color: '#F59E0B',
      icon: 'i-heroicons-bolt',
      amount: 300,
      formattedAmount: '$300.00',
      percentage: 13.5,
    },
    {
      categoryId: 'c4',
      categoryName: 'Restaurantes',
      color: '#EC4899',
      icon: 'i-heroicons-cake',
      amount: 200,
      formattedAmount: '$200.00',
      percentage: 9,
    },
    {
      categoryId: 'c5',
      categoryName: 'Transporte',
      color: '#8B5CF6',
      icon: 'i-heroicons-truck',
      amount: 100,
      formattedAmount: '$100.00',
      percentage: 4.5,
    },
    {
      categoryId: 'c6',
      categoryName: 'Suscripciones',
      color: '#06B6D4',
      icon: 'i-heroicons-tv',
      amount: 70,
      formattedAmount: '$70.00',
      percentage: 3.2,
    },
    {
      categoryId: 'c7',
      categoryName: 'Salud',
      color: '#EF4444',
      icon: 'i-heroicons-heart',
      amount: 50,
      formattedAmount: '$50.00',
      percentage: 2.3,
    },
  ];

  it('renders empty state when breakdown is empty', () => {
    const wrapper = mount(CategoryDonutChart, {
      props: {
        breakdown: [],
        baseCurrency: 'USD',
      },
      global: {
        stubs: {
          UIcon: true,
          UButton: true,
          UModal: true,
          UInput: true,
          UBadge: true,
        },
      },
    });

    expect(wrapper.text()).toContain(
      'No hay gastos registrados para analizar este mes',
    );
  });

  it('groups categories beyond 5 into "Otras" by default to prevent layout stretching', () => {
    const wrapper = mount(CategoryDonutChart, {
      props: {
        breakdown: mockCategories,
        baseCurrency: 'USD',
      },
      global: {
        stubs: {
          UIcon: true,
          UButton: true,
          UModal: true,
          UInput: true,
          UBadge: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Alquiler');
    expect(wrapper.text()).toContain('Supermercado');
    expect(wrapper.text()).toContain('Otras categorías (2)');
    // In "Principales" mode, items 6 and 7 should not be listed as distinct primary rows
    expect(wrapper.text()).not.toContain('Suscripciones$70.00');
  });

  it('switches to "Todas" mode when clicking the toggle button', async () => {
    const wrapper = mount(CategoryDonutChart, {
      props: {
        breakdown: mockCategories,
        baseCurrency: 'USD',
      },
      global: {
        stubs: {
          UIcon: true,
          UButton: true,
          UModal: true,
          UInput: true,
          UBadge: true,
        },
      },
    });

    const toggleButtons = wrapper.findAll('button');
    const todasBtn = toggleButtons.find((b) => b.text().includes('Todas'));
    expect(todasBtn).toBeDefined();

    await todasBtn!.trigger('click');

    // In "Todas" mode, all 7 items are shown in the scroll container
    expect(wrapper.text()).toContain('Suscripciones');
    expect(wrapper.text()).toContain('Salud');
  });
});
