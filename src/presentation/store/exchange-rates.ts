import { ref } from 'vue';

import { defineStore } from 'pinia';

import type { SupportedCurrency } from '../../core/entities/Account';
import {
  CurrencyConverter,
  DEFAULT_EXCHANGE_RATES,
  type ExchangeRates,
} from '../../core/services/CurrencyConverter';

const STORAGE_KEY_BASE = 'financiapp_base_currency';
const STORAGE_KEY_RATES = 'financiapp_exchange_rates';

function loadStoredBase(): SupportedCurrency {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_BASE);
      if (stored === 'USD' || stored === 'PEN' || stored === 'VES') {
        return stored;
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

export const useExchangeRateStore = defineStore('exchangeRates', () => {
  const baseCurrency = ref<SupportedCurrency>(loadStoredBase());
  const rates = ref<ExchangeRates>(loadStoredRates());

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
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(rates.value));
      }
    } catch {
      // Ignore error
    }
  }

  function resetRates() {
    rates.value = { ...DEFAULT_EXCHANGE_RATES };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_RATES);
      }
    } catch {
      // Ignore error
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
    setBaseCurrency,
    updateRate,
    resetRates,
    convert,
  };
});
