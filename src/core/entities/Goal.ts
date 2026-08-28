export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: string | null;
  color: string | null;
  icon: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  userId?: string;
  name: string;
  targetAmount: number;
  currentAmount?: number;
  currency?: string;
  targetDate?: string | null;
  color?: string | null;
  icon?: string | null;
}

export interface UpdateGoalInput {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  currency?: string;
  targetDate?: string | null;
  color?: string | null;
  icon?: string | null;
  isCompleted?: boolean;
}
