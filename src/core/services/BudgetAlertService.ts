import type { Budget } from '../entities/Budget';
import type { Transaction } from '../entities/Transaction';

export type BudgetAlertLevel = 'SAFE' | 'WARNING_80' | 'EXCEEDED_100';

export interface BudgetAlertStatus {
  hasAlert: boolean;
  level: BudgetAlertLevel;
  budgetName: string;
  categoryLimit: number;
  currentSpent: number;
  newSpent: number;
  projectedPercentage: number;
  message: string;
}

export class BudgetAlertService {
  /**
   * Evaluates if adding a transaction will trigger an overspending threshold (>80% warning or >100% exceeded)
   * for the budget assigned to the category in the current period.
   */
  static checkBudgetThreshold(params: {
    categoryId: string;
    transactionAmount: number;
    budgets: Budget[];
    monthlyTransactions?: Transaction[];
    currentDate?: Date;
  }): BudgetAlertStatus | null {
    const { categoryId, transactionAmount, budgets, monthlyTransactions = [] } = params;
    if (!categoryId || !transactionAmount || transactionAmount <= 0) return null;

    // Find active budget for this category
    const budget = budgets.find((b) => b.categoryId === categoryId);
    if (!budget || !budget.amount || budget.amount <= 0) return null;

    // Calculate current spending in this category
    const currentSpent = monthlyTransactions
      .filter((t) => t.type === 'EXPENSE' && t.categoryId === categoryId)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const newSpent = currentSpent + transactionAmount;
    const projectedPercentage = Math.round((newSpent / budget.amount) * 100);

    if (projectedPercentage >= 100) {
      return {
        hasAlert: true,
        level: 'EXCEEDED_100',
        budgetName: 'Presupuesto de Categoría',
        categoryLimit: budget.amount,
        currentSpent,
        newSpent,
        projectedPercentage,
        message: `¡Atención! Este gasto superará el 100% de tu presupuesto asignado (${projectedPercentage}% de ${budget.amount}).`,
      };
    }

    if (projectedPercentage >= 80) {
      return {
        hasAlert: true,
        level: 'WARNING_80',
        budgetName: 'Presupuesto de Categoría',
        categoryLimit: budget.amount,
        currentSpent,
        newSpent,
        projectedPercentage,
        message: `Aviso: Con este movimiento alcanzarás el ${projectedPercentage}% de tu presupuesto (${newSpent} de ${budget.amount}).`,
      };
    }

    return {
      hasAlert: false,
      level: 'SAFE',
      budgetName: 'Presupuesto de Categoría',
      categoryLimit: budget.amount,
      currentSpent,
      newSpent,
      projectedPercentage,
      message: 'Dentro del límite presupuestario.',
    };
  }
}
