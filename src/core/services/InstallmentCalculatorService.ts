import dayjs from 'dayjs';

export type InstallmentFrequency = 'WEEKLY_7_DAYS' | 'BIWEEKLY_14_DAYS' | 'MONTHLY' | 'CUSTOM';

export interface InstallmentScheduleItem {
  installmentNumber: number;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  amount: number;
  principalAmount: number;
  interestAmount: number;
  status: 'PENDIENTE' | 'PAGADA' | 'VENCIDA';
  paidDate?: string | null;
  paidAccountId?: string | null;
}

export interface GenerateInstallmentPlanParams {
  totalAmount: number;
  installmentsCount: number;
  frequency: InstallmentFrequency;
  customDaysInterval?: number;
  startDate?: string; // default today
  interestRateMonthlyPercent?: number; // 0 for Cashea / 0% interest
  initialDownPayment?: number; // Cuota inicial pagada hoy
}

export class InstallmentCalculatorService {
  /**
   * Generates a precise installment schedule with exact dates and rounded amounts.
   */
  static generateSchedule(params: GenerateInstallmentPlanParams): {
    schedule: InstallmentScheduleItem[];
    financedAmount: number;
    totalInterest: number;
    totalToPay: number;
    installmentAmount: number;
  } {
    const downPayment = Math.max(0, Number(params.initialDownPayment) || 0);
    const financedAmount = Math.max(0, Math.round((params.totalAmount - downPayment) * 100) / 100);
    const count = Math.max(1, Math.floor(params.installmentsCount));
    const interestPercent = Math.max(0, Number(params.interestRateMonthlyPercent) || 0);

    // Calculate total interest if interest rate is specified
    // Simple/standard installment interest approximation
    const totalInterest =
      interestPercent > 0
        ? Math.round(financedAmount * (interestPercent / 100) * (count / (params.frequency === 'MONTHLY' ? 1 : 2)) * 100) / 100
        : 0;

    const totalToPay = Math.round((financedAmount + totalInterest) * 100) / 100;
    const baseInstallment = Math.floor((totalToPay / count) * 100) / 100;
    const basePrincipal = Math.floor((financedAmount / count) * 100) / 100;
    const baseInterest = Math.floor((totalInterest / count) * 100) / 100;

    const start = params.startDate ? dayjs(params.startDate) : dayjs();
    const todayStr = dayjs().format('YYYY-MM-DD');

    const schedule: InstallmentScheduleItem[] = [];

    for (let i = 1; i <= count; i++) {
      let dueDate: dayjs.Dayjs;

      if (params.frequency === 'WEEKLY_7_DAYS') {
        dueDate = start.add(i * 7, 'day');
      } else if (params.frequency === 'BIWEEKLY_14_DAYS') {
        // Cashea style: first installment in 14 days, second in 28 days, third in 42 days...
        dueDate = start.add(i * 14, 'day');
      } else if (params.frequency === 'MONTHLY') {
        dueDate = start.add(i, 'month');
      } else {
        const interval = Math.max(1, params.customDaysInterval || 14);
        dueDate = start.add(i * interval, 'day');
      }

      const isLast = i === count;
      // Adjust last installment to prevent penny rounding drift
      const currentAmount = isLast
        ? Math.round((totalToPay - baseInstallment * (count - 1)) * 100) / 100
        : baseInstallment;

      const currentPrincipal = isLast
        ? Math.round((financedAmount - basePrincipal * (count - 1)) * 100) / 100
        : basePrincipal;

      const currentInterest = isLast
        ? Math.round((totalInterest - baseInterest * (count - 1)) * 100) / 100
        : baseInterest;

      const dueDateStr = dueDate.format('YYYY-MM-DD');
      const isOverdue = dueDateStr < todayStr;

      schedule.push({
        installmentNumber: i,
        dueDate: dueDateStr,
        amount: currentAmount,
        principalAmount: currentPrincipal,
        interestAmount: currentInterest,
        status: isOverdue ? 'VENCIDA' : 'PENDIENTE',
      });
    }

    return {
      schedule,
      financedAmount,
      totalInterest,
      totalToPay,
      installmentAmount: schedule[0]?.amount || 0,
    };
  }

  /**
   * Calculates minimum payment and estimated interest for credit cards.
   */
  static calculateCreditCardSummary(params: {
    creditLimit: number;
    currentDebt: number;
    monthlyInterestRatePercent?: number;
    minPaymentPercent?: number; // default 5% or minimum threshold
  }): {
    availableCredit: number;
    utilizationPercentage: number;
    estimatedMinPayment: number;
    estimatedMonthlyInterest: number;
  } {
    const limit = Math.max(0, Number(params.creditLimit) || 0);
    const debt = Math.max(0, Number(params.currentDebt) || 0);
    const availableCredit = Math.max(0, Math.round((limit - debt) * 100) / 100);
    const utilizationPercentage =
      limit > 0 ? Math.min(100, Math.round((debt / limit) * 1000) / 10) : 0;

    const rate = (params.monthlyInterestRatePercent || 0) / 100;
    const estimatedMonthlyInterest = Math.round(debt * rate * 100) / 100;

    // Minimum payment: 5% of principal balance or full debt if less than $10/S/30
    const minPercent = (params.minPaymentPercent || 5) / 100;
    const minCapital = Math.round(debt * minPercent * 100) / 100;
    const estimatedMinPayment = Math.min(debt, Math.max(minCapital + estimatedMonthlyInterest, Math.min(debt, 10)));

    return {
      availableCredit,
      utilizationPercentage,
      estimatedMinPayment: Math.round(estimatedMinPayment * 100) / 100,
      estimatedMonthlyInterest,
    };
  }
}
