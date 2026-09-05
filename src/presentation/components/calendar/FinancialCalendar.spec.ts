import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import FinancialCalendar from './FinancialCalendar.vue';

describe('FinancialCalendar.vue - Canonical 7-Day Responsive Grid', () => {
  const defaultMountOptions = {
    props: {
      subscriptions: [
        {
          id: 'sub-1',
          userId: 'user-1',
          name: 'Netflix',
          amount: 15.99,
          currency: 'USD',
          frequency: 'MONTHLY' as const,
          nextDueDate: '2026-09-15T00:00:00.000Z',
          categoryId: 'cat-1',
          accountId: 'acc-1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      loans: [],
      accounts: [],
      baseCurrency: 'USD',
    },
    global: {
      stubs: {
        UIcon: true,
        UButton: true,
        USlideover: {
          template: '<div v-if="open" data-testid="calendar-slideover"><slot /><slot name="content" /></div>',
          props: ['open'],
        },
      },
    },
  };

  it('renders standard 7 weekday headers for Monday through Sunday', () => {
    const wrapper = mount(FinancialCalendar, defaultMountOptions);

    const weekdayHeaders = wrapper.findAll('[data-testid="weekday-header"]');
    expect(weekdayHeaders).toHaveLength(7);
    const headersText = weekdayHeaders.map((h) => h.text());
    expect(headersText).toEqual(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']);
  });

  it('calculates leading day offset for the 1st day of the month', () => {
    const wrapper = mount(FinancialCalendar, defaultMountOptions);

    const vm = wrapper.vm as any;
    expect(typeof vm.firstDayOffset).toBe('number');
    expect(vm.firstDayOffset).toBeGreaterThanOrEqual(0);
    expect(vm.firstDayOffset).toBeLessThan(7);
  });

  it('displays indicator dots on days with scheduled events', () => {
    const wrapper = mount(FinancialCalendar, defaultMountOptions);

    const eventIndicators = wrapper.findAll('[data-testid="day-event-dot"]');
    expect(eventIndicators.length).toBeGreaterThan(0);
  });
});
