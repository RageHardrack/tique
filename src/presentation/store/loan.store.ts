import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Loan } from '../../core/entities/Loan';
import {
  LoanApiClient,
  type CreateLoanPayload,
  type CreateLoanPaymentPayload,
  type UpdateLoanPayload,
} from '../../infrastructure/api/LoanApiClient';
import { useAuthStore } from './auth';

export const useLoanStore = defineStore('loans', () => {
  const loans = ref<Loan[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const lentLoans = computed(() => loans.value.filter((l) => l.type === 'LENT'));
  const borrowedLoans = computed(() => loans.value.filter((l) => l.type === 'BORROWED'));

  const pendingLentBalancesByCurrency = computed(() => {
    const map: Record<string, number> = {};
    lentLoans.value
      .filter((l) => l.status !== 'PAID' && l.status !== 'CANCELLED')
      .forEach((l) => {
        const curr = (l.currency || 'USD').toUpperCase();
        map[curr] = (map[curr] || 0) + (Number(l.remainingAmount) || 0);
      });
    return map;
  });

  const pendingBorrowedBalancesByCurrency = computed(() => {
    const map: Record<string, number> = {};
    borrowedLoans.value
      .filter((l) => l.status !== 'PAID' && l.status !== 'CANCELLED')
      .forEach((l) => {
        const curr = (l.currency || 'USD').toUpperCase();
        map[curr] = (map[curr] || 0) + (Number(l.remainingAmount) || 0);
      });
    return map;
  });

  const pendingLentTotal = computed(() =>
    lentLoans.value
      .filter((l) => l.status !== 'PAID' && l.status !== 'CANCELLED')
      .reduce((sum, l) => sum + (Number(l.remainingAmount) || 0), 0),
  );

  const pendingBorrowedTotal = computed(() =>
    borrowedLoans.value
      .filter((l) => l.status !== 'PAID' && l.status !== 'CANCELLED')
      .reduce((sum, l) => sum + (Number(l.remainingAmount) || 0), 0),
  );

  async function fetchLoans(userId: string) {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      loans.value = await LoanApiClient.getLoansByUser(userId, authStore.accessToken);
    } catch (err: any) {
      error.value = err.message || 'Error al cargar préstamos';
    } finally {
      isLoading.value = false;
    }
  }

  async function createLoan(payload: CreateLoanPayload) {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      const created = await LoanApiClient.createLoan(payload, authStore.accessToken);
      loans.value.unshift(created);
      return created;
    } catch (err: any) {
      error.value = err.message || 'Error al crear préstamo';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateLoan(id: string, payload: UpdateLoanPayload) {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await LoanApiClient.updateLoan(id, payload, authStore.accessToken);
      const index = loans.value.findIndex((l) => l.id === id);
      if (index !== -1) {
        loans.value[index] = updated;
      }
      return updated;
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar préstamo';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteLoan(id: string) {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      await LoanApiClient.deleteLoan(id, authStore.accessToken);
      loans.value = loans.value.filter((l) => l.id !== id);
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar préstamo';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function addPayment(loanId: string, payload: CreateLoanPaymentPayload) {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      const { loan: updatedLoan } = await LoanApiClient.addPayment(loanId, payload, authStore.accessToken);
      const index = loans.value.findIndex((l) => l.id === loanId);
      if (index !== -1) {
        loans.value[index] = updatedLoan;
      }
      return updatedLoan;
    } catch (err: any) {
      error.value = err.message || 'Error al registrar abono';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deletePayment(paymentId: string) {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      const updatedLoan = await LoanApiClient.deletePayment(paymentId, authStore.accessToken);
      const index = loans.value.findIndex((l) => l.id === updatedLoan.id);
      if (index !== -1) {
        loans.value[index] = updatedLoan;
      }
      return updatedLoan;
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar abono';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    loans,
    isLoading,
    error,
    lentLoans,
    borrowedLoans,
    pendingLentTotal,
    pendingBorrowedTotal,
    pendingLentBalancesByCurrency,
    pendingBorrowedBalancesByCurrency,
    fetchLoans,
    createLoan,
    updateLoan,
    deleteLoan,
    addPayment,
    deletePayment,
  };
});
