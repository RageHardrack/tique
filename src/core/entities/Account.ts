export type AccountType =
  | 'CHECKING'
  | 'SAVINGS'
  | 'CREDIT_CARD'
  | 'CASH'
  | 'INVESTMENT'
  | 'WALLET';

export type SupportedCurrency = 'USD' | 'PEN' | 'VES';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  creditLimit?: number | null;
  statementClosingDay?: number | null;
  paymentDueDay?: number | null;
  monthlyInterestRate?: number | null;
  createdAt: string;
  updatedAt: string;
}
