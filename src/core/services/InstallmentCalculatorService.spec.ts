import { describe, expect, it } from 'vitest';
import { InstallmentCalculatorService } from './InstallmentCalculatorService';

describe('InstallmentCalculatorService', () => {
  it('generates exact Cashea-style 14-day 3-installment schedule with 0% interest', () => {
    const result = InstallmentCalculatorService.generateSchedule({
      totalAmount: 120,
      installmentsCount: 3,
      frequency: 'BIWEEKLY_14_DAYS',
      startDate: '2026-09-01',
      interestRateMonthlyPercent: 0,
    });

    expect(result.financedAmount).toBe(120);
    expect(result.totalInterest).toBe(0);
    expect(result.totalToPay).toBe(120);
    expect(result.schedule).toHaveLength(3);

    // Cuotas de $40 cada 14 días
    expect(result.schedule[0].dueDate).toBe('2026-09-15');
    expect(result.schedule[0].amount).toBe(40);
    expect(result.schedule[1].dueDate).toBe('2026-09-29');
    expect(result.schedule[1].amount).toBe(40);
    expect(result.schedule[2].dueDate).toBe('2026-10-13');
    expect(result.schedule[2].amount).toBe(40);
  });

  it('correctly deducts initial down payment and splits remainder', () => {
    const result = InstallmentCalculatorService.generateSchedule({
      totalAmount: 200,
      initialDownPayment: 50,
      installmentsCount: 3,
      frequency: 'BIWEEKLY_14_DAYS',
      startDate: '2026-09-01',
    });

    expect(result.financedAmount).toBe(150);
    expect(result.totalToPay).toBe(150);
    expect(result.schedule).toHaveLength(3);
    expect(result.schedule[0].amount).toBe(50);
    expect(result.schedule[1].amount).toBe(50);
    expect(result.schedule[2].amount).toBe(50);
  });

  it('handles odd penny rounding without losing cents on the last installment', () => {
    const result = InstallmentCalculatorService.generateSchedule({
      totalAmount: 100,
      installmentsCount: 3,
      frequency: 'MONTHLY',
      startDate: '2026-09-01',
    });

    expect(result.schedule).toHaveLength(3);
    expect(result.schedule[0].amount).toBe(33.33);
    expect(result.schedule[1].amount).toBe(33.33);
    expect(result.schedule[2].amount).toBe(33.34); // Adjusted last penny
    expect(
      result.schedule[0].amount + result.schedule[1].amount + result.schedule[2].amount,
    ).toBe(100);
  });

  it('calculates credit card metrics, available line and minimum payment correctly', () => {
    const summary = InstallmentCalculatorService.calculateCreditCardSummary({
      creditLimit: 1000,
      currentDebt: 400,
      monthlyInterestRatePercent: 4.5,
      minPaymentPercent: 5,
    });

    expect(summary.availableCredit).toBe(600);
    expect(summary.utilizationPercentage).toBe(40);
    expect(summary.estimatedMonthlyInterest).toBe(18); // 400 * 0.045
    expect(summary.estimatedMinPayment).toBe(38); // 20 capital + 18 interest
  });
});
