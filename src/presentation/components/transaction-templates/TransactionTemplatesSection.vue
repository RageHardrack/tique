<script setup lang="ts">
import { computed, ref } from 'vue';

import type { Account } from '../../../core/entities/Account';
import type { Category } from '../../../core/entities/Category';
import { DateFormatter } from '../../../core/services/DateFormatter';
import TransactionTemplateModal from './TransactionTemplateModal.vue';
import type { TransactionType } from '../../../core/entities/Transaction';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import type {
  TransactionTemplate,
  TransactionTemplateInput,
} from '../../../core/entities/TransactionTemplate';

interface Props {
  templates: TransactionTemplate[];
  accounts: Account[];
  categories: Category[];
  isLoading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'create', payload: TransactionTemplateInput): void;
  (e: 'update', id: string, payload: TransactionTemplateInput): void;
  (e: 'delete', id: string): void;
}>();

const TYPE_LABELS: Record<TransactionType, string> = {
  EXPENSE: 'Gasto',
  INCOME: 'Ingreso',
  TRANSFER: 'Transferencia',
};

const isFormOpen = ref(false);
const editingTemplate = ref<TransactionTemplate | null>(null);

const accountsById = computed(() => {
  const map: Record<string, Account> = {};
  props.accounts.forEach((acc) => {
    map[acc.id] = acc;
  });
  return map;
});

const categoriesById = computed(() => {
  const map: Record<string, Category> = {};
  props.categories.forEach((cat) => {
    map[cat.id] = cat;
  });
  return map;
});

const canCreate = computed(() => props.accounts.length > 0);

function accountName(accountId?: string | null): string {
  if (!accountId) return '';
  return accountsById.value[accountId]?.name || 'Cuenta eliminada';
}

function accountCurrency(accountId?: string | null): string {
  if (!accountId) return 'USD';
  return accountsById.value[accountId]?.currency || 'USD';
}

function categoryName(categoryId?: string | null): string | null {
  if (!categoryId) return null;
  return categoriesById.value[categoryId]?.name || null;
}

function formatAmount(template: TransactionTemplate): string | null {
  if (template.defaultAmount === null || template.defaultAmount === undefined) {
    return null;
  }
  return CurrencyFormatter.format(
    template.defaultAmount,
    accountCurrency(template.accountId),
  );
}

function openCreate() {
  editingTemplate.value = null;
  isFormOpen.value = true;
}

function openEdit(template: TransactionTemplate) {
  editingTemplate.value = template;
  isFormOpen.value = true;
}
</script>

<template>
  <section class="space-y-4">
    <header
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div>
        <h2
          class="text-xl font-black text-[#2B4162] dark:text-[#E0DDCF] tracking-tight"
        >
          Plantillas de movimientos
        </h2>
        <p class="text-sm text-slate-500 dark:text-[#4D7EA8]">
          Movimientos pre-hechos para registrarlos en un toque. No se programan:
          siempre decides el día y el monto.
        </p>
      </div>

      <button
        data-testid="template-create"
        type="button"
        :disabled="!canCreate"
        class="min-h-[44px] px-4 rounded-lg bg-primary-600 text-white text-sm font-bold shadow-md cursor-pointer hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        @click="openCreate"
      >
        <UIcon name="i-heroicons-plus" class="w-4 h-4" />
        Nueva plantilla
      </button>
    </header>

    <p
      v-if="!canCreate"
      class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 font-medium"
    >
      Crea primero una cuenta para poder guardar plantillas.
    </p>

    <p
      v-if="isLoading"
      class="text-xs font-semibold text-slate-500 dark:text-slate-400"
    >
      Cargando plantillas...
    </p>

    <div
      v-if="!isLoading && templates.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/50 p-10 text-center space-y-3 shadow-sm"
    >
      <div
        class="rounded-full bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-[#283a59] p-3 text-[#1B3E9B] dark:text-sky-400"
      >
        <UIcon name="i-heroicons-document-duplicate" class="h-8 w-8" />
      </div>
      <div class="space-y-1">
        <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
          Aún no tienes plantillas
        </h3>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8] max-w-sm">
          Guarda un movimiento repetido (transporte, un pago a tu SIP) y
          regístralo desde el Registro Rápido sin escribir nada.
        </p>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <article
        v-for="tpl in templates"
        :id="tpl.id"
        :key="tpl.id"
        :data-testid="`template-card-${tpl.id}`"
        class="rounded-2xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-5 shadow-sm flex flex-col justify-between gap-4"
      >
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h4
                class="font-bold text-sm text-slate-900 dark:text-[#f1f5f9] truncate"
              >
                {{ tpl.name }}
              </h4>
              <p class="text-xs text-slate-500 dark:text-[#94a3b8]">
                {{ TYPE_LABELS[tpl.type] }}
              </p>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <UButton
                :data-testid="`template-edit-${tpl.id}`"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-pencil-square"
                aria-label="Editar plantilla"
                class="text-slate-400 hover:text-primary-500"
                @click="openEdit(tpl)"
              />
              <UButton
                :data-testid="`template-delete-${tpl.id}`"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-trash"
                aria-label="Eliminar plantilla"
                class="text-slate-400 hover:text-rose-500"
                @click="emit('delete', tpl.id)"
              />
            </div>
          </div>

          <p class="text-lg font-black text-slate-900 dark:text-white">
            {{ formatAmount(tpl) || 'Sin monto fijo' }}
          </p>

          <div
            class="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"
          >
            <span
              class="px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#0f1523] font-semibold"
            >
              {{ accountName(tpl.accountId) }}
            </span>
            <template
              v-if="tpl.type === 'TRANSFER' && tpl.destinationAccountId"
            >
              <UIcon
                name="i-heroicons-arrow-right"
                class="w-3.5 h-3.5 text-slate-400"
              />
              <span
                class="px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#0f1523] font-semibold"
              >
                {{ accountName(tpl.destinationAccountId) }}
              </span>
            </template>
            <span
              v-if="categoryName(tpl.categoryId)"
              class="px-2 py-1 rounded-lg bg-primary-500/10 text-primary-600 dark:text-sky-300 font-semibold"
            >
              {{ categoryName(tpl.categoryId) }}
            </span>
          </div>
        </div>

        <p
          class="text-[11px] text-slate-400 pt-3 border-t border-slate-100 dark:border-[#283a59]/60"
        >
          <template v-if="tpl.lastUsedAt">
            Usada por última vez el
            {{ DateFormatter.format(tpl.lastUsedAt, 'D MMM YYYY') }}
          </template>
          <template v-else> Todavía no la usaste </template>
        </p>
      </article>
    </div>

    <TransactionTemplateModal
      :open="isFormOpen"
      :template="editingTemplate"
      :accounts="accounts"
      :categories="categories"
      @update:open="isFormOpen = $event"
      @create="emit('create', $event)"
      @update="(id, payload) => emit('update', id, payload)"
    />
  </section>
</template>
