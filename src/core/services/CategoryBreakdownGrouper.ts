import type { CategoryExpenseBreakdown } from './AnalyticsService';

export interface GroupedCategoryBreakdown {
  topItems: CategoryExpenseBreakdown[];
  othersItem: CategoryExpenseBreakdown | null;
  chartItems: CategoryExpenseBreakdown[];
  allItems: CategoryExpenseBreakdown[];
  hasMore: boolean;
  totalCategoriesCount: number;
}

export class CategoryBreakdownGrouper {
  static group(
    breakdown: CategoryExpenseBreakdown[],
    limit = 5,
    othersLabel = 'Otras categorías',
    formatFn?: (amount: number) => string,
  ): GroupedCategoryBreakdown {
    const totalCategoriesCount = breakdown.length;

    if (totalCategoriesCount <= limit) {
      return {
        topItems: breakdown,
        othersItem: null,
        chartItems: breakdown,
        allItems: breakdown,
        hasMore: false,
        totalCategoriesCount,
      };
    }

    const topItems = breakdown.slice(0, limit);
    const remaining = breakdown.slice(limit);

    const othersAmount = remaining.reduce((sum, item) => sum + item.amount, 0);
    const rawOthersPercentage = remaining.reduce(
      (sum, item) => sum + item.percentage,
      0,
    );
    const othersPercentage = Math.round(rawOthersPercentage * 10) / 10;

    const formattedAmount = formatFn
      ? formatFn(othersAmount)
      : remaining[0]?.formattedAmount
        ? `${othersAmount.toFixed(2)}`
        : `${othersAmount}`;

    const othersItem: CategoryExpenseBreakdown = {
      categoryId: 'others-aggregate',
      categoryName: `${othersLabel} (${remaining.length})`,
      color: '#94A3B8', // Neutral Slate
      icon: 'i-heroicons-squares-plus',
      amount: othersAmount,
      formattedAmount,
      percentage: othersPercentage,
    };

    const chartItems = [...topItems, othersItem];

    return {
      topItems,
      othersItem,
      chartItems,
      allItems: breakdown,
      hasMore: true,
      totalCategoriesCount,
    };
  }
}
