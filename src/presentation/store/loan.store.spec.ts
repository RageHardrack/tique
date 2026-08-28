import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLoanStore } from './loan.store';
import { LoanApiClient } from '../../infrastructure/api/LoanApiClient';
import type { Loan } from '../../core/entities/Loan';

vi.mock('../../infrastructure/api/LoanApiClient', () => ({
  LoanApiClient: {
    getLoansByUser: vi.fn(),
    createLoan: vi.fn(),
    updateLoan: vi.fn(),
    deleteLoan: vi.fn(),
    addPayment: vi.fn(),
    deletePayment: vi.fn(),
  },
}));

describe('useLoanStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const mockLoans: Loan[] = [
    {
      id: 'l-1',
      userId: 'u-1',
      personName: 'Carlos',
      type: 'LENT',
      amount: 1000,
      remainingAmount: 600,
      currency: 'USD',
      status: 'PARTIALLY_PAID',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [],
    },
    {
      id: 'l-2',
      userId: 'u-1',
      personName: 'Banco / Tarjeta',
      type: 'BORROWED',
      amount: 500,
      remainingAmount: 500,
      currency: 'USD',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [],
    },
  ];

  it('debe calcular correctamente los totales por cobrar y por pagar', async () => {
    vi.mocked(LoanApiClient.getLoansByUser).mockResolvedValue(mockLoans);

    const store = useLoanStore();
    await store.fetchLoans('u-1');

    expect(store.lentLoans).toHaveLength(1);
    expect(store.borrowedLoans).toHaveLength(1);
    expect(store.pendingLentTotal).toBe(600);
    expect(store.pendingBorrowedTotal).toBe(500);
  });

  it('debe crear un préstamo e insertarlo en el estado', async () => {
    const newLoan: Loan = {
      id: 'l-3',
      userId: 'u-1',
      personName: 'Maria',
      type: 'LENT',
      amount: 200,
      remainingAmount: 200,
      currency: 'USD',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [],
    };

    vi.mocked(LoanApiClient.createLoan).mockResolvedValue(newLoan);

    const store = useLoanStore();
    const created = await store.createLoan({
      userId: 'u-1',
      personName: 'Maria',
      type: 'LENT',
      amount: 200,
    });

    expect(created.id).toBe('l-3');
    expect(store.loans).toHaveLength(1);
  });

  it('debe agrupar los saldos pendientes por moneda correctamente en escenarios multimoneda (ej. 2 de $300 USD y 2 de S/ 300 PEN)', async () => {
    const multiCurrencyLoans: Loan[] = [
      {
        id: 'l-1',
        userId: 'u-1',
        personName: 'Deudor 1 USD',
        type: 'LENT',
        amount: 300,
        remainingAmount: 300,
        currency: 'USD',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payments: [],
      },
      {
        id: 'l-2',
        userId: 'u-1',
        personName: 'Deudor 2 USD',
        type: 'LENT',
        amount: 300,
        remainingAmount: 300,
        currency: 'USD',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payments: [],
      },
      {
        id: 'l-3',
        userId: 'u-1',
        personName: 'Deudor 3 PEN',
        type: 'LENT',
        amount: 300,
        remainingAmount: 300,
        currency: 'PEN',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payments: [],
      },
      {
        id: 'l-4',
        userId: 'u-1',
        personName: 'Deudor 4 PEN',
        type: 'LENT',
        amount: 300,
        remainingAmount: 300,
        currency: 'PEN',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payments: [],
      },
    ];

    vi.mocked(LoanApiClient.getLoansByUser).mockResolvedValue(multiCurrencyLoans);

    const store = useLoanStore();
    await store.fetchLoans('u-1');

    // Comprobamos la segregación exacta por divisa
    expect(store.pendingLentBalancesByCurrency).toEqual({
      USD: 600,
      PEN: 600,
    });

    // Comprobamos que no se mezclen las sumas numéricas brutas sin contexto
    expect(store.lentLoans).toHaveLength(4);
  });
});
