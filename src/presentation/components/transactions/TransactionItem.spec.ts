import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import TransactionItem from './TransactionItem.vue';
import type { Transaction } from '../../../core/entities/Transaction';

describe('TransactionItem.vue', () => {
  const baseTx: Transaction = {
    id: 'tx-1',
    userId: 'u-1',
    accountId: 'acc-ves',
    categoryId: 'cat-1',
    amount: 8137.4,
    exchangeRate: 813.74,
    type: 'EXPENSE',
    date: '2026-09-01T12:00:00.000Z',
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
  };

  it('renders exchange rate badge when exchangeRate is present on transaction', () => {
    const wrapper = mount(TransactionItem, {
      props: {
        transaction: baseTx,
        accountName: 'Banesco VES',
        accountCurrency: 'VES',
      },
    });

    expect(wrapper.text()).toContain('Tasa: 813.74');
  });

  it('does not render exchange rate badge when transaction has no exchange rate', () => {
    const wrapper = mount(TransactionItem, {
      props: {
        transaction: {
          ...baseTx,
          exchangeRate: null,
        },
        accountName: 'Chase USD',
        accountCurrency: 'USD',
      },
    });

    expect(wrapper.text()).not.toContain('Tasa:');
  });
});
