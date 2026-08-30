<script setup lang="ts">
import { computed, ref } from 'vue';

import TransactionItem from './TransactionItem.vue';
import type { Category } from '../../../core/entities/Category';
import CreateTransactionModal from './CreateTransactionModal.vue';
import ImportStatementModal from './ImportStatementModal.vue';
import { CsvExportService } from '../../../core/services/CsvExportService';
import type {
  Account,
  SupportedCurrency,
} from '../../../core/entities/Account';
import type {
  Transaction,
  TransactionType,
} from '../../../core/entities/Transaction';
import {
  type DateFilterPreset,
  TransactionFilterService,
} from '../../../core/services/TransactionFilterService';

interface Props {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  baseCurrency?: SupportedCurrency;
  convertFn?: (amount: number, fromCurrency: string) => number;
  isLoading: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  baseCurrency: 'USD',
});

const emit = defineEmits<{
  (
    e: 'create',
    transaction: {
      type: TransactionType;
      accountId: string;
      destinationAccountId?: string;
      categoryId?: string | null;
      amount: number;
      destinationAmount?: number;
      exchangeRate?: number;
      date: string;
      note?: string;
    },
  ): void;
  (
    e: 'update',
    id: string,
    transaction: {
      type: TransactionType;
      accountId: string;
      destinationAccountId?: string;
      categoryId?: string | null;
      amount: number;
      destinationAmount?: number;
      exchangeRate?: number;
      date: string;
      note?: string;
    },
  ): void;
  (
    e: 'import-batch',
    transactions: {
      type: TransactionType;
      accountId: string;
      categoryId?: string;
      amount: number;
      date: string;
      note?: string;
    }[],
  ): void;
  (e: 'delete', id: string): void;
}>();

const isCreateModalOpen = ref(false);
const editingTransaction = ref<Transaction | null>(null);
const isImportModalOpen = ref(false);

function handleOpenImportModal() {
  isImportModalOpen.value = true;
}

function handleBatchImported(
  importedTxList: {
    type: TransactionType;
    accountId: string;
    categoryId?: string;
    amount: number;
    date: string;
    note?: string;
  }[],
) {
  emit('import-batch', importedTxList);
}

function handleOpenModal() {
  editingTransaction.value = null;
  isCreateModalOpen.value = true;
}

function handleEdit(tx: Transaction) {
  editingTransaction.value = tx;
  isCreateModalOpen.value = true;
}
const activeTypeFilter = ref<'ALL' | TransactionType>('ALL');
const searchTerm = ref('');
const selectedAccountId = ref('');
const selectedCategoryId = ref('');
const selectedDatePreset = ref<DateFilterPreset>('ALL_TIME');

const accountsMap = computed(() => {
  const map: Record<string, string> = {};
  props.accounts.forEach((acc) => {
    map[acc.id] = acc.name;
  });
  return map;
});

const accountsCurrencyMap = computed(() => {
  const map: Record<string, string> = {};
  props.accounts.forEach((acc) => {
    map[acc.id] = acc.currency;
  });
  return map;
});

const categoriesMap = computed(() => {
  const map: Record<string, string> = {};
  props.categories.forEach((cat) => {
    map[cat.id] = cat.name;
  });
  return map;
});

const hasActiveFilters = computed(() => {
  return (
    activeTypeFilter.value !== 'ALL' ||
    searchTerm.value.trim() !== '' ||
    selectedAccountId.value !== '' ||
    selectedCategoryId.value !== '' ||
    selectedDatePreset.value !== 'ALL_TIME'
  );
});

function clearFilters() {
  activeTypeFilter.value = 'ALL';
  searchTerm.value = '';
  selectedAccountId.value = '';
  selectedCategoryId.value = '';
  selectedDatePreset.value = 'ALL_TIME';
}

const filteredTransactions = computed(() => {
  return TransactionFilterService.filter(
    props.transactions,
    {
      type: activeTypeFilter.value,
      searchTerm: searchTerm.value,
      accountId: selectedAccountId.value || undefined,
      categoryId: selectedCategoryId.value || undefined,
      datePreset: selectedDatePreset.value,
    },
    props.accounts,
    props.categories,
  );
});

function handleExportCsv() {
  const csv = CsvExportService.generateCsv({
    transactions: filteredTransactions.value,
    accounts: props.accounts,
    categories: props.categories,
    baseCurrency: props.baseCurrency,
    convertFn: props.convertFn,
  });

  CsvExportService.downloadCsv(csv);
}

