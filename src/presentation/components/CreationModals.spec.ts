import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import CreateAccountModal from '../components/accounts/CreateAccountModal.vue';
import CreateBudgetModal from '../components/budgets/CreateBudgetModal.vue';
import CreateCategoryModal from '../components/categories/CreateCategoryModal.vue';
import CreateSubscriptionModal from '../components/subscriptions/CreateSubscriptionModal.vue';
import CreateTransactionModal from '../components/transactions/CreateTransactionModal.vue';

describe('Creation Modals Logic and Emits', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('CreateCategoryModal', () => {
    it('should emit "created" when handleSubmit is called with valid data', async () => {
      const wrapper = mount(CreateCategoryModal, {
        props: {
          open: true,
        },
      });

      const vm = wrapper.vm as any;
      vm.form.name = 'Educación & Libros';
      vm.form.type = 'EXPENSE';
      vm.form.icon = 'i-heroicons-academic-cap';
      vm.form.color = '#3b82f6';

      vm.handleSubmit();

      const createdEvents = wrapper.emitted('created');
      expect(createdEvents).toBeTruthy();
      expect(createdEvents?.[0][0]).toEqual({
        name: 'Educación & Libros',
        type: 'EXPENSE',
        icon: 'i-heroicons-academic-cap',
        color: '#3b82f6',
        taxCategory: 'NONE',
        taxDeductionType: 'NONE',
        budgetGroup: 'UNASSIGNED',
      });
    });

    it('should not emit "created" if name is empty', async () => {
      const wrapper = mount(CreateCategoryModal, {
        props: {
          open: true,
        },
      });

      const vm = wrapper.vm as any;
      vm.form.name = '   ';
      vm.handleSubmit();

      expect(wrapper.emitted('created')).toBeFalsy();
      expect(vm.errorMessage).toBe('El nombre de la categoría es obligatorio.');
    });

    it('should emit "updated" when editing an existing category', async () => {
      const existingCategory = {
        id: 'cat-123',
        userId: 'u1',
        name: 'Inversiones',
        type: 'INCOME' as const,
        icon: 'i-heroicons-banknotes',
        color: '#10b981',
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(CreateCategoryModal, {
        props: {
          open: true,
          category: existingCategory,
        },
      });

      const vm = wrapper.vm as any;
      vm.form.name = 'Inversiones & Dividendos';
      vm.handleSubmit();

      const updatedEvents = wrapper.emitted('updated');
      expect(updatedEvents).toBeTruthy();
      expect(updatedEvents?.[0][0]).toBe('cat-123');
      expect(updatedEvents?.[0][1]).toEqual({
        name: 'Inversiones & Dividendos',
        type: 'INCOME',
        icon: 'i-heroicons-banknotes',
        color: '#10b981',
        taxCategory: 'NONE',
        taxDeductionType: 'NONE',
        budgetGroup: 'UNASSIGNED',
      });
    });
  });

  describe('CreateAccountModal', () => {
    it('should emit "created" with WALLET account type', async () => {
      const wrapper = mount(CreateAccountModal, {
        props: {
          open: true,
        },
      });

      const vm = wrapper.vm as any;
      vm.form.name = 'Binance Crypto Wallet';
      vm.form.type = 'WALLET';
      vm.form.balance = 1200;
      vm.form.currency = 'USD';

      vm.handleSubmit();

      const createdEvents = wrapper.emitted('created');
      expect(createdEvents).toBeTruthy();
      expect(createdEvents?.[0][0]).toEqual({
        name: 'Binance Crypto Wallet',
        type: 'WALLET',
        balance: 1200,
        currency: 'USD',
      });
    });

    it('should emit "updated" when editing an existing account', async () => {
      const existingAccount = {
        id: 'acc-wallet-1',
        userId: 'u1',
        name: 'Metamask',
        type: 'WALLET' as const,
        balance: 500,
        currency: 'USD',
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(CreateAccountModal, {
        props: {
          open: true,
          account: existingAccount,
        },
      });

      const vm = wrapper.vm as any;
      vm.form.name = 'Metamask Primary';
      vm.form.balance = 750;
      vm.handleSubmit();

      const updatedEvents = wrapper.emitted('updated');
      expect(updatedEvents).toBeTruthy();
      expect(updatedEvents?.[0][0]).toBe('acc-wallet-1');
      expect(updatedEvents?.[0][1]).toEqual({
        name: 'Metamask Primary',
        type: 'WALLET',
        balance: 750,
        currency: 'USD',
      });
    });
  });

  describe('CreateTransactionModal', () => {
    it('should emit "created" with transaction data', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          userId: 'u1',
          name: 'Main Bank',
          type: 'CHECKING' as const,
          balance: 1000,
          currency: 'USD',
          createdAt: '',
          updatedAt: '',
        },
      ];
      const mockCategories = [
        {
          id: 'cat-1',
          userId: 'u1',
          name: 'Food',
          type: 'EXPENSE' as const,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const wrapper = mount(CreateTransactionModal, {
        props: {
          open: true,
          accounts: mockAccounts,
          categories: mockCategories,
        },
      });

      const vm = wrapper.vm as any;
      vm.form.type = 'EXPENSE';
      vm.form.accountId = 'acc-1';
      vm.form.categoryId = 'cat-1';
      vm.form.amount = 75.5;
      vm.form.date = '2026-08-24';
      vm.form.note = 'Supermercado semanal';

      vm.handleSubmit();

      const createdEvents = wrapper.emitted('created');
      expect(createdEvents).toBeTruthy();
      expect(createdEvents?.[0][0]).toMatchObject({
        type: 'EXPENSE',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        amount: 75.5,
        note: 'Supermercado semanal',
      });
    });

    it('should emit "updated" when editing an existing transaction', async () => {
      const existingTx = {
        id: 'tx-999',
        userId: 'u1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'EXPENSE' as const,
        amount: 100,
        date: '2026-08-20T00:00:00.000Z',
        note: 'Cena familiar',
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(CreateTransactionModal, {
        props: {
          open: true,
          transaction: existingTx,
          accounts: [{ id: 'acc-1', userId: 'u1', name: 'Main', type: 'CHECKING' as const, balance: 1000, currency: 'USD', createdAt: '', updatedAt: '' }],
          categories: [{ id: 'cat-1', userId: 'u1', name: 'Comida', type: 'EXPENSE' as const, createdAt: '', updatedAt: '' }],
        },
      });

      const vm = wrapper.vm as any;
      vm.form.amount = 120;
      vm.form.note = 'Cena familiar y propina';
      vm.handleSubmit();

      const updatedEvents = wrapper.emitted('updated');
      expect(updatedEvents).toBeTruthy();
      expect(updatedEvents?.[0][0]).toBe('tx-999');
      expect(updatedEvents?.[0][1]).toMatchObject({
        type: 'EXPENSE',
        amount: 120,
        note: 'Cena familiar y propina',
      });
    });

    it('should reset tax deduction metadata when editing transaction and changing to non-deductible category', async () => {
      const deductibleCategory = {
        id: 'cat-restaurant',
        userId: 'u1',
        name: 'Restaurantes y Bares',
        type: 'EXPENSE' as const,
        taxCategory: 'DEDUCTIBLE_EXPENSE_3UIT' as const,
        taxDeductionType: 'RESTAURANT_BAR' as const,
        createdAt: '',
        updatedAt: '',
      };

      const normalCategory = {
        id: 'cat-other',
        userId: 'u1',
        name: 'Otros Gastos',
        type: 'EXPENSE' as const,
        taxCategory: 'NONE' as const,
        taxDeductionType: 'NONE' as const,
        createdAt: '',
        updatedAt: '',
      };

      const existingTx = {
        id: 'tx-deductible-1',
        userId: 'u1',
        accountId: 'acc-1',
        categoryId: 'cat-restaurant',
        type: 'EXPENSE' as const,
        amount: 150,
        date: '2026-08-20T00:00:00.000Z',
        note: 'Almuerzo ejecutivo',
        taxCategory: 'DEDUCTIBLE_EXPENSE_3UIT' as const,
        taxDeductionType: 'RESTAURANT_BAR' as const,
        taxDocumentType: 'BOLETA' as const,
        taxDocumentNumber: 'B001-1234',
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(CreateTransactionModal, {
        props: {
          open: true,
          transaction: existingTx,
          accounts: [{ id: 'acc-1', userId: 'u1', name: 'Main', type: 'CHECKING' as const, balance: 1000, currency: 'PEN', createdAt: '', updatedAt: '' }],
          categories: [deductibleCategory, normalCategory],
        },
      });

      const vm = wrapper.vm as any;
      // Wait for nextTick initialization
      await wrapper.vm.$nextTick();

      expect(vm.form.taxCategory).toBe('DEDUCTIBLE_EXPENSE_3UIT');
      expect(vm.form.taxDeductionType).toBe('RESTAURANT_BAR');

      // Change category to non-deductible category
      vm.form.categoryId = 'cat-other';
      await wrapper.vm.$nextTick();

      expect(vm.form.taxCategory).toBe('NONE');
      expect(vm.form.taxDeductionType).toBe('NONE');
      expect(vm.form.taxDocumentNumber).toBe('');

      vm.handleSubmit();

      const updatedEvents = wrapper.emitted('updated');
      expect(updatedEvents).toBeTruthy();
      expect(updatedEvents?.[0][0]).toBe('tx-deductible-1');
      expect(updatedEvents?.[0][1]).toMatchObject({
        type: 'EXPENSE',
        categoryId: 'cat-other',
        taxCategory: 'NONE',
        taxDeductionType: 'NONE',
      });
    });
  });

  describe('CreateBudgetModal', () => {
    it('should emit "create" with budget payload', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          userId: 'u1',
          name: 'Supermercado',
          type: 'EXPENSE' as const,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const wrapper = mount(CreateBudgetModal, {
        props: {
          open: true,
          categories: mockCategories,
          baseCurrency: 'USD',
        },
      });

      const vm = wrapper.vm as any;
      vm.categoryId = 'cat-1';
      vm.amount = 500;
      vm.currency = 'USD';
      vm.period = 'MONTHLY';

      vm.handleSubmit();

      const createEvents = wrapper.emitted('create');
      expect(createEvents).toBeTruthy();
      expect(createEvents?.[0][0]).toEqual({
        categoryId: 'cat-1',
        amount: 500,
        currency: 'USD',
        period: 'MONTHLY',
      });
    });

    it('should emit "update" when editing an existing budget', async () => {
      const existingBudget = {
        id: 'b-123',
        userId: 'u1',
        categoryId: 'cat-1',
        amount: 500,
        currency: 'USD',
        period: 'MONTHLY' as const,
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(CreateBudgetModal, {
        props: {
          open: true,
          budget: existingBudget,
          categories: [{ id: 'cat-1', userId: 'u1', name: 'Supermercado', type: 'EXPENSE' as const, createdAt: '', updatedAt: '' }],
          baseCurrency: 'USD',
        },
      });

      const vm = wrapper.vm as any;
      vm.amount = 650;
      vm.handleSubmit();

      const updateEvents = wrapper.emitted('update');
      expect(updateEvents).toBeTruthy();
      expect(updateEvents?.[0][0]).toBe('b-123');
      expect(updateEvents?.[0][1]).toEqual({
        amount: 650,
        currency: 'USD',
        period: 'MONTHLY',
      });
    });
  });

  describe('CreateSubscriptionModal', () => {
    it('should emit "create" with subscription payload', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          userId: 'u1',
          name: 'Main Bank',
          type: 'CHECKING' as const,
          balance: 1000,
          currency: 'USD',
          createdAt: '',
          updatedAt: '',
        },
      ];

      const wrapper = mount(CreateSubscriptionModal, {
        props: {
          open: true,
          accounts: mockAccounts,
          categories: [],
          baseCurrency: 'USD',
        },
      });

      const vm = wrapper.vm as any;
      vm.name = 'Spotify Family';
      vm.accountId = 'acc-1';
      vm.amount = 29.9;
      vm.currency = 'USD';
      vm.frequency = 'MONTHLY';
      vm.nextDueDate = '2026-08-24';

      vm.handleSubmit();

      const createEvents = wrapper.emitted('create');
      expect(createEvents).toBeTruthy();
      expect(createEvents?.[0][0]).toMatchObject({
        name: 'Spotify Family',
        accountId: 'acc-1',
        amount: 29.9,
        frequency: 'MONTHLY',
      });
    });

    it('should emit "update" when editing an existing subscription', async () => {
      const existingSub = {
        id: 'sub-888',
        userId: 'u1',
        name: 'Netflix Premium',
        accountId: 'acc-1',
        amount: 19.99,
        currency: 'USD',
        frequency: 'MONTHLY' as const,
        nextDueDate: '2026-09-01',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(CreateSubscriptionModal, {
        props: {
          open: true,
          subscription: existingSub,
          accounts: [{ id: 'acc-1', userId: 'u1', name: 'Main', type: 'CHECKING' as const, balance: 1000, currency: 'USD', createdAt: '', updatedAt: '' }],
          categories: [],
          baseCurrency: 'USD',
        },
      });

      const vm = wrapper.vm as any;
      vm.name = 'Netflix 4K';
      vm.amount = 22.99;
      vm.handleSubmit();

      const updateEvents = wrapper.emitted('update');
      expect(updateEvents).toBeTruthy();
      expect(updateEvents?.[0][0]).toBe('sub-888');
      expect(updateEvents?.[0][1]).toMatchObject({
        name: 'Netflix 4K',
        accountId: 'acc-1',
        amount: 22.99,
        currency: 'USD',
        frequency: 'MONTHLY',
      });
    });

    it('should emit "create" with customIntervalDays when frequency is CUSTOM', async () => {
      const wrapper = mount(CreateSubscriptionModal, {
        props: {
          open: true,
          accounts: [{ id: 'acc-1', userId: 'u1', name: 'Main', type: 'CHECKING' as const, balance: 1000, currency: 'USD', createdAt: '', updatedAt: '' }],
          categories: [],
          baseCurrency: 'USD',
        },
      });

      const vm = wrapper.vm as any;
      vm.name = 'Filtros de Agua';
      vm.accountId = 'acc-1';
      vm.amount = 45;
      vm.currency = 'USD';
      vm.frequency = 'CUSTOM';
      vm.customIntervalDays = 45;
      vm.nextDueDate = '2026-09-01';

      vm.handleSubmit();

      const createEvents = wrapper.emitted('create');
      expect(createEvents).toBeTruthy();
      expect(createEvents?.[0][0]).toMatchObject({
        name: 'Filtros de Agua',
        accountId: 'acc-1',
        amount: 45,
        frequency: 'CUSTOM',
        customIntervalDays: 45,
      });
    });
  });

  describe('CreateTransactionModal', () => {
    const mockAccounts = [
      {
        id: 'acc-usd',
        userId: 'u1',
        name: 'Cuenta USD',
        type: 'CHECKING' as const,
        balance: 1000,
        currency: 'USD',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'acc-pen',
        userId: 'u1',
        name: 'Cuenta Soles',
        type: 'SAVINGS' as const,
        balance: 3000,
        currency: 'PEN',
        createdAt: '',
        updatedAt: '',
      },
    ];

    it('should calculate destination amount and exchange rate for cross-currency transfer', async () => {
      const wrapper = mount(CreateTransactionModal, {
        props: {
          open: true,
          accounts: mockAccounts,
          categories: [],
        },
      });

      const vm = wrapper.vm as any;
      vm.form.type = 'TRANSFER';
      vm.form.accountId = 'acc-usd';
      vm.form.destinationAccountId = 'acc-pen';
      vm.form.amount = 50;
      vm.handleAmountInput();

      expect(vm.isCrossCurrency).toBe(true);
      expect(vm.form.destinationAmount).toBe(187.5);
      expect(vm.form.exchangeRate).toBe(3.75);

      vm.handleSubmit();

      const createEvents = wrapper.emitted('created');
      expect(createEvents).toBeTruthy();
      expect(createEvents?.[0][0]).toMatchObject({
        type: 'TRANSFER',
        accountId: 'acc-usd',
        destinationAccountId: 'acc-pen',
        amount: 50,
        destinationAmount: 187.5,
        exchangeRate: 3.75,
      });
    });

    it('should emit updated with destinationAmount when editing an existing transfer', async () => {
      const existingTx = {
        id: 'tx-999',
        userId: 'u1',
        accountId: 'acc-usd',
        destinationAccountId: 'acc-pen',
        amount: 50,
        destinationAmount: 190,
        exchangeRate: 3.8,
        type: 'TRANSFER' as const,
        date: '2026-08-25T10:00:00.000Z',
        createdAt: '',
        updatedAt: '',
      };

      const wrapper = mount(CreateTransactionModal, {
        props: {
          open: true,
          transaction: existingTx,
          accounts: mockAccounts,
          categories: [],
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.form.amount).toBe(50);
      expect(vm.form.destinationAmount).toBe(190);

      vm.form.destinationAmount = 195;
      vm.handleDestinationAmountInput();
      vm.handleSubmit();

      const updateEvents = wrapper.emitted('updated');
      expect(updateEvents).toBeTruthy();
      expect(updateEvents?.[0][0]).toBe('tx-999');
      expect(updateEvents?.[0][1]).toMatchObject({
        type: 'TRANSFER',
        accountId: 'acc-usd',
        destinationAccountId: 'acc-pen',
        amount: 50,
        destinationAmount: 195,
      });
    });
  });
});
