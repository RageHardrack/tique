<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useAuthStore } from '../store/auth';
import AppLayout from '../layouts/AppLayout.vue';
import { useAccountStore } from '../store/accounts';
import { useTransactionStore } from '../store/transactions';
import { useExchangeRateStore } from '../store/exchange-rates';
import type { Account, AccountType } from '../../core/entities/Account';
import { CurrencyFormatter } from '../../core/services/CurrencyFormatter';
import { useConfirm } from '../composables/useConfirm';
import CreateAccountModal from '../components/accounts/CreateAccountModal.vue';
import ReconcileAccountModal from '../components/accounts/ReconcileAccountModal.vue';

const authStore = useAuthStore();
const accountStore = useAccountStore();
const transactionStore = useTransactionStore();
const rateStore = useExchangeRateStore();
const { confirm: confirmDialog } = useConfirm();

const isCreateModalOpen = ref(false);
const editingAccount = ref<Account | null>(null);
const isReconcileModalOpen = ref(false);
const reconcilingAccount = ref<Account | null>(null);
const selectedFilterType = ref<string>('ALL');

onMounted(async () => {
  if (authStore.user?.id) {
    await Promise.all([
      accountStore.fetchAccounts(authStore.user.id),
      transactionStore.fetchTransactions(authStore.user.id),
    ]);
  }
});

const totalPatrimonyConverted = computed(() => {
  return accountStore.accounts.reduce((sum, acc) => {
    return sum + rateStore.convert(acc.balance || 0, acc.currency || 'USD');
  }, 0);
});

const formattedTotalPatrimony = computed(() => {
  return CurrencyFormatter.format(
    totalPatrimonyConverted.value,
    rateStore.baseCurrency,
  );
});

const filteredAccounts = computed(() => {
  if (selectedFilterType.value === 'ALL') {
    return accountStore.accounts;
  }
  return accountStore.accounts.filter(
    (a) => a.type === selectedFilterType.value,
  );
});

// Transaction count and activity per account
const transactionCountsByAccountId = computed(() => {
  const map: Record<string, number> = {};
  transactionStore.transactions.forEach((tx) => {
    map[tx.accountId] = (map[tx.accountId] || 0) + 1;
    if (tx.destinationAccountId) {
      map[tx.destinationAccountId] = (map[tx.destinationAccountId] || 0) + 1;
    }
  });
  return map;
});

function openCreateModal() {
  editingAccount.value = null;
  isCreateModalOpen.value = true;
}

function openEditModal(account: any) {
  editingAccount.value = account;
  isCreateModalOpen.value = true;
}

function getAccountTypeLabel(type: AccountType): string {
  const labels: Record<AccountType, string> = {
    CHECKING: 'Cuenta Corriente',
    SAVINGS: 'Cuenta de Ahorros',
    WALLET: 'Billetera Digital / Crypto',
    CREDIT_CARD: 'Tarjeta de Crédito',
    CASH: 'Efectivo',
    INVESTMENT: 'Inversión',
  };
  return labels[type] || 'Cuenta';
}

function getAccountIcon(type: AccountType): string {
  const icons: Record<AccountType, string> = {
    CHECKING: 'i-heroicons-building-library',
    SAVINGS: 'i-heroicons-banknotes',
    WALLET: 'i-heroicons-qr-code',
    CREDIT_CARD: 'i-heroicons-credit-card',
    CASH: 'i-heroicons-currency-dollar',
    INVESTMENT: 'i-heroicons-chart-bar',
  };
  return icons[type] || 'i-heroicons-wallet';
}

async function handleCreate(payload: {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}) {
  if (!authStore.user?.id) return;
  await accountStore.createAccount({
    ...payload,
    userId: authStore.user.id,
  });
}

async function handleUpdate(
  id: string,
  payload: {
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
  },
) {
  await accountStore.updateAccount(id, payload);
}

async function handleDelete(id: string) {
  const confirmed = await confirmDialog({
    title: 'Eliminar cuenta',
    message: '¿Estás seguro de que deseas eliminar esta cuenta? Se desvincularán los movimientos asociados.',
    confirmText: 'Eliminar',
    variant: 'danger',
  });

  if (confirmed) {
    await accountStore.deleteAccount(id);
  }
}

