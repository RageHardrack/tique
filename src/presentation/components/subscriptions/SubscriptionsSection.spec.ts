import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import SubscriptionsSection from './SubscriptionsSection.vue';
import { useExchangeRateStore } from '../../store/exchange-rates';
import type { Subscription } from '../../../core/entities/Subscription';
import type { Account } from '../../../core/entities/Account';

describe('SubscriptionsSection.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const rateStore = useExchangeRateStore();
    rateStore.rates = {
      USD: 1,
      PEN: 3.356,
      VES: 790,
    };
  });

  const mockAccount: Account = {
    id: 'acc-1',
    userId: 'u1',
    name: 'Agora Oh Pay Sip',
    type: 'CHECKING',
    balance: 1000,
    currency: 'PEN',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const mockUsdSub: Subscription = {
    id: 'sub-cleanmymac',
    userId: 'u1',
    accountId: 'acc-1',
    name: 'CleanMyMac - Pago anual',
    amount: 53.4,
    currency: 'USD',
    frequency: 'YEARLY',
    nextDueDate: '2026-09-24T00:00:00.000Z',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('renders approximate converted amount when subscription currency differs from baseCurrency', () => {
    const wrapper = mount(SubscriptionsSection, {
      props: {
        subscriptions: [mockUsdSub],
        accounts: [mockAccount],
        categories: [],
        baseCurrency: 'PEN',
        isLoading: false,
      },
    });

    const text = wrapper.text();
    // Nominal amount
    expect(text).toContain('53.40');
    // Converted amount: 53.40 * 3.356 = 179.2104 -> ≈ S/ 179.21
    expect(text).toContain('≈');
    expect(text).toContain('179.21');
  });

  it('does not render approximate converted amount when currencies match', () => {
    const wrapper = mount(SubscriptionsSection, {
      props: {
        subscriptions: [
          {
            ...mockUsdSub,
            currency: 'PEN',
            amount: 150,
          },
        ],
        accounts: [mockAccount],
        categories: [],
        baseCurrency: 'PEN',
        isLoading: false,
      },
    });

    const text = wrapper.text();
    expect(text).toContain('150.00');
    expect(text).not.toContain('≈');
  });
});
