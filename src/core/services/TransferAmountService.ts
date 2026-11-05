import type { TransactionType } from '../entities/Transaction';

export interface TransferAmounts {
  destinationAmount: number;
  exchangeRate: number | null;
}

export interface SubmitAmountsInput {
  type: TransactionType;
  isCrossCurrency: boolean;
  amount: number;
  destinationAmount: number | null;
  /**
   * Rate the user typed (or the one already derived). Only cross-currency
   * transfers use it; other movements send their own daily VES rate instead.
   */
  exchangeRate?: number | null;
}

/**
 * The math behind a transfer between two accounts. Extracted from
 * `CreateTransactionModal` so the modal and the quick-add sheet share one
 * implementation instead of two copies that can drift apart.
 */
export class TransferAmountService {
  /** Only a transfer with both accounts picked and different currencies. */
  static isCrossCurrency(
    type: TransactionType,
    sourceCurrency?: string | null,
    destinationCurrency?: string | null,
  ): boolean {
    if (type !== 'TRANSFER') return false;
    if (!sourceCurrency || !destinationCurrency) return false;

    return sourceCurrency !== destinationCurrency;
  }

  /**
   * Destination amount the official rate implies, rounded to cents, with the
   * rate the amounts actually express (so editing one field keeps both honest).
   */
  static autoCalculate({
    amount,
    convertedAmount,
  }: {
    amount: number;
    convertedAmount: number;
  }): TransferAmounts {
    const destinationAmount = Math.round(convertedAmount * 100) / 100;

    return {
      destinationAmount,
      exchangeRate:
        TransferAmountService.deriveRate(amount, destinationAmount) ?? 1,
    };
  }

  /** Implied destination-per-source rate, four decimals, or null if unusable. */
  static deriveRate(
    amount: number | null,
    destinationAmount: number | null,
  ): number | null {
    if (
      !amount ||
      !destinationAmount ||
      amount <= 0 ||
      destinationAmount <= 0
    ) {
      return null;
    }

    return Math.round((destinationAmount / amount) * 10000) / 10000;
  }

  /**
   * The amount fields a create/update payload carries. Same-currency transfers
   * mirror the source amount; expenses and incomes never send a destination.
   * `exchangeRate` is whatever the caller already decided applies (the derived
   * transfer rate, or the daily VES rate), or null when nothing applies.
   */
  static resolveSubmitAmounts(input: SubmitAmountsInput): {
    destinationAmount?: number;
    exchangeRate?: number;
  } {
    if (input.type !== 'TRANSFER') {
      return {
        destinationAmount: undefined,
        exchangeRate: input.exchangeRate ?? undefined,
      };
    }

    const destinationAmount = input.destinationAmount ?? input.amount;

    if (!input.isCrossCurrency) {
      return {
        destinationAmount,
        exchangeRate: input.exchangeRate ?? undefined,
      };
    }

    return {
      destinationAmount,
      exchangeRate:
        input.exchangeRate ??
        TransferAmountService.deriveRate(input.amount, destinationAmount) ??
        undefined,
    };
  }
}
