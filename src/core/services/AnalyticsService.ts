import { DateFormatter } from './DateFormatter';
import type { Category } from '../entities/Category';
import type { Transaction } from '../entities/Transaction';
import type { SupportedCurrency } from '../entities/Account';

export interface CategoryExpenseBreakdown {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  formattedAmount: string;
  percentage: number;
}

export interface CashflowMetrics {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number; // percentage (0 - 100 or negative)
  isPositive: boolean;
}

const DEFAULT_CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#64748B', // Slate
];

export interface PeriodicTrendPoint {
  periodKey: string;
  periodLabel: string;
  income: number;
  expenses: number;
  net: number;
}

export class AnalyticsService {
  /**
   * Calculates expenses broken down by category, converted to the target currency.
   */
  static calculateCategoryExpenses(params: {
    transactions: Transaction[];
    categories: Category[];
    accountsCurrencyMap: Record<string, string>;
    convertFn: (
      amount: number,
      fromCurrency: string,
      toCurrency: SupportedCurrency,
    ) => number;
    targetCurrency: SupportedCurrency;
    formatFn: (amount: number, currency: string) => string;
  }): CategoryExpenseBreakdown[] {
    const {
      transactions,
      categories,
      accountsCurrencyMap,
      convertFn,
      targetCurrency,
      formatFn,
    } = params;

    const categoriesMap = new Map<string, Category>();
    categories.forEach((cat) => categoriesMap.set(cat.id, cat));

    // Filter only expense transactions
    const expenseTransactions = transactions.filter(
      (tx) => tx.type === 'EXPENSE',
    );

    if (expenseTransactions.length === 0) {
      return [];
    }

    const categoryTotals = new Map<string, number>();
    let totalExpenseConverted = 0;

    expenseTransactions.forEach((tx) => {
      const catId = tx.categoryId || 'uncategorized';
      const sourceCurrency = accountsCurrencyMap[tx.accountId] || 'USD';
      const convertedAmount = convertFn(
        tx.amount,
        sourceCurrency,
        targetCurrency,
      );

      categoryTotals.set(
        catId,
        (categoryTotals.get(catId) || 0) + convertedAmount,
      );
      totalExpenseConverted += convertedAmount;
    });

    if (totalExpenseConverted <= 0) {
      return [];
    }

    const breakdown: CategoryExpenseBreakdown[] = [];
    let colorIdx = 0;

    categoryTotals.forEach((amount, catId) => {
      const category = categoriesMap.get(catId);
      const name = category ? category.name : 'General / Sin categoría';
      const icon = category?.icon || 'i-heroicons-tag';
      const color =
        category?.color ||
        DEFAULT_CATEGORY_COLORS[colorIdx % DEFAULT_CATEGORY_COLORS.length];
      colorIdx++;

      const percentage = (amount / totalExpenseConverted) * 100;

      breakdown.push({
        categoryId: catId,
        categoryName: name,
        color,
        icon,
        amount: Math.round(amount * 100) / 100,
        formattedAmount: formatFn(amount, targetCurrency),
        percentage: Math.round(percentage * 10) / 10,
      });
    });

    // Sort descending by amount
    return breakdown.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Computes cashflow metrics and savings rate.
   */
  static calculateCashflowMetrics(
    totalIncome: number,
    totalExpenses: number,
  ): CashflowMetrics {
    const netSavings = totalIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0
        ? (netSavings / totalIncome) * 100
        : netSavings >= 0
          ? 0
          : -100;

    return {
      totalIncome,
      totalExpenses,
      netSavings: Math.round(netSavings * 100) / 100,
      savingsRate: Math.round(savingsRate * 10) / 10,
      isPositive: netSavings >= 0,
    };
  }

  /**
   * Calculates monthly or periodic breakdown for trend visualization.
   */
  static calculatePeriodicTrends(params: {
    transactions: Transaction[];
    accountsCurrencyMap: Record<string, string>;
    convertFn: (
      amount: number,
      fromCurrency: string,
      toCurrency: SupportedCurrency,
    ) => number;
    targetCurrency: SupportedCurrency;
  }): PeriodicTrendPoint[] {
    const { transactions, accountsCurrencyMap, convertFn, targetCurrency } =
      params;

    const monthMap = new Map<
      string,
      { label: string; income: number; expenses: number; sortKey: number }
    >();

    transactions.forEach((tx) => {
      if (tx.type !== 'INCOME' && tx.type !== 'EXPENSE') return;

      const d = new Date(tx.date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = DateFormatter.format(tx.date, 'MMM YYYY');
      const sortKey = year * 100 + month;

      if (!monthMap.has(key)) {
        monthMap.set(key, { label, income: 0, expenses: 0, sortKey });
      }

      const entry = monthMap.get(key)!;
      const sourceCurrency = accountsCurrencyMap[tx.accountId] || 'USD';
      const converted = convertFn(tx.amount, sourceCurrency, targetCurrency);

      if (tx.type === 'INCOME') {
        entry.income += converted;
      } else if (tx.type === 'EXPENSE') {
        entry.expenses += converted;
      }
    });

    const points: PeriodicTrendPoint[] = [];
    Array.from(monthMap.entries())
      .sort((a, b) => a[1].sortKey - b[1].sortKey)
      .forEach(([key, val]) => {
        points.push({
          periodKey: key,
          periodLabel: val.label,
          income: Math.round(val.income * 100) / 100,
          expenses: Math.round(val.expenses * 100) / 100,
          net: Math.round((val.income - val.expenses) * 100) / 100,
        });
      });

    return points;
  }
}
