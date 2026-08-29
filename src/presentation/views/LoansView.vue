<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import LoanCard from '../components/loans/LoanCard.vue';
import CreateLoanModal from '../components/loans/CreateLoanModal.vue';
import AddLoanPaymentModal from '../components/loans/AddLoanPaymentModal.vue';
import { useLoanStore } from '../store/loan.store';
import { useAuthStore } from '../store/auth';
import { useAccountStore } from '../store/accounts';
import { useExchangeRateStore } from '../store/exchange-rates';
import { useTransactionStore } from '../store/transactions';
import { CurrencyFormatter } from '../../core/services/CurrencyFormatter';
import type { Loan, LoanType } from '../../core/entities/Loan';
import { useConfirm } from '../composables/useConfirm';

const authStore = useAuthStore();
const loanStore = useLoanStore();
const accountStore = useAccountStore();
const rateStore = useExchangeRateStore();
const transactionStore = useTransactionStore();
const { confirm: confirmDialog } = useConfirm();

const activeFilter = ref<'ALL' | 'LENT' | 'BORROWED' | 'PAID'>('ALL');
const isCreateModalOpen = ref(false);
const isPaymentModalOpen = ref(false);
const selectedLoan = ref<Loan | null>(null);

onMounted(async () => {
  if (authStore.user?.id) {
    await Promise.all([
      loanStore.fetchLoans(authStore.user.id),
      accountStore.fetchAccounts(authStore.user.id),
    ]);
  }
});

const pendingLentConverted = computed(() => {
  return loanStore.lentLoans
    .filter((l) => l.status !== 'PAID' && l.status !== 'CANCELLED')
    .reduce((sum, l) => {
      return sum + rateStore.convert(Number(l.remainingAmount) || 0, l.currency || 'USD');
    }, 0);
});

const pendingBorrowedConverted = computed(() => {
  return loanStore.borrowedLoans
    .filter((l) => l.status !== 'PAID' && l.status !== 'CANCELLED')
    .reduce((sum, l) => {
      return sum + rateStore.convert(Number(l.remainingAmount) || 0, l.currency || 'USD');
    }, 0);
});

const formattedPendingLent = computed(() =>
  CurrencyFormatter.format(pendingLentConverted.value, rateStore.baseCurrency),
);

const formattedPendingBorrowed = computed(() =>
  CurrencyFormatter.format(pendingBorrowedConverted.value, rateStore.baseCurrency),
);

const filteredLoans = computed(() => {
  if (activeFilter.value === 'LENT') {
    return loanStore.loans.filter((l) => l.type === 'LENT' && l.status !== 'PAID');
  }
  if (activeFilter.value === 'BORROWED') {
    return loanStore.loans.filter((l) => l.type === 'BORROWED' && l.status !== 'PAID');
  }
  if (activeFilter.value === 'PAID') {
    return loanStore.loans.filter((l) => l.status === 'PAID' || l.remainingAmount <= 0.01);
  }
  return loanStore.loans;
});

function openCreateModal() {
  selectedLoan.value = null;
  isCreateModalOpen.value = true;
}

function openEditModal(loan: Loan) {
  selectedLoan.value = loan;
  isCreateModalOpen.value = true;
}

function openPaymentModal(loan: Loan) {
  selectedLoan.value = loan;
  isPaymentModalOpen.value = true;
}

async function handleCreateLoan(payload: {
  personName: string;
  type: LoanType;
  amount: number;
  currency: string;
  dueDate?: string;
  notes?: string;
  initialAccountId?: string;
}) {
  if (!authStore.user?.id) return;
  await loanStore.createLoan({
    userId: authStore.user.id,
    ...payload,
  });
  if (payload.initialAccountId) {
    await accountStore.fetchAccounts(authStore.user.id);
    await transactionStore.fetchTransactions(authStore.user.id);
  }
}

async function handleUpdateLoan(
  id: string,
  payload: {
    personName: string;
    amount: number;
    currency: string;
    dueDate?: string;
    notes?: string;
  },
) {
  await loanStore.updateLoan(id, payload);
}

async function handleDeleteLoan(id: string) {
  const confirmed = await confirmDialog({
    title: 'Eliminar préstamo',
    message: '¿Estás seguro de que deseas eliminar este registro de préstamo?',
    confirmText: 'Eliminar',
    variant: 'danger',
  });

  if (confirmed) {
    await loanStore.deleteLoan(id);
  }
}

async function handlePaymentAdded(
  loanId: string,
  payload: {
    amount: number;
    date?: string;
    accountId?: string;
    notes?: string;
  },
) {
  await loanStore.addPayment(loanId, payload);
  if (payload.accountId && authStore.user?.id) {
    await accountStore.fetchAccounts(authStore.user.id);
    await transactionStore.fetchTransactions(authStore.user.id);
  }
}
</script>

