import { describe, expect, it } from 'vitest';

import type { CategoryExpenseBreakdown } from './AnalyticsService';
import { CategoryBreakdownGrouper } from './CategoryBreakdownGrouper';

describe('CategoryBreakdownGrouper', () => {
  const mockCategories: CategoryExpenseBreakdown[] = [
    {
      categoryId: '1',
      categoryName: 'Alquiler',
      color: '#3B82F6',
      icon: 'i-heroicons-home',
      amount: 1000,
      formattedAmount: '$1,000.00',
      percentage: 50,
    },
    {
      categoryId: '2',
      categoryName: 'Supermercado',
      color: '#10B981',
      icon: 'i-heroicons-shopping-cart',
      amount: 400,
      formattedAmount: '$400.00',
      percentage: 20,
    },
    {
      categoryId: '3',
      categoryName: 'Servicios',
      color: '#F59E0B',
      icon: 'i-heroicons-bolt',
      amount: 200,
      formattedAmount: '$200.00',
      percentage: 10,
    },
    {
      categoryId: '4',
      categoryName: 'Restaurantes',
      color: '#EC4899',
      icon: 'i-heroicons-cake',
      amount: 160,
      formattedAmount: '$160.00',
      percentage: 8,
    },
    {
      categoryId: '5',
      categoryName: 'Transporte',
      color: '#8B5CF6',
      icon: 'i-heroicons-truck',
      amount: 100,
      formattedAmount: '$100.00',
      percentage: 5,
    },
    {
      categoryId: '6',
      categoryName: 'Suscripciones',
      color: '#06B6D4',
      icon: 'i-heroicons-tv',
      amount: 80,
      formattedAmount: '$80.00',
      percentage: 4,
    },
    {
      categoryId: '7',
      categoryName: 'Salud',
      color: '#EF4444',
      icon: 'i-heroicons-heart',
      amount: 60,
      formattedAmount: '$60.00',
      percentage: 3,
    },
  ];

  it('should not group categories when count is less than or equal to limit', () => {
    const smallList = mockCategories.slice(0, 4);
    const result = CategoryBreakdownGrouper.group(smallList, 5);

    expect(result.hasMore).toBe(false);
    expect(result.topItems).toHaveLength(4);
    expect(result.othersItem).toBeNull();
    expect(result.chartItems).toHaveLength(4);
    expect(result.totalCategoriesCount).toBe(4);
  });

  it('should group categories exceeding limit into "others" item', () => {
    const result = CategoryBreakdownGrouper.group(
      mockCategories,
      5,
      'Otras categorías',
      (amount) => `$${amount.toFixed(2)}`,
    );

    expect(result.hasMore).toBe(true);
    expect(result.topItems).toHaveLength(5);
    expect(result.totalCategoriesCount).toBe(7);
    expect(result.othersItem).not.toBeNull();
    expect(result.othersItem?.categoryName).toBe('Otras categorías (2)');
    expect(result.othersItem?.amount).toBe(140); // 80 + 60
    expect(result.othersItem?.percentage).toBe(7); // 4 + 3
    expect(result.othersItem?.formattedAmount).toBe('$140.00');

    // Chart items must contain the 5 top items plus the aggregated "others" item
    expect(result.chartItems).toHaveLength(6);
    expect(result.chartItems[5].categoryId).toBe('others-aggregate');
  });

  it('should preserve all original items in allItems array', () => {
    const result = CategoryBreakdownGrouper.group(mockCategories, 5);

    expect(result.allItems).toHaveLength(7);
    expect(result.allItems[0].categoryId).toBe('1');
    expect(result.allItems[6].categoryId).toBe('7');
  });
});
