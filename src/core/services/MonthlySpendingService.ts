import type { SupportedCurrency } from '../entities/Account';
import type { Transaction } from '../entities/Transaction';
import { CurrencyConverter } from './CurrencyConverter';

export interface SumExpensesByCategoryParams {
  transactions: Transaction[];
  year: number;
  month: number;
  baseCurrency: SupportedCurrency;
  accountsCurrencyMap: Record<string, string>;
  convertFn: (
    amount: number,
    fromCurrency: string,
    toCurrency: SupportedCurrency,
  ) => number;
}

export class MonthlySpendingService {
  static filterByMonth(
    transactions: Transaction[],
    year: number,
    month: number,
  ): Transaction[] {
    return transactions.filter((transaction) => {
      if (!transaction.date) return false;

      const date = new Date(transaction.date);
      return (
        !Number.isNaN(date.getTime()) &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month
      );
    });
  }

  static sumExpensesByCategory({
    transactions,
    year,
    month,
    baseCurrency,
    accountsCurrencyMap,
    convertFn,
  }: SumExpensesByCategoryParams): Record<string, number> {
    const spentByCategory: Record<string, number> = {};
    const monthTransactions = this.filterByMonth(transactions, year, month);

    for (const transaction of monthTransactions) {
      if (
        transaction.type !== 'EXPENSE' ||
        transaction.categoryId === null ||
        transaction.categoryId === undefined
      ) {
        continue;
      }

      const sourceCurrency =
        accountsCurrencyMap[transaction.accountId] || 'USD';
      const converted =
        transaction.exchangeRate !== null &&
        transaction.exchangeRate !== undefined &&
        transaction.exchangeRate > 0
          ? CurrencyConverter.convertTransaction(
              transaction.amount,
              sourceCurrency,
              baseCurrency,
              transaction.exchangeRate,
            )
          : convertFn(transaction.amount, sourceCurrency, baseCurrency);

      spentByCategory[transaction.categoryId] =
        (spentByCategory[transaction.categoryId] || 0) + converted;
    }

    return spentByCategory;
  }
}
