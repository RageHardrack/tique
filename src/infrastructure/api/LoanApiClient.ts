import { ApiClient } from './api-client';
import type { Loan, LoanPayment } from '../../core/entities/Loan';

export interface CreateLoanPayload {
  userId: string;
  personName: string;
  type: 'LENT' | 'BORROWED';
  amount: number;
  currency?: string;
  dueDate?: string;
  notes?: string;
  initialAccountId?: string;
}

export interface UpdateLoanPayload {
  personName?: string;
  amount?: number;
  currency?: string;
  dueDate?: string;
  status?: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  notes?: string;
}

export interface CreateLoanPaymentPayload {
  amount: number;
  date?: string;
  accountId?: string;
  notes?: string;
}

export class LoanApiClient {
  static async getLoansByUser(userId: string, token?: string | null): Promise<Loan[]> {
    return ApiClient.get<Loan[]>(`/loans/user/${userId}`, token);
  }

  static async getLoanById(id: string, token?: string | null): Promise<Loan> {
    return ApiClient.get<Loan>(`/loans/${id}`, token);
  }

  static async createLoan(payload: CreateLoanPayload, token?: string | null): Promise<Loan> {
    return ApiClient.post<Loan>('/loans', payload, token);
  }

  static async updateLoan(id: string, payload: UpdateLoanPayload, token?: string | null): Promise<Loan> {
    return ApiClient.patch<Loan>(`/loans/${id}`, payload, token);
  }

  static async deleteLoan(id: string, token?: string | null): Promise<{ success: boolean }> {
    return ApiClient.delete<{ success: boolean }>(`/loans/${id}`, token);
  }

  static async addPayment(
    loanId: string,
    payload: CreateLoanPaymentPayload,
    token?: string | null,
  ): Promise<{ loan: Loan; payment: LoanPayment }> {
    return ApiClient.post<{ loan: Loan; payment: LoanPayment }>(`/loans/${loanId}/payments`, payload, token);
  }

  static async deletePayment(paymentId: string, token?: string | null): Promise<Loan> {
    return ApiClient.delete<Loan>(`/loans/payments/${paymentId}`, token);
  }
}
