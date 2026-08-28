export type LoanType = 'LENT' | 'BORROWED';
export type LoanStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  accountId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  personName: string;
  type: LoanType;
  amount: number;
  remainingAmount: number;
  currency: string;
  dueDate?: string | null;
  status: LoanStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  payments?: LoanPayment[];
}
