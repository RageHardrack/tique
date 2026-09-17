import dayjs from 'dayjs';
import type { Subscription } from '../entities/Subscription';
import type { Budget } from '../entities/Budget';
import type { Loan } from '../entities/Loan';
import type { SupportedCurrency } from '../entities/Account';

export interface MonthlyCommitmentsSummary {
  totalSubscriptionsMonthly: number;
  totalBudgetsMonthly: number;
  totalLoanPaymentsMonthly: number;
  totalCommitmentsMonthly: number;
  targetCurrency: SupportedCurrency;
}

export interface FreeCashflowAnalysis {
  monthlyIncome: number;
  totalCommitments: number;
  freeMargin: number;
  marginPercentage: number;
  isDeficit: boolean;
}

export interface PurchaseSimulationResult {
  targetAmount: number;
  monthlyAllocation: number;
  monthsNeeded: number;
  weeksNeeded: number;
  isAchievable: boolean;
  estimatedCompletionDate: string | null;
}

export class SavingsCapacityCalculatorService {
  /**
   * Normalizes a subscription's recurrence frequency into an equivalent monthly expense.
   */
  static normalizeSubscriptionMonthly(sub: Subscription): number {
    if (!sub.isActive || !sub.amount || sub.amount <= 0) {
      return 0;
    }

    let monthly = 0;
    switch (sub.frequency) {
      case 'WEEKLY':
        // 52 weeks / 12 months
        monthly = (sub.amount * 52) / 12;
        break;
      case 'BIWEEKLY':
        // 26 bi-weeks / 12 months
        monthly = (sub.amount * 26) / 12;
        break;
      case 'MONTHLY':
        monthly = sub.amount;
        break;
      case 'BIMONTHLY':
        monthly = sub.amount / 2;
        break;
      case 'QUARTERLY':
        monthly = sub.amount / 3;
        break;
      case 'SEMIANNUAL':
        monthly = sub.amount / 6;
        break;
      case 'YEARLY':
        monthly = sub.amount / 12;
        break;
      case 'CUSTOM': {
        const days = sub.customIntervalDays && sub.customIntervalDays > 0 ? sub.customIntervalDays : 30;
        monthly = (sub.amount * 30) / days;
        break;
      }
      default:
        monthly = sub.amount;
        break;
    }

    return Math.round(monthly * 100) / 100;
  }

  /**
   * Aggregates monthly commitments from subscriptions, budgets, and non-credit-card loans.
   */
  static calculateMonthlyCommitments(params: {
    subscriptions: Subscription[];
    budgets: Budget[];
    loans: Loan[];
    targetCurrency?: SupportedCurrency;
    convertFn: (amount: number, from: string, to: SupportedCurrency) => number;
  }): MonthlyCommitmentsSummary {
    const {
      subscriptions,
      budgets,
      loans,
      targetCurrency = 'USD',
      convertFn,
    } = params;

    // 1. Subscriptions
    const totalSubscriptions = subscriptions.reduce((sum, sub) => {
      const normalizedMonthly = this.normalizeSubscriptionMonthly(sub);
      const converted = convertFn(normalizedMonthly, sub.currency || 'USD', targetCurrency);
      return sum + converted;
    }, 0);

    // 2. Budgets
    const totalBudgets = budgets.reduce((sum, b) => {
      const converted = convertFn(b.amount || 0, b.currency || 'USD', targetCurrency);
      return sum + converted;
    }, 0);

    // 3. Loans: only borrowed loans with remaining balance
    const totalLoans = loans
      .filter((l) => l.type === 'BORROWED' && l.status !== 'PAID' && (l.remainingAmount || 0) > 0)
      .reduce((sum, l) => {
        const installments = l.installmentsCount && l.installmentsCount > 0 ? l.installmentsCount : 1;
        const monthlyInstallment = l.remainingAmount / installments;
        const converted = convertFn(monthlyInstallment, l.currency || 'USD', targetCurrency);
        return sum + converted;
      }, 0);

    const roundedSubscriptions = Math.round(totalSubscriptions * 100) / 100;
    const roundedBudgets = Math.round(totalBudgets * 100) / 100;
    const roundedLoans = Math.round(totalLoans * 100) / 100;
    const totalCommitments = Math.round((roundedSubscriptions + roundedBudgets + roundedLoans) * 100) / 100;

    return {
      totalSubscriptionsMonthly: roundedSubscriptions,
      totalBudgetsMonthly: roundedBudgets,
      totalLoanPaymentsMonthly: roundedLoans,
      totalCommitmentsMonthly: totalCommitments,
      targetCurrency,
    };
  }

  /**
   * Evaluates free cashflow and net savings margin based on expected monthly income.
   */
  static calculateFreeCashflow(params: {
    monthlyIncome: number;
    commitments: number;
  }): FreeCashflowAnalysis {
    const income = Math.max(0, params.monthlyIncome || 0);
    const commitments = Math.max(0, params.commitments || 0);
    const freeMargin = Math.round((income - commitments) * 100) / 100;

    const marginPercentage =
      income > 0 ? Math.round((freeMargin / income) * 1000) / 10 : freeMargin < 0 ? -100 : 0;

    return {
      monthlyIncome: income,
      totalCommitments: commitments,
      freeMargin,
      marginPercentage,
      isDeficit: freeMargin < 0,
    };
  }

  /**
   * Simulates how long (in months and weeks) it takes to reach a purchase or goal amount
   * given a dedicated monthly allocation.
   */
  static simulatePurchaseTimeline(params: {
    targetAmount: number;
    monthlyAllocation: number;
    startDate?: string | Date;
  }): PurchaseSimulationResult {
    const target = Math.max(0, params.targetAmount || 0);
    const allocation = Math.max(0, params.monthlyAllocation || 0);

    if (target === 0) {
      return {
        targetAmount: 0,
        monthlyAllocation: allocation,
        monthsNeeded: 0,
        weeksNeeded: 0,
        isAchievable: true,
        estimatedCompletionDate: dayjs(params.startDate || new Date()).format('YYYY-MM-DD'),
      };
    }

    if (allocation <= 0) {
      return {
        targetAmount: target,
        monthlyAllocation: 0,
        monthsNeeded: Infinity,
        weeksNeeded: Infinity,
        isAchievable: false,
        estimatedCompletionDate: null,
      };
    }

    const monthsFloat = target / allocation;
    const monthsNeeded = Math.ceil(monthsFloat);
    const weeksNeeded = Math.ceil((target / (allocation / 4.33)));

    const start = params.startDate
      ? dayjs(params.startDate)
      : dayjs();
    const estimatedCompletionDate = start.add(monthsNeeded, 'month').format('YYYY-MM-DD');

    return {
      targetAmount: target,
      monthlyAllocation: allocation,
      monthsNeeded,
      weeksNeeded,
      isAchievable: true,
      estimatedCompletionDate,
    };
  }
}
