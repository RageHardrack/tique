import type { TaxCategory, TaxDeductionType, TaxDocumentType } from './Tax';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  amount: number;
  type: TransactionType;
  date: string;
  note?: string | null;
  taxCategory?: TaxCategory;
  taxDocumentType?: TaxDocumentType;
  taxDocumentNumber?: string | null;
  taxWithholdingAmount?: number | null;
  taxDeductionType?: TaxDeductionType;
  createdAt: string;
  updatedAt: string;
}
