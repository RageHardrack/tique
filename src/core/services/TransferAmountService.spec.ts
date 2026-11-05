import { describe, expect, it } from 'vitest';

import { TransferAmountService } from './TransferAmountService';

describe('TransferAmountService.isCrossCurrency (S7)', () => {
  it('is true only for transfers between accounts of different currency', () => {
    expect(
      TransferAmountService.isCrossCurrency('TRANSFER', 'PEN', 'USD'),
    ).toBe(true);
    expect(
      TransferAmountService.isCrossCurrency('TRANSFER', 'PEN', 'PEN'),
    ).toBe(false);
    expect(TransferAmountService.isCrossCurrency('EXPENSE', 'PEN', 'USD')).toBe(
      false,
    );
    expect(
      TransferAmountService.isCrossCurrency('TRANSFER', 'PEN', undefined),
    ).toBe(false);
  });
});

describe('TransferAmountService.autoCalculate (S7)', () => {
  it('converts the source amount and derives the implied rate', () => {
    // 8862.271 VES at the 886.2271 official rate lands as 10 USD.
    const result = TransferAmountService.autoCalculate({
      amount: 8862.271,
      convertedAmount: 8862.271 / 886.2271,
    });

    expect(result.destinationAmount).toBe(10);
    expect(result.exchangeRate).toBe(0.0011);
  });

  it('keeps same-currency transfers at one-to-one', () => {
    expect(
      TransferAmountService.autoCalculate({
        amount: 200,
        convertedAmount: 200,
      }),
    ).toEqual({ destinationAmount: 200, exchangeRate: 1 });
  });
});

describe('TransferAmountService.deriveRate', () => {
  it('rounds the rate implied by the amounts to four decimals', () => {
    expect(TransferAmountService.deriveRate(200, 760)).toBe(3.8);
    expect(TransferAmountService.deriveRate(200, 759.11)).toBe(3.7956);
  });

  it('returns null when either amount is missing or not positive', () => {
    expect(TransferAmountService.deriveRate(0, 10)).toBeNull();
    expect(TransferAmountService.deriveRate(10, 0)).toBeNull();
    expect(TransferAmountService.deriveRate(10, null)).toBeNull();
  });
});

describe('TransferAmountService.resolveSubmitAmounts (S7)', () => {
  it('sends the destination amount and derived rate for a cross-currency transfer', () => {
    expect(
      TransferAmountService.resolveSubmitAmounts({
        type: 'TRANSFER',
        isCrossCurrency: true,
        amount: 200,
        destinationAmount: 760,
        exchangeRate: 3.8,
      }),
    ).toEqual({ destinationAmount: 760, exchangeRate: 3.8 });
  });

  it('falls back to the source amount when the destination amount was never filled', () => {
    expect(
      TransferAmountService.resolveSubmitAmounts({
        type: 'TRANSFER',
        isCrossCurrency: true,
        amount: 200,
        destinationAmount: null,
        exchangeRate: null,
      }),
    ).toEqual({ destinationAmount: 200, exchangeRate: 1 });
  });

  it('keeps no rate for a same-currency transfer, and keeps the caller rate when there is one', () => {
    expect(
      TransferAmountService.resolveSubmitAmounts({
        type: 'TRANSFER',
        isCrossCurrency: false,
        amount: 200,
        destinationAmount: 200,
        exchangeRate: null,
      }),
    ).toEqual({ destinationAmount: 200, exchangeRate: undefined });

    // A VES-to-VES transfer still records the daily rate the caller passes.
    expect(
      TransferAmountService.resolveSubmitAmounts({
        type: 'TRANSFER',
        isCrossCurrency: false,
        amount: 200,
        destinationAmount: 200,
        exchangeRate: 700,
      }),
    ).toEqual({ destinationAmount: 200, exchangeRate: 700 });
  });

  it('never sends destination amounts on expenses and incomes', () => {
    expect(
      TransferAmountService.resolveSubmitAmounts({
        type: 'EXPENSE',
        isCrossCurrency: false,
        amount: 25,
        destinationAmount: 999,
        exchangeRate: null,
      }),
    ).toEqual({ destinationAmount: undefined, exchangeRate: undefined });
  });

  it('keeps the daily VES rate for non-transfer movements', () => {
    expect(
      TransferAmountService.resolveSubmitAmounts({
        type: 'EXPENSE',
        isCrossCurrency: false,
        amount: 8137.4,
        destinationAmount: null,
        exchangeRate: 700,
      }),
    ).toEqual({ destinationAmount: undefined, exchangeRate: 700 });
  });
});
