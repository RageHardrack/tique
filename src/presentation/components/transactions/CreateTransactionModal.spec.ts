import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import CreateTransactionModal from './CreateTransactionModal.vue';
import type { Account } from '../../../core/entities/Account';
import { useExchangeRateStore } from '../../store/exchange-rates';

const vesAccount: Account = {
  id: 'acc-ves',
  userId: 'u1',
  name: 'Banco de Venezuela',
  type: 'CHECKING',
  balance: 1000,
  currency: 'VES',
  createdAt: '',
  updatedAt: '',
};

const usdAccount: Account = {
  id: 'acc-usd',
  userId: 'u1',
  name: 'Zinli',
  type: 'WALLET',
  balance: 100,
  currency: 'USD',
  createdAt: '',
  updatedAt: '',
};

const OFFICIAL_VES_RATE = 886.2271;

function mountModal(accounts: Account[] = [vesAccount], open = true) {
  return mount(CreateTransactionModal, {
    props: { open, accounts, categories: [] },
  });
}

describe('CreateTransactionModal — automatic daily VES rate', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('fills the official rate for a VES account as soon as the form opens', async () => {
    const rateStore = useExchangeRateStore();
    rateStore.rates.VES = OFFICIAL_VES_RATE;

    const wrapper = mountModal([vesAccount], false);
    await wrapper.setProps({ open: true });

    const vm = wrapper.vm as any;
    expect(vm.isVesTransaction).toBe(true);
    expect(vm.form.exchangeRate).toBe(OFFICIAL_VES_RATE);
  });

  it('fills the official rate again when the form is reopened', async () => {
    const rateStore = useExchangeRateStore();
    rateStore.rates.VES = OFFICIAL_VES_RATE;

    const wrapper = mountModal();

    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });

    const vm = wrapper.vm as any;
    expect(vm.form.exchangeRate).toBe(OFFICIAL_VES_RATE);
  });

  it('adopts the official rate when the backend answers after the form is open', async () => {
    const rateStore = useExchangeRateStore();
    rateStore.rates.VES = 39.5;

    const wrapper = mountModal();
    const vm = wrapper.vm as any;
    expect(vm.form.exchangeRate).toBe(39.5);

    rateStore.rates.VES = OFFICIAL_VES_RATE;
    await wrapper.vm.$nextTick();

    expect(vm.form.exchangeRate).toBe(OFFICIAL_VES_RATE);
  });

  it('keeps a rate typed by the user when the official rate arrives later', async () => {
    const rateStore = useExchangeRateStore();
    rateStore.rates.VES = 39.5;

    const wrapper = mountModal();
    const vm = wrapper.vm as any;

    // Mirrors the rate input: v-model.number then @input on the field.
    vm.form.exchangeRate = 900;
    vm.handleExchangeRateInput();
    expect(vm.form.exchangeRate).toBe(900);

    rateStore.rates.VES = OFFICIAL_VES_RATE;
    await wrapper.vm.$nextTick();

    expect(vm.form.exchangeRate).toBe(900);
  });

  it('keeps the recorded rate when editing an existing VES transaction', () => {
    const rateStore = useExchangeRateStore();
    rateStore.rates.VES = OFFICIAL_VES_RATE;

    const wrapper = mount(CreateTransactionModal, {
      props: {
        open: true,
        accounts: [vesAccount],
        categories: [],
        transaction: {
          id: 'tx-1',
          userId: 'u1',
          accountId: 'acc-ves',
          amount: 8137.4,
          exchangeRate: 700,
          type: 'EXPENSE' as const,
          date: '2026-09-01T10:00:00.000Z',
          createdAt: '',
          updatedAt: '',
        },
      },
    });
    const vm = wrapper.vm as any;

    expect(vm.form.exchangeRate).toBe(700);
  });

  it('does not fill a VES rate for accounts in another currency', () => {
    const rateStore = useExchangeRateStore();
    rateStore.rates.VES = OFFICIAL_VES_RATE;

    const wrapper = mountModal([usdAccount]);
    const vm = wrapper.vm as any;

    expect(vm.isVesTransaction).toBe(false);
    expect(vm.form.exchangeRate).toBeNull();
  });

  it('keeps the derived rate of a cross-currency transfer when the official rate arrives', async () => {
    const rateStore = useExchangeRateStore();
    rateStore.rates.VES = OFFICIAL_VES_RATE;

    const wrapper = mountModal([vesAccount, usdAccount]);
    const vm = wrapper.vm as any;

    vm.form.type = 'TRANSFER';
    vm.form.accountId = 'acc-ves';
    vm.form.destinationAccountId = 'acc-usd';
    vm.form.amount = 8862.271;
    vm.handleAmountInput();

    const derivedRate = vm.form.exchangeRate;
    expect(vm.form.destinationAmount).toBe(10);

    rateStore.rates.VES = 900;
    await wrapper.vm.$nextTick();

    expect(vm.form.exchangeRate).toBe(derivedRate);
  });
});
