export type RecurrenceFrequency =
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUAL'
  | 'YEARLY'
  | 'CUSTOM';

export interface Subscription {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string | null;
  name: string;
  amount: number;
  currency: string;
  frequency: RecurrenceFrequency;
  customIntervalDays?: number | null;
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionDisplayItem {
  subscription: Subscription;
  accountName: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  formattedAmount: string;
  formattedDueDate: string;
  daysRemaining: number;
  urgencyStatus: 'DUE_TODAY' | 'DUE_SOON' | 'OVERDUE' | 'NORMAL';
  urgencyBadgeText: string;
}
