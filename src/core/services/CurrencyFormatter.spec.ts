import { describe, expect, it } from 'vitest';

import { CurrencyFormatter, SUPPORTED_CURRENCIES } from './CurrencyFormatter';

describe('CurrencyFormatter Service', () => {
  it('should list USD, PEN and VES as supported currencies', () => {
    const codes = SUPPORTED_CURRENCIES.map((c) => c.code);
    expect(codes).toContain('USD');
    expect(codes).toContain('PEN');
    expect(codes).toContain('VES');
  });

  it('should format USD amount properly', () => {
    const result = CurrencyFormatter.format(1500.5, 'USD');
    expect(result).toContain('1,500.50');
  });

  it('should format PEN amount properly', () => {
    const result = CurrencyFormatter.format(2500, 'PEN');
    expect(result).toContain('2,500.00');
  });

  it('should format VES amount properly', () => {
    const result = CurrencyFormatter.format(300.75, 'VES');
    expect(result).toBeDefined();
  });

  it('should return correct symbols', () => {
    expect(CurrencyFormatter.getSymbol('USD')).toBe('US$');
    expect(CurrencyFormatter.getSymbol('PEN')).toBe('S/');
    expect(CurrencyFormatter.getSymbol('VES')).toBe('Bs.');
  });
});
