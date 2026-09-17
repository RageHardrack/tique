import { describe, expect, it } from 'vitest';
import { SavingsCapacityCalculatorService } from './SavingsCapacityCalculatorService';
import type { Subscription } from '../entities/Subscription';
import type { Budget } from '../entities/Budget';
import type { Loan } from '../entities/Loan';

describe('SavingsCapacityCalculatorService', () => {
  const mockSub = (overrides: Partial<Subscription> = {}): Subscription => ({
    id: 'sub-1',
    userId: 'usr-1',
    accountId: 'acc-1',
    name: 'Streaming',
    amount: 10,
    currency: 'USD',
    frequency: 'MONTHLY',
    nextDueDate: '2026-09-01',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  });

  const mockBudget = (overrides: Partial<Budget> = {}): Budget => ({
    id: 'b-1',
    userId: 'usr-1',
    categoryId: 'cat-1',
    amount: 300,
    currency: 'USD',
    period: 'MONTHLY',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  });

  const mockLoan = (overrides: Partial<Loan> = {}): Loan => ({
    id: 'l-1',
    userId: 'usr-1',
    personName: 'Banco',
    type: 'BORROWED',
    amount: 1200,
    remainingAmount: 600,
    currency: 'USD',
    status: 'PENDING',
    installmentsCount: 12,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  });

  describe('normalizeSubscriptionMonthly', () => {
    it('normalizes monthly subscription as exact amount', () => {
      const sub = mockSub({ amount: 50, frequency: 'MONTHLY' });
      expect(SavingsCapacityCalculatorService.normalizeSubscriptionMonthly(sub)).toBe(50);
    });

    it('normalizes weekly subscription to monthly (amount * 52 / 12)', () => {
      const sub = mockSub({ amount: 100, frequency: 'WEEKLY' });
      // 100 * 52 / 12 = 433.33
      expect(SavingsCapacityCalculatorService.normalizeSubscriptionMonthly(sub)).toBe(433.33);
    });

    it('normalizes biweekly subscription to monthly (amount * 26 / 12)', () => {
      const sub = mockSub({ amount: 100, frequency: 'BIWEEKLY' });
      // 100 * 26 / 12 = 216.67
      expect(SavingsCapacityCalculatorService.normalizeSubscriptionMonthly(sub)).toBe(216.67);
    });

    it('normalizes bimonthly subscription to monthly (amount / 2)', () => {
      const sub = mockSub({ amount: 100, frequency: 'BIMONTHLY' });
      expect(SavingsCapacityCalculatorService.normalizeSubscriptionMonthly(sub)).toBe(50);
    });

    it('normalizes quarterly subscription to monthly (amount / 3)', () => {
      const sub = mockSub({ amount: 120, frequency: 'QUARTERLY' });
      expect(SavingsCapacityCalculatorService.normalizeSubscriptionMonthly(sub)).toBe(40);
    });

    it('normalizes semiannual subscription to monthly (amount / 6)', () => {
      const sub = mockSub({ amount: 300, frequency: 'SEMIANNUAL' });
      expect(SavingsCapacityCalculatorService.normalizeSubscriptionMonthly(sub)).toBe(50);
    });

    it('normalizes yearly subscription to monthly (amount / 12)', () => {
      const sub = mockSub({ amount: 120, frequency: 'YEARLY' });
      expect(SavingsCapacityCalculatorService.normalizeSubscriptionMonthly(sub)).toBe(10);
    });

    it('normalizes custom days subscription (amount * 30 / days)', () => {
      const sub = mockSub({ amount: 60, frequency: 'CUSTOM', customIntervalDays: 60 });
      // 60 * 30 / 60 = 30
      expect(SavingsCapacityCalculatorService.normalizeSubscriptionMonthly(sub)).toBe(30);
    });

    it('returns 0 for inactive subscription', () => {
      const sub = mockSub({ amount: 50, frequency: 'MONTHLY', isActive: false });
      expect(SavingsCapacityCalculatorService.normalizeSubscriptionMonthly(sub)).toBe(0);
    });
  });

  describe('calculateMonthlyCommitments', () => {
    it('aggregates subscriptions, budgets, and borrowed loans with multi-currency conversion', () => {
      const subscriptions = [
        mockSub({ amount: 10, frequency: 'MONTHLY', currency: 'USD' }),
        mockSub({ amount: 120, frequency: 'YEARLY', currency: 'USD' }), // 10/month
      ];
      const budgets = [
        mockBudget({ amount: 200, currency: 'USD' }),
        mockBudget({ amount: 150, currency: 'USD' }),
      ];
      const loans = [
        mockLoan({ remainingAmount: 500, installmentsCount: 5, currency: 'USD', type: 'BORROWED' }), // 100/mo
        mockLoan({ remainingAmount: 300, type: 'LENT' }), // Lent loan is not an expense commitment
      ];

      const result = SavingsCapacityCalculatorService.calculateMonthlyCommitments({
        subscriptions,
        budgets,
        loans,
        targetCurrency: 'USD',
        convertFn: (amt) => amt,
      });

      // Subscriptions: 10 + 10 = 20
      // Budgets: 200 + 150 = 350
      // Loans: 500 / 5 = 100
      // Total = 470
      expect(result.totalSubscriptionsMonthly).toBe(20);
      expect(result.totalBudgetsMonthly).toBe(350);
      expect(result.totalLoanPaymentsMonthly).toBe(100);
      expect(result.totalCommitmentsMonthly).toBe(470);
    });
  });

  describe('calculateFreeCashflow', () => {
    it('calculates positive free cashflow and savings capacity percentage', () => {
      const cashflow = SavingsCapacityCalculatorService.calculateFreeCashflow({
        monthlyIncome: 1000,
        commitments: 600,
      });

      expect(cashflow.monthlyIncome).toBe(1000);
      expect(cashflow.totalCommitments).toBe(600);
      expect(cashflow.freeMargin).toBe(400);
      expect(cashflow.marginPercentage).toBe(40);
      expect(cashflow.isDeficit).toBe(false);
    });

    it('handles deficit when commitments exceed monthly income', () => {
      const cashflow = SavingsCapacityCalculatorService.calculateFreeCashflow({
        monthlyIncome: 500,
        commitments: 750,
      });

      expect(cashflow.freeMargin).toBe(-250);
      expect(cashflow.marginPercentage).toBe(-50);
      expect(cashflow.isDeficit).toBe(true);
    });
  });

  describe('simulatePurchaseTimeline', () => {
    const startDate = '2026-09-15';

    it('calculates accurate months and weeks needed for target purchase', () => {
      const simulation = SavingsCapacityCalculatorService.simulatePurchaseTimeline({
        targetAmount: 1000,
        monthlyAllocation: 250,
        startDate,
      });

      expect(simulation.targetAmount).toBe(1000);
      expect(simulation.monthlyAllocation).toBe(250);
      expect(simulation.monthsNeeded).toBe(4);
      expect(simulation.weeksNeeded).toBe(18);
      expect(simulation.isAchievable).toBe(true);
      expect(simulation.estimatedCompletionDate).toBe('2027-01-15');
    });

    it('handles impossible simulation when allocation is <= 0', () => {
      const simulation = SavingsCapacityCalculatorService.simulatePurchaseTimeline({
        targetAmount: 1000,
        monthlyAllocation: 0,
        startDate,
      });

      expect(simulation.monthsNeeded).toBe(Infinity);
      expect(simulation.isAchievable).toBe(false);
      expect(simulation.estimatedCompletionDate).toBeNull();
    });

    it('calculates timeline when target amount is 0 (already fulfilled)', () => {
      const simulation = SavingsCapacityCalculatorService.simulatePurchaseTimeline({
        targetAmount: 0,
        monthlyAllocation: 200,
        startDate,
      });

      expect(simulation.monthsNeeded).toBe(0);
      expect(simulation.weeksNeeded).toBe(0);
      expect(simulation.isAchievable).toBe(true);
    });
  });
});
