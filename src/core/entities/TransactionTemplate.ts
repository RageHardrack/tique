import type { TransactionType } from './Transaction';

/**
 * A reusable, non-programmable record of a movement the user makes often.
 * It only stores the shape of the movement (type, accounts, category, amount
 * and note); scheduling lives in `Subscription`, never here.
 */
export type TransactionTemplateType = TransactionType;

export interface TransactionTemplate {
  id: string;
  userId: string;
  name: string;
  type: TransactionTemplateType;
  accountId: string;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  defaultAmount?: number | null;
  note?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body accepted by `POST /transaction-templates` and `PUT /transaction-templates/:id`. */
export interface TransactionTemplateInput {
  name: string;
  type: TransactionTemplateType;
  accountId: string;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  defaultAmount?: number | null;
  note?: string | null;
}

/** Editable prefill a template produces in the quick-add sheet. */
export interface TransactionTemplateDraft {
  type: TransactionTemplateType;
  accountId: string;
  destinationAccountId: string | null;
  categoryId: string | null;
  note: string | null;
  amount: number | null;
}
