import type { Account } from '../entities/Account';
import type { Category } from '../entities/Category';
import type { Transaction, TransactionType } from '../entities/Transaction';

export type DateFilterPreset =
  'ALL_TIME' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_30_DAYS';

export interface FilterCriteria {
  searchTerm?: string;
  type?: 'ALL' | TransactionType;
  accountId?: string;
  categoryId?: string;
  datePreset?: DateFilterPreset;
  startDate?: string;
  endDate?: string;
}

export class TransactionFilterService {
  /**
   * Filters transactions based on multi-criteria filter options.
   */
  static filter(
    transactions: Transaction[],
    criteria: FilterCriteria,
    accounts: Account[] = [],
    categories: Category[] = [],
  ): Transaction[] {
    const searchLower = (criteria.searchTerm || '').trim().toLowerCase();
    const accountsMap = new Map<string, string>(
      accounts.map((a) => [a.id, a.name.toLowerCase()]),
    );
    const categoriesMap = new Map<string, string>(
      categories.map((c) => [c.id, c.name.toLowerCase()]),
    );

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter((tx) => {
      // 1. Type Filter
      if (criteria.type && criteria.type !== 'ALL') {
        if (tx.type !== criteria.type) return false;
      }

      // 2. Account Filter
      if (criteria.accountId) {
        const matchesSource = tx.accountId === criteria.accountId;
        const matchesDest = tx.destinationAccountId === criteria.accountId;
        if (!matchesSource && !matchesDest) return false;
      }

      // 3. Category Filter
      if (criteria.categoryId) {
        if (tx.categoryId !== criteria.categoryId) return false;
      }

      // 4. Date Preset Filter
      const txDate = new Date(tx.date);
      if (criteria.datePreset === 'THIS_MONTH') {
        if (
          txDate.getFullYear() !== currentYear ||
          txDate.getMonth() !== currentMonth
        ) {
          return false;
        }
      } else if (criteria.datePreset === 'LAST_MONTH') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear =
          currentMonth === 0 ? currentYear - 1 : currentYear;
        if (
          txDate.getFullYear() !== lastMonthYear ||
          txDate.getMonth() !== lastMonth
        ) {
          return false;
        }
      } else if (criteria.datePreset === 'LAST_30_DAYS') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (txDate < thirtyDaysAgo) return false;
      }

      // 5. Custom Date Range
      if (criteria.startDate) {
        const start = new Date(criteria.startDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }
      if (criteria.endDate) {
        const end = new Date(criteria.endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }

      // 6. Text Search (Note, Amount, Account Name, Category Name)
      if (searchLower) {
        const noteMatch = (tx.note || '').toLowerCase().includes(searchLower);
        const amountMatch = tx.amount.toString().includes(searchLower);
        const accountName = accountsMap.get(tx.accountId) || '';
        const destAccountName = tx.destinationAccountId
          ? accountsMap.get(tx.destinationAccountId) || ''
          : '';
        const accountMatch =
          accountName.includes(searchLower) ||
          destAccountName.includes(searchLower);
        const categoryName = tx.categoryId
          ? categoriesMap.get(tx.categoryId) || ''
          : '';
        const categoryMatch = categoryName.includes(searchLower);

        if (!noteMatch && !amountMatch && !accountMatch && !categoryMatch) {
          return false;
        }
      }

      return true;
    });
  }
}
