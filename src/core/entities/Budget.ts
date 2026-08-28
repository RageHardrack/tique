export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  currency: string;
  period: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress {
  budget: Budget;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  status: 'ON_TRACK' | 'WARNING' | 'EXCEEDED';
}