<template>
  <AppLayout
    title="Préstamos & Deudas"
    subtitle="Control de dinero prestado, deudas pendientes y recordatorios de cobro y pago."
  >
    <div class="space-y-6">
      <!-- Resumen Ejecutivo de Préstamos (Por Cobrar vs Por Pagar) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Card: Me Deben (Activos / Prestamista) -->
        <div
          class="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/20 dark:from-emerald-950/30 dark:via-[#111a29] dark:to-[#0B0F19] p-6 shadow-sm flex items-center justify-between"
        >
          <div class="space-y-1.5 w-full">
            <div class="flex items-center gap-2">
              <span class="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <span class="i-heroicons-arrow-up-right text-lg" />
              </span>
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Por Cobrar (Presté)
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight pt-1">
              {{ formattedPendingLent }}
            </div>
            <!-- Multi-currency breakdown if multiple currencies exist -->
            <div
              v-if="Object.keys(loanStore.pendingLentBalancesByCurrency).length > 1"
              class="flex items-center gap-1.5 flex-wrap pt-1"
            >
              <UBadge
                v-for="(amount, curr) in loanStore.pendingLentBalancesByCurrency"
                :key="curr"
                color="neutral"
                variant="subtle"
                size="xs"
                class="font-mono font-bold"
              >
                {{ CurrencyFormatter.format(amount, curr) }}
              </UBadge>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Dinero que prestaste a amigos, familiares o terceros.
            </p>
          </div>
        </div>

        <!-- Card: Debo (Pasivos / Deudas) -->
        <div
          class="rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-50/50 via-white to-rose-50/20 dark:from-rose-950/30 dark:via-[#111a29] dark:to-[#0B0F19] p-6 shadow-sm flex items-center justify-between"
        >
          <div class="space-y-1.5 w-full">
            <div class="flex items-center gap-2">
              <span class="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <span class="i-heroicons-arrow-down-left text-lg" />
              </span>
              <span class="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Por Pagar (Me prestaron)
              </span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight pt-1">
              {{ formattedPendingBorrowed }}
            </div>
            <!-- Multi-currency breakdown if multiple currencies exist -->
            <div
              v-if="Object.keys(loanStore.pendingBorrowedBalancesByCurrency).length > 1"
              class="flex items-center gap-1.5 flex-wrap pt-1"
            >
              <UBadge
                v-for="(amount, curr) in loanStore.pendingBorrowedBalancesByCurrency"
                :key="curr"
                color="neutral"
                variant="subtle"
                size="xs"
                class="font-mono font-bold"
              >
                {{ CurrencyFormatter.format(amount, curr) }}
              </UBadge>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Deudas activas pendientes de devolución o liquidación.
            </p>
          </div>
        </div>
      </div>

      <!-- Action & Filter Bar -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <!-- Filter Tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px]"
            :class="[
              activeFilter === 'ALL'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'bg-white dark:bg-[#162032] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#283a59] hover:bg-slate-100 dark:hover:bg-[#1c2940]',
            ]"
            @click="activeFilter = 'ALL'"
          >
            Todos ({{ loanStore.loans.length }})
          </button>

          <button
            type="button"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px]"
            :class="[
              activeFilter === 'LENT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#162032] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#283a59] hover:bg-slate-100 dark:hover:bg-[#1c2940]',
            ]"
            @click="activeFilter = 'LENT'"
          >
            Me Deben
          </button>

          <button
            type="button"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px]"
            :class="[
              activeFilter === 'BORROWED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#162032] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#283a59] hover:bg-slate-100 dark:hover:bg-[#1c2940]',
            ]"
            @click="activeFilter = 'BORROWED'"
          >
            Debo
          </button>

          <button
            type="button"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px]"
            :class="[
              activeFilter === 'PAID'
                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm'
                : 'bg-white dark:bg-[#162032] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#283a59] hover:bg-slate-100 dark:hover:bg-[#1c2940]',
            ]"
            @click="activeFilter = 'PAID'"
          >
            Liquidados
          </button>
        </div>

        <!-- Primary CTA Button -->
        <UButton
          color="primary"
          icon="i-heroicons-plus"
          class="font-bold min-h-[42px] cursor-pointer"
          @click="openCreateModal"
        >
          Nuevo Préstamo o Deuda
        </UButton>
      </div>

      <!-- Loans Grid -->
      <div v-if="loanStore.isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="n in 3"
          :key="n"
          class="h-56 rounded-2xl bg-slate-100 dark:bg-[#162032] animate-pulse border border-slate-200 dark:border-[#283a59]"
        />
      </div>

      <div
        v-else-if="filteredLoans.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <LoanCard
          v-for="loan in filteredLoans"
          :key="loan.id"
          :loan="loan"
          @add-payment="openPaymentModal"
          @edit="openEditModal"
          @delete="handleDeleteLoan"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-3 bg-white/50 dark:bg-[#0f1523]/50"
      >
        <div class="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-[#162032] text-slate-400">
          <span class="i-heroicons-banknotes text-3xl" />
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">
          No tienes préstamos ni deudas registradas
        </h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          Lleva el control de a quién le prestaste dinero o qué deudas tienes pendientes de pagar.
        </p>
        <div class="pt-2">
          <UButton
            color="primary"
            variant="soft"
            icon="i-heroicons-plus"
            class="font-bold min-h-[40px]"
            @click="openCreateModal"
          >
            Registrar Primer Préstamo
          </UButton>
        </div>
      </div>
    </div>

    <!-- Modal: Crear / Editar Préstamo -->
    <CreateLoanModal
      v-model:open="isCreateModalOpen"
      :loan="selectedLoan"
      :accounts="accountStore.accounts"
      :base-currency="rateStore.baseCurrency"
      @created="handleCreateLoan"
      @updated="handleUpdateLoan"
    />

    <!-- Modal: Registrar Abono -->
    <AddLoanPaymentModal
      v-model:open="isPaymentModalOpen"
      :loan="selectedLoan"
      :accounts="accountStore.accounts"
      @payment-added="handlePaymentAdded"
    />
  </AppLayout>
</template>
