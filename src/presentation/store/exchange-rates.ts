import { ref, watch } from 'vue';

import { defineStore } from 'pinia';

import type { SupportedCurrency } from '../../core/entities/Account';
import {
  CurrencyConverter,
  DEFAULT_EXCHANGE_RATES,
  type ExchangeRates,
} from '../../core/services/CurrencyConverter';
import { ApiClient } from '../../infrastructure/api/api-client';

const STORAGE_KEY_BASE = 'tique_base_currency';
const LEGACY_STORAGE_KEY_BASE = 'financiapp_base_currency';
const STORAGE_KEY_RATES = 'financiapp_exchange_rates';
const STORAGE_KEY_SOURCES = 'financiapp_exchange_sources';
const STORAGE_KEY_UPDATED = 'financiapp_exchange_updated_at';

function loadStoredBase(): SupportedCurrency {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored =
        localStorage.getItem(STORAGE_KEY_BASE) ||
        localStorage.getItem(LEGACY_STORAGE_KEY_BASE);
      if (
        stored === 'USD' ||
        stored === 'PEN' ||
        stored === 'VES' ||
        stored === 'EUR'
      ) {
        return stored as SupportedCurrency;
      }
    }
  } catch {
    // Ignore error
  }
  return 'USD';
}

function loadStoredRates(): ExchangeRates {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_RATES);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          USD: 1,
          PEN: Number(parsed.PEN) || DEFAULT_EXCHANGE_RATES.PEN,
          VES: Number(parsed.VES) || DEFAULT_EXCHANGE_RATES.VES,
        };
      }
    }
  } catch {
    // Ignore error
  }
  return { ...DEFAULT_EXCHANGE_RATES };
}

function loadStoredSources(): Record<string, string> {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_SOURCES);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch {
    // Ignore error
  }
  return { USD: 'FIXED', PEN: 'SUNAT', VES: 'BCV' };
}

export const useExchangeRateStore = defineStore('exchangeRates', () => {
  const baseCurrency = ref<SupportedCurrency>(loadStoredBase());
  const rates = ref<ExchangeRates>(loadStoredRates());
  const sources = ref<Record<string, string>>(loadStoredSources());
  const lastUpdated = ref<string | null>(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY_UPDATED)
      : null,
  );
  const isLoading = ref(false);
  const isSyncing = ref(false);

  watch(baseCurrency, (newCurrency) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_BASE, newCurrency);
      }
    } catch {
      // Ignore error
    }
  });

  function setBaseCurrency(currency: SupportedCurrency) {
    baseCurrency.value = currency;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_BASE, currency);
      }
    } catch {
      // Ignore error
    }
  }

  function updateRate(currency: SupportedCurrency, rate: number) {
    if (currency === 'USD') return; // Base USD is always 1
    if (rate <= 0) return;

    rates.value[currency] = rate;
    sources.value[currency] = 'MANUAL';
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(rates.value));
        localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(sources.value));
      }
    } catch {
      // Ignore error
    }
  }

  function resetRates() {
    rates.value = { ...DEFAULT_EXCHANGE_RATES };
    sources.value = { USD: 'FIXED', PEN: 'SUNAT', VES: 'BCV' };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_RATES);
        localStorage.removeItem(STORAGE_KEY_SOURCES);
        localStorage.removeItem(STORAGE_KEY_UPDATED);
      }
    } catch {
      // Ignore error
    }
  }

  async function fetchRates() {
    isLoading.value = true;
    try {
      const data = await ApiClient.get<{
        baseCurrency: 'USD';
        rates: { USD: number; PEN: number; VES: number };
        sources: Record<string, string>;
        lastUpdated: string;
      }>('/exchange-rates');

      if (data && data.rates) {
        rates.value = {
          USD: 1,
          PEN: data.rates.PEN || rates.value.PEN,
          VES: data.rates.VES || rates.value.VES,
        };
        if (data.sources) {
          sources.value = data.sources;
        }
        if (data.lastUpdated) {
          lastUpdated.value = data.lastUpdated;
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(rates.value));
          localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(sources.value));
          if (lastUpdated.value) {
            localStorage.setItem(STORAGE_KEY_UPDATED, lastUpdated.value);
          }
        }
      }
    } catch {
      // Silently fall back to cached local storage rates
    } finally {
      isLoading.value = false;
    }
  }

  async function syncRates(token?: string | null) {
    isSyncing.value = true;
    try {
      await ApiClient.post('/exchange-rates/sync', {}, token);
      await fetchRates();
    } finally {
      isSyncing.value = false;
    }
  }

  function convert(
    amount: number,
    fromCurrency: string,
    toCurrency?: string,
  ): number {
    const target = (toCurrency || baseCurrency.value) as SupportedCurrency;
    return CurrencyConverter.convert(amount, fromCurrency, target, rates.value);
  }

  return {
    baseCurrency,
    rates,
    sources,
    lastUpdated,
    isLoading,
    isSyncing,
    setBaseCurrency,
    updateRate,
    resetRates,
    fetchRates,
    syncRates,
    convert,
  };
});
