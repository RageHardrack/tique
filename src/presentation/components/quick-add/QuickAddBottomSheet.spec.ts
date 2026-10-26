import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import QuickAddBottomSheet from './QuickAddBottomSheet.vue';
import { useAccountStore } from '../../store/accounts';
import { useExchangeRateStore } from '../../store/exchange-rates';

const OFFICIAL_VES_RATE = 886.2271;

describe('QuickAddBottomSheet — automatic daily VES rate', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());

    const accountStore = useAccountStore();
    accountStore.accounts = [
      {
        id: 'acc-ves',
        userId: 'u1',
        name: 'Banco de Venezuela',
        type: 'CHECKING',
        balance: 1000,
        currency: 'VES',
        createdAt: '',
        updatedAt: '',
      },
    ];
  });

  it('fills the official rate when the sheet opens', async () => {
    const rateStore = useExchangeRateStore();
    rateStore.rates.VES = OFFICIAL_VES_RATE;

    const wrapper = mount(QuickAddBottomSheet, { props: { open: false } });
    await wrapper.setProps({ open: true });

    const vm = wrapper.vm as any;
    expect(vm.isVesAccount).toBe(true);
    expect(vm.exchangeRate).toBe(OFFICIAL_VES_RATE);
  });

  it('fills the official rate again when the sheet is reopened', async () => {
    const rateStore = useExchangeRateStore();
    rateStore.rates.VES = OFFICIAL_VES_RATE;

    const wrapper = mount(QuickAddBottomSheet, { props: { open: true } });

    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });

    const vm = wrapper.vm as any;
    expect(vm.exchangeRate).toBe(OFFICIAL_VES_RATE);
  });

  it('adopts the official rate when the backend answers after the sheet is open', async () => {
    const rateStore = useExchangeRateStore();
    rateStore.rates.VES = 39.5;

    const wrapper = mount(QuickAddBottomSheet, { props: { open: true } });
    const vm = wrapper.vm as any;
    expect(vm.exchangeRate).toBe(39.5);

    rateStore.rates.VES = OFFICIAL_VES_RATE;
    await wrapper.vm.$nextTick();

    expect(vm.exchangeRate).toBe(OFFICIAL_VES_RATE);
  });

  it('keeps a rate typed by the user when the official rate arrives later', async () => {
    const rateStore = useExchangeRateStore();
    rateStore.rates.VES = 39.5;

    const wrapper = mount(QuickAddBottomSheet, { props: { open: true } });
    const vm = wrapper.vm as any;

    // Mirrors the rate input: v-model.number then @input on the field.
    vm.exchangeRate = 900;
    vm.handleExchangeRateInput();
    expect(vm.exchangeRate).toBe(900);

    rateStore.rates.VES = OFFICIAL_VES_RATE;
    await wrapper.vm.$nextTick();

    expect(vm.exchangeRate).toBe(900);
  });
});
