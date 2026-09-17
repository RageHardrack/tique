import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import PaySubscriptionModal from './PaySubscriptionModal.vue';
import type { Account } from '../../../core/entities/Account';
import type { Subscription } from '../../../core/entities/Subscription';
import { useExchangeRateStore } from '../../store/exchange-rates';

describe('PaySubscriptionModal.vue', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-usd',
      userId: 'u-1',
      name: 'Chase USD',
      type: 'CHECKING',
      balance: 1000,
      currency: 'USD',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'acc-pen',
      userId: 'u-1',
      name: 'Billetera Soles',
      type: 'WALLET',
      balance: 500,
      currency: 'PEN',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const mockUsdSub: Subscription = {
    id: 'sub-netflix',
    userId: 'u-1',
    accountId: 'acc-usd',
    name: 'Netflix 4K',
    amount: 12,
    currency: 'USD',
    frequency: 'MONTHLY',
    nextDueDate: '2026-09-15',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    const rateStore = useExchangeRateStore();
    rateStore.rates = {
      USD: 1,
      PEN: 3.4,
      VES: 790,
    };
  });

  it('initializes with same-currency defaults when account matches subscription currency', () => {
    const wrapper = mount(PaySubscriptionModal, {
      props: {
        open: true,
        subscription: mockUsdSub,
        accounts: mockAccounts,
      },
    });

    const vm = wrapper.vm as any;
    expect(vm.selectedAccountId).toBe('acc-usd');
    expect(vm.debitedAmount).toBe(12);
    expect(vm.isCrossCurrency).toBe(false);
    expect(vm.customNote).toBe('Pago recurrente: Netflix 4K');
  });

  it('calculates converted amount and exchange rate when account currency differs', async () => {
    const crossSub: Subscription = {
      ...mockUsdSub,
      accountId: 'acc-pen', // Assigned to PEN account
    };

    const wrapper = mount(PaySubscriptionModal, {
      props: {
        open: true,
        subscription: crossSub,
        accounts: mockAccounts,
      },
    });

    const vm = wrapper.vm as any;
    expect(vm.selectedAccountId).toBe('acc-pen');
    expect(vm.isCrossCurrency).toBe(true);
    // Converted: 12 * 3.4 = 40.8
    expect(vm.debitedAmount).toBe(40.8);
    expect(vm.calculatedExchangeRate).toBe(3.4);
    expect(vm.customNote).toContain('Pago recurrente: Netflix 4K');
    expect(vm.customNote).toContain('@ 3.4');
  });

  it('emits pay event with custom debited amount and recalculated exchange rate', async () => {
    const crossSub: Subscription = {
      ...mockUsdSub,
      accountId: 'acc-pen',
    };

    const wrapper = mount(PaySubscriptionModal, {
      props: {
        open: true,
        subscription: crossSub,
        accounts: mockAccounts,
      },
    });

    const vm = wrapper.vm as any;
    // Simulate user editing debited amount to 39.00 PEN (better wallet rate)
    vm.debitedAmount = 39.0;
    vm.handleAmountInput();

    // 39 / 12 = 3.25
    expect(vm.calculatedExchangeRate).toBe(3.25);

    await vm.handleSubmit();

    const emitted = wrapper.emitted('pay');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0][0]).toEqual(
      expect.objectContaining({
        id: 'sub-netflix',
        debitedAmount: 39,
        exchangeRate: 3.25,
        destinationAmount: 12,
        accountId: 'acc-pen',
      }),
    );
  });
});