function handleCreate(payload: {
  type: TransactionType;
  accountId: string;
  destinationAccountId?: string;
  categoryId?: string | null;
  amount: number;
  destinationAmount?: number;
  exchangeRate?: number;
  date: string;
  note?: string;
}) {
  emit('create', payload);
}

function handleDelete(id: string) {
  emit('delete', id);
}
</script>

<template>
  <section class="space-y-4">
    <header
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div>
        <div class="flex items-center gap-3">
          <h2
            class="text-xl font-black text-[#2B4162] dark:text-[#E0DDCF] tracking-tight"
          >
            Movimientos Recientes
          </h2>
          <span
            v-if="transactions.length > 0"
            class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#162032] text-slate-600 dark:text-[#94a3b8] border border-slate-200 dark:border-[#283a59]"
          >
            {{ filteredTransactions.length }} / {{ transactions.length }}
          </span>
        </div>
        <p class="text-sm text-slate-500 dark:text-[#4D7EA8]">
          Registro detallado, búsqueda, filtros y exportación de movimientos.
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Import CSV Button -->
        <UButton
          color="neutral"
          variant="outline"
          icon="i-heroicons-arrow-up-tray"
          :disabled="accounts.length === 0"
          @click="handleOpenImportModal"
        >
          Importar Extracto
        </UButton>

        <!-- Export CSV Button -->
        <UButton
          v-if="transactions.length > 0"
          color="neutral"
          variant="outline"
          icon="i-heroicons-arrow-down-tray"
          @click="handleExportCsv"
        >
          Exportar CSV
        </UButton>

        <UButton
          color="primary"
          icon="i-heroicons-plus-circle"
          :disabled="accounts.length === 0"
          @click="handleOpenModal"
        >
          Nuevo Movimiento
        </UButton>
      </div>
    </header>

    <!-- Filter Toolbar -->
    <div
      v-if="transactions.length > 0"
      class="p-3 bg-white dark:bg-[#162032] rounded-2xl border border-slate-200 dark:border-[#283a59] shadow-sm space-y-3"
    >
      <!-- Top row: Search & Type Tabs -->
      <div
        class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
      >
        <!-- Search Input -->
        <div class="relative flex-1">
          <UInput
            v-model="searchTerm"
            placeholder="Buscar por nota, categoría, cuenta o monto..."
            icon="i-heroicons-magnifying-glass"
            class="w-full"
          />
        </div>

        <!-- Filter Tabs -->
        <div
          class="flex p-1 bg-slate-50 dark:bg-[#0f1523] rounded-lg border border-slate-200 dark:border-[#283a59] text-xs shadow-inner"
        >
          <button
            class="px-2.5 py-1 rounded font-medium transition-all"
            :class="
              activeTypeFilter === 'ALL'
                ? 'bg-[#1B3E9B]/20 text-[#1B3E9B] dark:text-sky-300 font-semibold border border-[#1B3E9B]/30 dark:border-[#1B3E9B]/50'
                : 'text-slate-500 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white'
            "
            @click="activeTypeFilter = 'ALL'"
          >
            Todos
          </button>
          <button
            class="px-2.5 py-1 rounded font-medium transition-all"
            :class="
              activeTypeFilter === 'INCOME'
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/40'
                : 'text-slate-500 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white'
            "
            @click="activeTypeFilter = 'INCOME'"
          >
            Ingresos
          </button>
          <button
            class="px-2.5 py-1 rounded font-medium transition-all"
            :class="
              activeTypeFilter === 'EXPENSE'
                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/40'
                : 'text-slate-500 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white'
            "
            @click="activeTypeFilter = 'EXPENSE'"
          >
            Gastos
          </button>
          <button
            class="px-2.5 py-1 rounded font-medium transition-all"
            :class="
              activeTypeFilter === 'TRANSFER'
                ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 font-semibold border border-sky-500/40'
                : 'text-slate-500 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white'
            "
            @click="activeTypeFilter = 'TRANSFER'"
          >
            Transferencias
          </button>
        </div>
      </div>

      <!-- Bottom row: Selectors for Account, Category, Date Preset, and Clear -->
      <div
        class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#283a59]/60"
      >
        <!-- Account Dropdown -->
        <select
          v-model="selectedAccountId"
          class="bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-[#283a59] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="">Todas las cuentas</option>
          <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
            {{ acc.name }}
          </option>
        </select>

        <!-- Category Dropdown -->
        <select
          v-model="selectedCategoryId"
          class="bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-[#283a59] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="">Todas las categorías</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>

        <!-- Date Preset Dropdown -->
        <select
          v-model="selectedDatePreset"
          class="bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-[#283a59] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="ALL_TIME">Todo el historial</option>
          <option value="THIS_MONTH">Este mes</option>
          <option value="LAST_30_DAYS">Últimos 30 días</option>
          <option value="LAST_MONTH">Mes anterior</option>
        </select>

        <!-- Clear Button -->
        <UButton
          v-if="hasActiveFilters"
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-heroicons-x-mark"
          @click="clearFilters"
        >
          Limpiar filtros
        </UButton>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="h-16 rounded-xl border border-slate-200 dark:border-[#283a59] bg-slate-100 dark:bg-[#162032]/40 p-4 animate-pulse flex items-center justify-between"
      >
        <div class="h-4 bg-slate-200 dark:bg-[#283a59]/60 rounded w-1/3" />
        <div class="h-4 bg-slate-200 dark:bg-[#283a59]/60 rounded w-20" />
      </div>
    </div>

    <!-- Empty State (No transactions registered at all) -->
    <div
      v-else-if="transactions.length === 0"
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/50 p-10 text-center space-y-3 shadow-sm"
    >
      <div
        class="rounded-full bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-[#283a59] p-3 text-[#4D7EA8]"
      >
        <UIcon name="i-heroicons-document-text" class="h-8 w-8" />
      </div>
      <div class="space-y-1">
        <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
          No hay movimientos registrados
        </h3>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8] max-w-sm">
          {{
            accounts.length === 0
              ? 'Crea una cuenta primero para poder registrar movimientos.'
              : 'Registra tus ingresos, compras o transferencias para llevar el control diario.'
          }}
        </p>
      </div>
      <UButton
        v-if="accounts.length > 0"
        color="primary"
        variant="subtle"
        icon="i-heroicons-plus"
        @click="handleOpenModal"
      >
        Registrar primer movimiento
      </UButton>
    </div>

    <!-- Empty State (Filters returned no results) -->
    <div
      v-else-if="filteredTransactions.length === 0"
      class="flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/50 p-8 text-center space-y-3 shadow-sm"
    >
      <div
        class="rounded-full bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-[#283a59] p-2.5 text-slate-400"
      >
        <UIcon name="i-heroicons-magnifying-glass" class="h-6 w-6" />
      </div>
      <div class="space-y-1">
        <h4 class="text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
          Ningún movimiento coincide con los filtros
        </h4>
        <p class="text-xs text-slate-500 dark:text-[#94a3b8]">
          Prueba modificando o limpiando los criterios de búsqueda
          seleccionados.
        </p>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        size="xs"
        icon="i-heroicons-arrow-path"
        @click="clearFilters"
      >
        Restablecer filtros
      </UButton>
    </div>

    <!-- Transactions List -->
    <div v-else class="space-y-2.5">
      <TransactionItem
        v-for="tx in filteredTransactions"
        :key="tx.id"
        :transaction="tx"
        :account-name="accountsMap[tx.accountId]"
        :account-currency="accountsCurrencyMap[tx.accountId]"
        :destination-account-name="
          tx.destinationAccountId
            ? accountsMap[tx.destinationAccountId]
            : undefined
        "
        :destination-account-currency="
          tx.destinationAccountId
            ? accountsCurrencyMap[tx.destinationAccountId]
            : undefined
        "
        :category-name="
          tx.categoryId ? categoriesMap[tx.categoryId] : undefined
        "
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- Create/Edit Modal -->
    <CreateTransactionModal
      v-model:open="isCreateModalOpen"
      :transaction="editingTransaction"
      :accounts="accounts"
      :categories="categories"
      @created="handleCreate"
      @updated="(id, payload) => emit('update', id, payload)"
    />

    <!-- Import Statement Modal -->
    <ImportStatementModal
      v-model:open="isImportModalOpen"
      :accounts="accounts"
      :categories="categories"
      :existing-transactions="transactions"
      @imported="handleBatchImported"
    />
  </section>
</template>
