import type { TaxCategory, TaxDeductionType } from './Tax';

export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  type: CategoryType;
  parentId?: string | null;
  taxCategory?: TaxCategory;
  taxDeductionType?: TaxDeductionType;
  createdAt: string;
  updatedAt: string;
}
