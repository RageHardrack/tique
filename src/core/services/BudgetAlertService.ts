import type { Budget } from '../entities/Budget';
import type { Transaction } from '../entities/Transaction';
import type { SupportedCurrency } from '../entities/Account';

export type BudgetAlertLevel = 'SAFE' | 'WARNING_80' | 'EXCEEDED_100';

export interface BudgetAlertStatus {
  hasAlert: boolean;
  level: BudgetAlertLevel;
  budgetName: string;
  categoryLimit: number;
  currentSpent: number;
  newSpent: number;
  projectedPercentage: number;
  budgetCurrency: string;
  message: string;
}

export interface CheckBudgetThresholdParams {
  categoryId: string;
  transactionAmount: number;
  transactionCurrency?: string;
  budgets: Budget[];
  monthlyTransactions?: Transaction[];
  accountsCurrencyMap?: Record<string, string>;
  baseCurrency?: SupportedCurrency;
  convertFn?: (
    amount: number,
    fromCurrency: string,
    toCurrency: SupportedCurrency,
  ) => number;
  currentDate?: Date;
}

export class BudgetAlertService {
  /**
   * Evaluates if adding a transaction will trigger an overspending threshold (>80% warning or >100% exceeded)
   * for the budget assigned to the category in the current period, taking multi-currency conversion into account.
   */
  static checkBudgetThreshold(
    params: CheckBudgetThresholdParams,
  ): BudgetAlertStatus | null {
    const {
      categoryId,
      transactionAmount,
      transactionCurrency = 'USD',
      budgets,
      monthlyTransactions = [],
      accountsCurrencyMap = {},
      baseCurrency = 'USD',
      convertFn,
    } = params;

    if (!categoryId || !transactionAmount || transactionAmount <= 0) return null;

    // Find active budget for this category
    const budget = budgets.find((b) => b.categoryId === categoryId);
    if (!budget || !budget.amount || budget.amount <= 0) return null;

    const targetBudgetCurrency = (budget.currency || baseCurrency) as SupportedCurrency;

    // Convert helper
    const toTargetCurrency = (amount: number, fromCurrency: string): number => {
      if (!convertFn || fromCurrency === targetBudgetCurrency) return amount;
      return convertFn(amount, fromCurrency, targetBudgetCurrency);
    };

    // Calculate current spending in this category converted to target budget currency
    const currentSpent = monthlyTransactions
      .filter((t) => t.type === 'EXPENSE' && t.categoryId === categoryId)
      .reduce((sum, t) => {
        const sourceCurrency = accountsCurrencyMap[t.accountId] || targetBudgetCurrency;
        const converted = toTargetCurrency(t.amount || 0, sourceCurrency);
        return sum + converted;
      }, 0);

    const convertedNewAmount = toTargetCurrency(
      transactionAmount,
      transactionCurrency,
    );

    const newSpent = currentSpent + convertedNewAmount;
    const projectedPercentage = Math.round((newSpent / budget.amount) * 100);

    const roundedCurrentSpent = Math.round(currentSpent * 100) / 100;
    const roundedNewSpent = Math.round(newSpent * 100) / 100;

    if (projectedPercentage >= 100) {
      return {
        hasAlert: true,
        level: 'EXCEEDED_100',
        budgetName: 'Presupuesto de Categoría',
        categoryLimit: budget.amount,
        currentSpent: roundedCurrentSpent,
        newSpent: roundedNewSpent,
        projectedPercentage,
        budgetCurrency: targetBudgetCurrency,
        message: `¡Atención! Este gasto superará el 100% de tu presupuesto asignado (${projectedPercentage}% de ${budget.amount}).`,
      };
    }

    if (projectedPercentage >= 80) {
      return {
        hasAlert: true,
        level: 'WARNING_80',
        budgetName: 'Presupuesto de Categoría',
        categoryLimit: budget.amount,
        currentSpent: roundedCurrentSpent,
        newSpent: roundedNewSpent,
        projectedPercentage,
        budgetCurrency: targetBudgetCurrency,
        message: `Aviso: Con este movimiento alcanzarás el ${projectedPercentage}% de tu presupuesto (${roundedNewSpent} de ${budget.amount}).`,
      };
    }

    return {
      hasAlert: false,
      level: 'SAFE',
      budgetName: 'Presupuesto de Categoría',
      categoryLimit: budget.amount,
      currentSpent: roundedCurrentSpent,
      newSpent: roundedNewSpent,
      projectedPercentage,
      budgetCurrency: targetBudgetCurrency,
      message: 'Dentro del límite presupuestario.',
    };
  }
}