function openReconcileModal(account: Account) {
  reconcilingAccount.value = account;
  isReconcileModalOpen.value = true;
}

async function handleReconciled(payload: { accountId: string; realBalance: number; note?: string }) {
  await accountStore.reconcileAccount(payload.accountId, payload.realBalance, payload.note);
  if (authStore.user?.id) {
    await transactionStore.fetchTransactions(authStore.user.id);
  }
}
</script>

<template>
  <AppLayout
    title="Cuentas & Billeteras"
    subtitle="Administra tus cuentas bancarias, billeteras digitales y efectivo en múltiples monedas."
  >
    <div class="space-y-6">
      <!-- Patrimony Overview Banner -->
      <div
        class="rounded-3xl border border-slate-200 dark:border-[#283a59] bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-[#162032] dark:via-[#111a29] dark:to-[#0B0F19] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6"
      >
        <div class="space-y-2">
          <span
            class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#4D7EA8]"
          >
            Patrimonio Total Consolidado
          </span>
          <div class="flex items-baseline gap-3 flex-wrap">
            <span
              class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-[#FAF7F2]"
            >
              {{ formattedTotalPatrimony }}
            </span>
            <span
              class="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1B3E9B]/15 text-[#1B3E9B] dark:text-sky-300 border border-[#1B3E9B]/25"
            >
              Base: {{ rateStore.baseCurrency }}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-[#94a3b8]">
            Calculado automáticamente convirtiendo los saldos en tiempo real.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <UButton
            color="primary"
            icon="i-heroicons-plus-circle"
            size="lg"
            @click="openCreateModal"
          >
            Nueva Cuenta
          </UButton>
        </div>
      </div>

      <!-- Filter by type toolbar -->
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-2 overflow-x-auto py-1">
          <button
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            :class="
              selectedFilterType === 'ALL'
                ? 'bg-[#1B3E9B] text-white shadow-sm'
                : 'bg-white dark:bg-[#162032] text-slate-600 dark:text-[#94a3b8] border border-slate-200 dark:border-[#283a59]'
            "
            @click="selectedFilterType = 'ALL'"
          >
            Todas ({{ accountStore.accounts.length }})
          </button>
          <button
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            :class="
              selectedFilterType === 'CHECKING'
                ? 'bg-[#1B3E9B] text-white shadow-sm'
                : 'bg-white dark:bg-[#162032] text-slate-600 dark:text-[#94a3b8] border border-slate-200 dark:border-[#283a59]'
            "
            @click="selectedFilterType = 'CHECKING'"
          >
            Corrientes
          </button>
          <button
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            :class="
              selectedFilterType === 'SAVINGS'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'bg-white dark:bg-[#162032] text-slate-600 dark:text-[#94a3b8] border border-slate-200 dark:border-[#283a59]'
            "
            @click="selectedFilterType = 'SAVINGS'"
          >
            Ahorros
          </button>
          <button
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            :class="
              selectedFilterType === 'WALLET'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'bg-white dark:bg-[#162032] text-slate-600 dark:text-[#94a3b8] border border-slate-200 dark:border-[#283a59]'
            "
            @click="selectedFilterType = 'WALLET'"
          >
            Billeteras
          </button>
          <button
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            :class="
              selectedFilterType === 'CASH'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'bg-white dark:bg-[#162032] text-slate-600 dark:text-[#94a3b8] border border-slate-200 dark:border-[#283a59]'
            "
            @click="selectedFilterType = 'CASH'"
          >
            Efectivo
          </button>
          <button
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            :class="
              selectedFilterType === 'CREDIT_CARD'
                ? 'bg-[#1B3E9B] text-white shadow-sm'
                : 'bg-white dark:bg-[#162032] text-slate-600 dark:text-[#94a3b8] border border-slate-200 dark:border-[#283a59]'
            "
            @click="selectedFilterType = 'CREDIT_CARD'"
          >
            Tarjetas
          </button>
        </div>
      </div>

      <!-- Accounts Grid -->
      <div
        v-if="accountStore.isLoading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="i in 3"
          :key="i"
          class="h-44 rounded-3xl border border-slate-200 dark:border-[#283a59] bg-slate-100 dark:bg-[#162032]/40 p-6 animate-pulse"
        />
      </div>

      <div
        v-else-if="filteredAccounts.length === 0"
        class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/50 p-12 text-center space-y-3 shadow-sm"
      >
        <div
          class="rounded-full bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-[#283a59] p-3 text-[#4D7EA8]"
        >
          <UIcon name="i-heroicons-credit-card" class="h-8 w-8" />
        </div>
        <div class="space-y-1">
          <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
            No tienes cuentas registradas en esta categoría
          </h3>
          <p class="text-xs text-slate-500 dark:text-[#94a3b8] max-w-sm">
            Agrega tus cuentas bancarias, billeteras o efectivo para comenzar a
            gestionar tus balances.
          </p>
        </div>
        <UButton
          color="primary"
          icon="i-heroicons-plus"
          size="sm"
          @click="openCreateModal"
        >
          Crear Cuenta
        </UButton>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="account in filteredAccounts"
          :key="account.id"
          class="rounded-3xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm hover:shadow-lg dark:shadow-black/20 transition-all flex flex-col justify-between space-y-6"
        >
          <div class="space-y-4">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 dark:border-[#283a59] bg-slate-50 dark:bg-[#0f1523] text-[#1B3E9B] dark:text-sky-400"
                >
                  <UIcon :name="getAccountIcon(account.type)" class="h-6 w-6" />
                </div>
                <div>
                  <h3
                    class="font-black text-lg text-slate-900 dark:text-[#f1f5f9] leading-tight"
                  >
                    {{ account.name }}
                  </h3>
                  <span
                    class="text-xs font-semibold text-slate-500 dark:text-[#4D7EA8]"
                  >
                    {{ getAccountTypeLabel(account.type) }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-1">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-pencil-square"
                  class="text-slate-400 hover:text-primary-500"
                  @click="openEditModal(account)"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-trash"
                  class="text-slate-400 hover:text-rose-500"
                  @click="handleDelete(account.id)"
                />
              </div>
            </div>

            <!-- Balances -->
            <div class="space-y-1">
              <span
                class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Saldo Disponible
              </span>
              <div class="flex items-baseline gap-2">
                <span
                  class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white"
                >
                  {{
                    CurrencyFormatter.format(account.balance, account.currency)
                  }}
                </span>
              </div>

              <!-- Equivalent in Base Currency if different -->
              <p
                v-if="account.currency !== rateStore.baseCurrency"
                class="text-xs font-medium text-slate-500 dark:text-sky-400"
              >
                ≈
                {{
                  CurrencyFormatter.format(
                    rateStore.convert(account.balance, account.currency),
                    rateStore.baseCurrency,
                  )
                }}
              </p>
            </div>
          </div>

          <!-- Footer info & Reconcile Action -->
          <div
            class="pt-3 border-t border-slate-100 dark:border-[#283a59]/60 flex items-center justify-between text-xs text-slate-500 dark:text-[#94a3b8]"
          >
            <div class="flex items-center gap-2">
              <UBadge
                color="neutral"
                variant="subtle"
                size="xs"
                class="font-bold"
              >
                {{ account.currency }}
              </UBadge>
              <span>
                {{ transactionCountsByAccountId[account.id] || 0 }} movimientos
              </span>
            </div>

            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              icon="i-heroicons-scale"
              class="font-semibold cursor-pointer min-h-[32px]"
              @click="openReconcileModal(account)"
            >
              Conciliar
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <CreateAccountModal
      v-model:open="isCreateModalOpen"
      :account="editingAccount"
      :base-currency="rateStore.baseCurrency"
      @created="handleCreate"
      @updated="(id, payload) => handleUpdate(id, payload)"
    />

    <!-- Reconcile Modal -->
    <ReconcileAccountModal
      v-model:open="isReconcileModalOpen"
      :account="reconcilingAccount"
      @reconciled="handleReconciled"
    />
  </AppLayout>
</template>
