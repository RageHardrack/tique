import { describe, expect, it } from 'vitest';
import { FinancialCalendarService } from './FinancialCalendarService';
import type { Subscription } from '../entities/Subscription';
import type { Loan } from '../entities/Loan';
import type { Account } from '../entities/Account';

describe('FinancialCalendarService', () => {
  const dummySubscriptions: Subscription[] = [
    {
      id: 'sub-1',
      userId: 'u1',
      name: 'Netflix 4K',
      accountId: 'acc-1',
      amount: 15.99,
      currency: 'USD',
      frequency: 'MONTHLY',
      nextDueDate: '2026-09-15T00:00:00.000Z',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const dummyLoans: Loan[] = [
    {
      id: 'loan-1',
      userId: 'u1',
      personName: 'Cashea Cuota 1',
      type: 'BORROWED',
      amount: 45.0,
      remainingAmount: 45.0,
      currency: 'USD',
      dueDate: '2026-09-20T00:00:00.000Z',
      status: 'PENDING',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const dummyAccounts: Account[] = [
    {
      id: 'acc-cc',
      userId: 'u1',
      name: 'Banesco Master Gold',
      type: 'CREDIT_CARD',
      balance: 120.0,
      creditLimit: 1000.0,
      statementClosingDay: 10,
      paymentDueDay: 25,
      currency: 'USD',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  it('generates month data with subscriptions, loans, and credit card dates', () => {
    const data = FinancialCalendarService.generateMonthData({
      year: 2026,
      month: 9, // Septiembre
      subscriptions: dummySubscriptions,
      loans: dummyLoans,
      accounts: dummyAccounts,
      today: new Date(2026, 8, 1),
    });

    expect(data.year).toBe(2026);
    expect(data.month).toBe(9);
    expect(data.monthName).toBe('Septiembre');
    expect(data.days.length).toBe(30);

    // Day 10: Credit card cutoff
    const day10 = data.days.find((d) => d.dayNumber === 10);
    expect(day10?.events.some((e) => e.type === 'CREDIT_CARD_CUTOFF')).toBe(true);

    // Day 15: Netflix subscription
    const day15 = data.days.find((d) => d.dayNumber === 15);
    expect(day15?.events.some((e) => e.title === 'Netflix 4K')).toBe(true);
    expect(day15?.totalAmountDue).toBe(15.99);

    // Day 20: Cashea Loan payment
    const day20 = data.days.find((d) => d.dayNumber === 20);
    expect(day20?.events.some((e) => e.type === 'LOAN_PAYMENT')).toBe(true);

    // Day 25: Credit card payment
    const day25 = data.days.find((d) => d.dayNumber === 25);
    expect(day25?.events.some((e) => e.type === 'CREDIT_CARD_PAYMENT')).toBe(true);

    expect(data.totalProjectedExpenses).toBe(15.99 + 45.0 + 120.0);
  });
});
