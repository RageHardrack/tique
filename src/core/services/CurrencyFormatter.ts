export type SupportedCurrency = 'USD' | 'PEN' | 'VES';

export interface CurrencyConfig {
  code: SupportedCurrency;
  name: string;
  symbol: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: 'USD',
    name: 'Dólares americanos',
    symbol: 'US$',
    locale: 'en-US',
  },
  {
    code: 'PEN',
    name: 'Soles peruanos',
    symbol: 'S/',
    locale: 'es-PE',
  },
  {
    code: 'VES',
    name: 'Bolívares venezolanos',
    symbol: 'Bs.',
    locale: 'es-VE',
  },
];

export class CurrencyFormatter {
  private static readonly currencyMap: Record<string, CurrencyConfig> = {
    USD: SUPPORTED_CURRENCIES[0],
    PEN: SUPPORTED_CURRENCIES[1],
    VES: SUPPORTED_CURRENCIES[2],
  };

  static format(amount: number, currency: string = 'USD'): string {
    const safeCurrency = currency.toUpperCase();
    const config = this.currencyMap[safeCurrency];

    if (!config) {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: safeCurrency,
        minimumFractionDigits: 2,
      }).format(amount);
    }

    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  static getSymbol(currency: string = 'USD'): string {
    const config = this.currencyMap[currency.toUpperCase()];
    return config ? config.symbol : currency;
  }
}
