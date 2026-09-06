import { describe, expect, it } from 'vitest';

import { CurrencyConverter } from './CurrencyConverter';

describe('CurrencyConverter Domain Service', () => {
  it('should return same amount if source and target currency are the same', () => {
    expect(CurrencyConverter.convert(100, 'USD', 'USD')).toBe(100);
    expect(CurrencyConverter.convert(250, 'PEN', 'PEN')).toBe(250);
    expect(CurrencyConverter.convert(500, 'VES', 'VES')).toBe(500);
  });

  it('should convert from USD to PEN and VES accurately', () => {
    // 100 USD -> PEN (at 3.75)
    expect(CurrencyConverter.convert(100, 'USD', 'PEN')).toBe(375);
    // 100 USD -> VES (at 39.5)
    expect(CurrencyConverter.convert(100, 'USD', 'VES')).toBe(3950);
  });

  it('should convert from PEN to USD accurately', () => {
    // 375 PEN -> USD (at 3.75)
    expect(CurrencyConverter.convert(375, 'PEN', 'USD')).toBe(100);
  });

  it('should convert from VES to USD accurately', () => {
    // 3950 VES -> USD (at 39.5)
    expect(CurrencyConverter.convert(3950, 'VES', 'USD')).toBe(100);
  });

  it('should convert cross currency between PEN and VES', () => {
    // 375 PEN (100 USD) -> 3950 VES
    expect(CurrencyConverter.convert(375, 'PEN', 'VES')).toBe(3950);
  });

  it('should respect custom exchange rates', () => {
    const customRates = {
      USD: 1,
      PEN: 4.0,
      VES: 50.0,
    };
    expect(CurrencyConverter.convert(100, 'USD', 'PEN', customRates)).toBe(400);
    expect(CurrencyConverter.convert(100, 'USD', 'VES', customRates)).toBe(
      5000,
    );
    expect(CurrencyConverter.convert(400, 'PEN', 'VES', customRates)).toBe(
      5000,
    );
  });

  describe('convertTransaction', () => {
    it('should convert VES to USD using the specific transaction exchange rate', () => {
      // 8137.40 VES at rate 813.74 -> exactly 10.00 USD
      const usdAmount = CurrencyConverter.convertTransaction(
        8137.4,
        'VES',
        'USD',
        813.74,
      );
      expect(usdAmount).toBe(10);
    });

    it('should convert VES to PEN using transaction exchange rate for VES and store rate for PEN', () => {
      // 8137.40 VES at rate 813.74 -> 10 USD -> 10 * 3.75 = 37.5 PEN
      const penAmount = CurrencyConverter.convertTransaction(
        8137.4,
        'VES',
        'PEN',
        813.74,
      );
      expect(penAmount).toBe(37.5);
    });

    it('should fall back to standard convert when transaction exchange rate is missing or <= 0', () => {
      // 3950 VES -> 100 USD (at default 39.5)
      expect(CurrencyConverter.convertTransaction(3950, 'VES', 'USD', null)).toBe(
        100,
      );
      expect(CurrencyConverter.convertTransaction(3950, 'VES', 'USD', 0)).toBe(
        100,
      );
    });

    it('should return same amount when source and target currencies are equal', () => {
      expect(
        CurrencyConverter.convertTransaction(500, 'VES', 'VES', 813.74),
      ).toBe(500);
    });
  });
});
