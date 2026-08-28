import type { SupportedCurrency } from '../entities/Account';

export interface ExchangeRates {
  USD: number;
  PEN: number;
  VES: number;
}

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD: 1,
  PEN: 3.75,
  VES: 39.5,
};

export class CurrencyConverter {
  /**
   * Converts an amount between two currencies using rates relative to USD (USD = 1.0).
   * Example: 100 PEN to USD = 100 / 3.75 = 26.666...
   * Example: 100 USD to VES = 100 * 39.5 = 3950
   * Example: 100 PEN to VES = (100 / 3.75) * 39.5 = 1053.33...
   */
  static convert(
    amount: number,
    from: string,
    to: string,
    rates: ExchangeRates = DEFAULT_EXCHANGE_RATES,
  ): number {
    const fromUpper = (from || 'USD').toUpperCase() as SupportedCurrency;
    const toUpper = (to || 'USD').toUpperCase() as SupportedCurrency;

    if (fromUpper === toUpper || !amount) {
      return amount;
    }

    const rateFrom = rates[fromUpper] ?? 1;
    const rateTo = rates[toUpper] ?? 1;

    if (rateFrom <= 0 || rateTo <= 0) {
      return amount;
    }

    // Convert from source currency to USD first, then to target currency
    const amountInUSD = amount / rateFrom;
    return amountInUSD * rateTo;
  }
}
