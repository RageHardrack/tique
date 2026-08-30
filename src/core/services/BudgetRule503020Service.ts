import type { Category, BudgetGroup } from '../entities/Category';
import type { Transaction } from '../entities/Transaction';
import type { Budget } from '../entities/Budget';

export interface GroupCategoryBreakdown {
  category: Category;
  spent: number;
  budgeted: number;
  percentageOfIncome: number;
}

export interface BudgetPillarSummary {
  targetPercentage: number;
  targetAmount: number;
  actualSpent: number;
  budgetedAmount: number;
  actualPercentage: number;
  status: 'HEALTHY' | 'WARNING' | 'OVER_BUDGET';
  categories: GroupCategoryBreakdown[];
}

export interface BudgetRule503020Report {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  needs: BudgetPillarSummary;
  wants: BudgetPillarSummary;
  savings: BudgetPillarSummary;
  unassigned: {
    actualSpent: number;
    budgetedAmount: number;
    categories: GroupCategoryBreakdown[];
  };
  fixedExpensesBreakdown: GroupCategoryBreakdown[];
}

export interface Calculate503020Params {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  year: number;
  month: number; // 1-12
}

export class BudgetRule503020Service {
  static calculate(params: Calculate503020Params): BudgetRule503020Report {
    const { transactions, categories, budgets, year, month } = params;

    // Build budget map (categoryId -> amount)
    const budgetMap = new Map<string, number>();
    budgets.forEach((b) => budgetMap.set(b.categoryId, b.amount));

    // Filter transactions for the requested month
    const monthTransactions = transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      const txYear = d.getUTCFullYear();
      const txMonth = d.getUTCMonth() + 1;
      return txYear === year && txMonth === month;
    });

    let totalIncome = 0;
    let totalExpense = 0;

    // Track spent per category
    const spentByCategory = new Map<string, number>();

    for (const tx of monthTransactions) {
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        totalExpense += tx.amount;
        if (tx.categoryId) {
          spentByCategory.set(
            tx.categoryId,
            (spentByCategory.get(tx.categoryId) || 0) + tx.amount,
          );
        }
      }
    }

    const needsCategories: GroupCategoryBreakdown[] = [];
    const wantsCategories: GroupCategoryBreakdown[] = [];
    const savingsCategories: GroupCategoryBreakdown[] = [];
    const unassignedCategories: GroupCategoryBreakdown[] = [];

    for (const cat of categories) {
      if (cat.type !== 'EXPENSE') continue;
      const spent = spentByCategory.get(cat.id) || 0;
      const budgeted = budgetMap.get(cat.id) || 0;
      const group: BudgetGroup = cat.budgetGroup || 'UNASSIGNED';

      const breakdown: GroupCategoryBreakdown = {
        category: cat,
        spent,
        budgeted,
        percentageOfIncome: totalIncome > 0 ? (spent / totalIncome) * 100 : 0,
      };

      if (group === 'NEEDS') {
        needsCategories.push(breakdown);
      } else if (group === 'WANTS') {
        wantsCategories.push(breakdown);
      } else if (group === 'SAVINGS') {
        savingsCategories.push(breakdown);
      } else {
        if (spent > 0 || budgeted > 0) {
          unassignedCategories.push(breakdown);
        }
      }
    }

    const sumSpent = (list: GroupCategoryBreakdown[]) =>
      list.reduce((acc, item) => acc + item.spent, 0);
    const sumBudgeted = (list: GroupCategoryBreakdown[]) =>
      list.reduce((acc, item) => acc + item.budgeted, 0);

    const needsSpent = sumSpent(needsCategories);
    const needsBudgeted = sumBudgeted(needsCategories);
    const needsTarget = totalIncome * 0.5;
    const needsPercentage = totalIncome > 0 ? (needsSpent / totalIncome) * 100 : 0;
    const needsStatus =
      needsPercentage <= 50 ? 'HEALTHY' : needsPercentage <= 55 ? 'WARNING' : 'OVER_BUDGET';

    const wantsSpent = sumSpent(wantsCategories);
    const wantsBudgeted = sumBudgeted(wantsCategories);
    const wantsTarget = totalIncome * 0.3;
    const wantsPercentage = totalIncome > 0 ? (wantsSpent / totalIncome) * 100 : 0;
    const wantsStatus =
      wantsPercentage <= 30 ? 'HEALTHY' : wantsPercentage <= 35 ? 'WARNING' : 'OVER_BUDGET';

    const savingsSpent = sumSpent(savingsCategories);
    const savingsBudgeted = sumBudgeted(savingsCategories);
    const savingsTarget = totalIncome * 0.2;
    const savingsPercentage =
      totalIncome > 0 ? (savingsSpent / totalIncome) * 100 : 0;
    const savingsStatus = savingsPercentage >= 20 ? 'HEALTHY' : 'WARNING';

    const unassignedSpent = sumSpent(unassignedCategories);
    const unassignedBudgeted = sumBudgeted(unassignedCategories);

    const fixedExpensesBreakdown = [...needsCategories]
      .filter((item) => item.spent > 0 || item.budgeted > 0)
      .sort((a, b) => b.spent - a.spent);

    return {
      year,
      month,
      totalIncome,
      totalExpense,
      needs: {
        targetPercentage: 50,
        targetAmount: needsTarget,
        actualSpent: needsSpent,
        budgetedAmount: needsBudgeted,
        actualPercentage: needsPercentage,
        status: needsStatus,
        categories: needsCategories,
      },
      wants: {
        targetPercentage: 30,
        targetAmount: wantsTarget,
        actualSpent: wantsSpent,
        budgetedAmount: wantsBudgeted,
        actualPercentage: wantsPercentage,
        status: wantsStatus,
        categories: wantsCategories,
      },
      savings: {
        targetPercentage: 20,
        targetAmount: savingsTarget,
        actualSpent: savingsSpent,
        budgetedAmount: savingsBudgeted,
        actualPercentage: savingsPercentage,
        status: savingsStatus,
        categories: savingsCategories,
      },
      unassigned: {
        actualSpent: unassignedSpent,
        budgetedAmount: unassignedBudgeted,
        categories: unassignedCategories,
      },
      fixedExpensesBreakdown,
    };
  }
}
