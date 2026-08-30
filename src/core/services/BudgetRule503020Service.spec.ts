import { describe, expect, it } from 'vitest';
import { BudgetRule503020Service } from './BudgetRule503020Service';
import type { Category } from '../entities/Category';
import type { Transaction } from '../entities/Transaction';
import type { Budget } from '../entities/Budget';

describe('BudgetRule503020Service (50/30/20 Monthly Budgeting Engine)', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-rent',
      userId: 'u1',
      name: 'Alquiler Departamento',
      type: 'EXPENSE',
      budgetGroup: 'NEEDS',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cat-utilities',
      userId: 'u1',
      name: 'Servicios de Luz & Agua',
      type: 'EXPENSE',
      budgetGroup: 'NEEDS',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cat-dining',
      userId: 'u1',
      name: 'Restaurantes & Salidas',
      type: 'EXPENSE',
      budgetGroup: 'WANTS',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cat-invest',
      userId: 'u1',
      name: 'Fondos de Inversión',
      type: 'EXPENSE',
      budgetGroup: 'SAVINGS',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cat-misc',
      userId: 'u1',
      name: 'Varios no clasificados',
      type: 'EXPENSE',
      budgetGroup: 'UNASSIGNED',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockBudgets: Budget[] = [
    {
      id: 'b-rent',
      userId: 'u1',
      categoryId: 'cat-rent',
      amount: 1500,
      currency: 'PEN',
      period: 'MONTHLY',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'b-utilities',
      userId: 'u1',
      categoryId: 'cat-utilities',
      amount: 300,
      currency: 'PEN',
      period: 'MONTHLY',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'b-dining',
      userId: 'u1',
      categoryId: 'cat-dining',
      amount: 800,
      currency: 'PEN',
      period: 'MONTHLY',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockTransactions: Transaction[] = [
    // Monthly Incomes
    {
      id: 'tx-inc-1',
      userId: 'u1',
      accountId: 'acc-1',
      amount: 4000,
      type: 'INCOME',
      date: '2026-08-05T00:00:00.000Z',
      note: 'Sueldo mensual',
      createdAt: '2026-08-05T00:00:00.000Z',
      updatedAt: '2026-08-05T00:00:00.000Z',
    },
    // Needs expenses
    {
      id: 'tx-exp-1',
      userId: 'u1',
      accountId: 'acc-1',
      categoryId: 'cat-rent',
      amount: 1500,
      type: 'EXPENSE',
      date: '2026-08-06T00:00:00.000Z',
      note: 'Pago alquiler',
      createdAt: '2026-08-06T00:00:00.000Z',
      updatedAt: '2026-08-06T00:00:00.000Z',
    },
    {
      id: 'tx-exp-2',
      userId: 'u1',
      accountId: 'acc-1',
      categoryId: 'cat-utilities',
      amount: 250,
      type: 'EXPENSE',
      date: '2026-08-10T00:00:00.000Z',
      note: 'Luz y agua',
      createdAt: '2026-08-10T00:00:00.000Z',
      updatedAt: '2026-08-10T00:00:00.000Z',
    },
    // Wants expenses
    {
      id: 'tx-exp-3',
      userId: 'u1',
      accountId: 'acc-1',
      categoryId: 'cat-dining',
      amount: 600,
      type: 'EXPENSE',
      date: '2026-08-15T00:00:00.000Z',
      note: 'Cena fin de semana',
      createdAt: '2026-08-15T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z',
    },
    // Savings transfer / expense
    {
      id: 'tx-exp-4',
      userId: 'u1',
      accountId: 'acc-1',
      categoryId: 'cat-invest',
      amount: 500,
      type: 'EXPENSE',
      date: '2026-08-20T00:00:00.000Z',
      note: 'Aporte ETF',
      createdAt: '2026-08-20T00:00:00.000Z',
      updatedAt: '2026-08-20T00:00:00.000Z',
    },
    // Unassigned expense
    {
      id: 'tx-exp-5',
      userId: 'u1',
      accountId: 'acc-1',
      categoryId: 'cat-misc',
      amount: 100,
      type: 'EXPENSE',
      date: '2026-08-22T00:00:00.000Z',
      note: 'Gasto no clasificado',
      createdAt: '2026-08-22T00:00:00.000Z',
      updatedAt: '2026-08-22T00:00:00.000Z',
    },
    // Expense in another month (July) - should be ignored
    {
      id: 'tx-exp-old',
      userId: 'u1',
      accountId: 'acc-1',
      categoryId: 'cat-rent',
      amount: 1500,
      type: 'EXPENSE',
      date: '2026-07-06T00:00:00.000Z',
      note: 'Alquiler Julio',
      createdAt: '2026-07-06T00:00:00.000Z',
      updatedAt: '2026-07-06T00:00:00.000Z',
    },
  ];

  it('calculates 50/30/20 targets and actuals accurately for August 2026', () => {
    const report = BudgetRule503020Service.calculate({
      transactions: mockTransactions,
      categories: mockCategories,
      budgets: mockBudgets,
      year: 2026,
      month: 8,
    });

    // Total Monthly Income = 4000
    expect(report.totalIncome).toBe(4000);

    // 50% Needs
    expect(report.needs.targetAmount).toBe(2000); // 4000 * 0.50
    expect(report.needs.actualSpent).toBe(1750); // 1500 + 250
    expect(report.needs.budgetedAmount).toBe(1800); // 1500 + 300
    expect(report.needs.actualPercentage).toBeCloseTo(43.75); // 1750 / 4000 = 43.75%
    expect(report.needs.status).toBe('HEALTHY');

    // 30% Wants
    expect(report.wants.targetAmount).toBe(1200); // 4000 * 0.30
    expect(report.wants.actualSpent).toBe(600); // 600
    expect(report.wants.budgetedAmount).toBe(800);
    expect(report.wants.actualPercentage).toBeCloseTo(15); // 600 / 4000 = 15%
    expect(report.wants.status).toBe('HEALTHY');

    // 20% Savings
    expect(report.savings.targetAmount).toBe(800); // 4000 * 0.20
    expect(report.savings.actualSpent).toBe(500); // 500
    expect(report.savings.actualPercentage).toBeCloseTo(12.5); // 500 / 4000 = 12.5%

    // Unassigned
    expect(report.unassigned.actualSpent).toBe(100);

    // Fixed expenses breakdown list
    expect(report.fixedExpensesBreakdown.length).toBe(2);
    expect(report.fixedExpensesBreakdown[0].category.name).toBe('Alquiler Departamento');
    expect(report.fixedExpensesBreakdown[0].spent).toBe(1500);
    expect(report.fixedExpensesBreakdown[1].category.name).toBe('Servicios de Luz & Agua');
    expect(report.fixedExpensesBreakdown[1].spent).toBe(250);
  });

  it('handles zero income gracefully without division by zero', () => {
    const report = BudgetRule503020Service.calculate({
      transactions: [],
      categories: mockCategories,
      budgets: mockBudgets,
      year: 2026,
      month: 8,
    });

    expect(report.totalIncome).toBe(0);
    expect(report.needs.targetAmount).toBe(0);
    expect(report.needs.actualPercentage).toBe(0);
    expect(report.wants.targetAmount).toBe(0);
    expect(report.wants.actualPercentage).toBe(0);
    expect(report.savings.targetAmount).toBe(0);
    expect(report.savings.actualPercentage).toBe(0);
  });
});
