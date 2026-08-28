import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it } from 'vitest';

import { useExchangeRateStore } from './exchange-rates';

describe('useExchangeRateStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('should initialize with default base currency and rates', () => {
    const store = useExchangeRateStore();
    expect(store.baseCurrency).toBe('USD');
    expect(store.rates.USD).toBe(1);
    expect(store.rates.PEN).toBe(3.75);
    expect(store.rates.VES).toBe(39.5);
  });

  it('should change base currency', () => {
    const store = useExchangeRateStore();
    store.setBaseCurrency('PEN');
    expect(store.baseCurrency).toBe('PEN');
  });

  it('should update exchange rate', () => {
    const store = useExchangeRateStore();
    store.updateRate('PEN', 3.8);
    expect(store.rates.PEN).toBe(3.8);
  });

  it('should reset exchange rates to defaults', () => {
    const store = useExchangeRateStore();
    store.updateRate('PEN', 4.2);
    store.updateRate('VES', 45);
    store.resetRates();

    expect(store.rates.PEN).toBe(3.75);
    expect(store.rates.VES).toBe(39.5);
  });

  it('should convert amount to current base currency', () => {
    const store = useExchangeRateStore();
    // Default base is USD
    const inUSD = store.convert(375, 'PEN');
    expect(inUSD).toBe(100);

    store.setBaseCurrency('PEN');
    const inPEN = store.convert(100, 'USD');
    expect(inPEN).toBe(375);
  });
});
