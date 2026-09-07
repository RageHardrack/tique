export type GoalPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export const PRIORITY_ORDER: Record<GoalPriority, number> = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

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
  priority: GoalPriority;
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
  priority?: GoalPriority;
}

export interface UpdateGoalInput {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  currency?: string;
  targetDate?: string | null;
  color?: string | null;
  icon?: string | null;
  priority?: GoalPriority;
  isCompleted?: boolean;
}

