import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('should fetch official rates from backend API and update store', async () => {
    const store = useExchangeRateStore();

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        baseCurrency: 'USD',
        rates: { USD: 1, PEN: 3.356, VES: 791.66 },
        sources: { USD: 'FIXED', PEN: 'SUNAT', VES: 'BCV' },
        lastUpdated: '2026-08-29T20:00:00.000Z',
      }),
    } as any);

    await store.fetchRates();

    expect(store.rates.PEN).toBe(3.356);
    expect(store.rates.VES).toBe(791.66);
    expect(store.sources.PEN).toBe('SUNAT');
    expect(store.sources.VES).toBe('BCV');
    expect(store.lastUpdated).toBe('2026-08-29T20:00:00.000Z');
  });

  it('should persist base currency to localStorage on direct assignment', async () => {
    const store = useExchangeRateStore();
    store.baseCurrency = 'PEN';
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(localStorage.getItem('tique_base_currency')).toBe('PEN');
  });

  it('should persist base currency to localStorage on setBaseCurrency call', () => {
    const store = useExchangeRateStore();
    store.setBaseCurrency('VES');
    expect(localStorage.getItem('tique_base_currency')).toBe('VES');
  });

  it('should restore base currency from localStorage upon store initialization', () => {
    localStorage.setItem('tique_base_currency', 'PEN');
    const store = useExchangeRateStore();
    expect(store.baseCurrency).toBe('PEN');
  });

  it('should restore base currency from legacy storage key financiapp_base_currency', () => {
    localStorage.setItem('financiapp_base_currency', 'VES');
    const store = useExchangeRateStore();
    expect(store.baseCurrency).toBe('VES');
  });

  it('should fall back to USD when stored currency is invalid or corrupted', () => {
    localStorage.setItem('tique_base_currency', 'INVALID_CURRENCY');
    const store = useExchangeRateStore();
    expect(store.baseCurrency).toBe('USD');
  });
});
