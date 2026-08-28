import type { Transaction } from '../entities/Transaction';

export interface FrequentPattern {
  key: string;
  type: 'INCOME' | 'EXPENSE';
  accountId: string;
  categoryId?: string;
  note?: string;
  averageAmount: number;
  count: number;
}

export class FrequentTransactionsService {
  /**
   * Analyzes the transaction history and returns top frequent patterns (max topN).
   */
  static getFrequentPatterns(transactions: Transaction[], topN = 4): FrequentPattern[] {
    if (!transactions || transactions.length === 0) return [];

    const map = new Map<string, {
      type: 'INCOME' | 'EXPENSE';
      accountId: string;
      categoryId?: string;
      note?: string;
      amounts: number[];
      count: number;
    }>();

    // Filter out transfers for quick-expense/income patterns
    const eligible = transactions.filter((tx) => tx.type === 'INCOME' || tx.type === 'EXPENSE');

    eligible.forEach((tx) => {
      const type = tx.type as 'INCOME' | 'EXPENSE';
      const categoryId = tx.categoryId || 'none';
      const noteKey = tx.note ? tx.note.trim().toLowerCase() : '';
      const key = `${type}_${tx.accountId}_${categoryId}_${noteKey}`;

      if (!map.has(key)) {
        map.set(key, {
          type,
          accountId: tx.accountId,
          categoryId: tx.categoryId || undefined,
          note: tx.note || undefined,
          amounts: [tx.amount],
          count: 1,
        });
      } else {
        const item = map.get(key)!;
        item.amounts.push(tx.amount);
        item.count += 1;
      }
    });

    return Array.from(map.entries())
      .map(([key, data]) => {
        const sum = data.amounts.reduce((a, b) => a + b, 0);
        const averageAmount = Math.round((sum / data.amounts.length) * 100) / 100;

        return {
          key,
          type: data.type,
          accountId: data.accountId,
          categoryId: data.categoryId,
          note: data.note,
          averageAmount,
          count: data.count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
  }
}
