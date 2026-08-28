import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import LoanCard from './LoanCard.vue';
import { useExchangeRateStore } from '../../store/exchange-rates';
import type { Loan } from '../../../core/entities/Loan';

describe('LoanCard Component & Multi-Currency', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const baseLoanUSD: Loan = {
    id: 'l-1',
    userId: 'u-1',
    personName: 'Deudor USD',
    type: 'LENT',
    amount: 300,
    remainingAmount: 300,
    currency: 'USD',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payments: [],
  };

  const baseLoanPEN: Loan = {
    id: 'l-2',
    userId: 'u-1',
    personName: 'Deudor PEN',
    type: 'LENT',
    amount: 300,
    remainingAmount: 300,
    currency: 'PEN',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payments: [],
  };

  it('debe mostrar el saldo en su divisa original USD sin texto de conversión cuando la base es USD', () => {
    const rateStore = useExchangeRateStore();
    rateStore.setBaseCurrency('USD');

    const wrapper = mount(LoanCard, {
      props: {
        loan: baseLoanUSD,
      },
    });

    expect(wrapper.text()).toContain('$300.00');
    expect(wrapper.text()).not.toContain('≈');
  });

  it('debe mostrar el saldo original en S/ 300.00 y la conversión aproximada a moneda base (≈ $80.00) cuando la base es USD', () => {
    const rateStore = useExchangeRateStore();
    rateStore.setBaseCurrency('USD');

    const wrapper = mount(LoanCard, {
      props: {
        loan: baseLoanPEN,
      },
    });

    expect(wrapper.text()).toContain('300.00');
    expect(wrapper.text()).toContain('≈ $80.00');
  });

  it('debe mostrar la conversión inversa cuando la divisa base del sistema se cambia a PEN (S/)', () => {
    const rateStore = useExchangeRateStore();
    rateStore.setBaseCurrency('PEN');

    const wrapper = mount(LoanCard, {
      props: {
        loan: baseLoanUSD,
      },
    });

    // $300 USD convertido a PEN (tasa 3.75) es S/ 1,125.00
    expect(wrapper.text()).toContain('$300.00');
    expect(wrapper.text()).toContain('1,125.00');
  });
});
