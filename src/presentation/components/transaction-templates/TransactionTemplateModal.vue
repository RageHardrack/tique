<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import type { Account } from '../../../core/entities/Account';
import type { Category } from '../../../core/entities/Category';
import type { TransactionType } from '../../../core/entities/Transaction';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import { TransactionTemplateService } from '../../../core/services/TransactionTemplateService';
import type {
  TransactionTemplate,
  TransactionTemplateInput,
} from '../../../core/entities/TransactionTemplate';

interface Props {
  open: boolean;
  template?: TransactionTemplate | null;
  accounts: Account[];
  categories: Category[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'create', payload: TransactionTemplateInput): void;
  (e: 'update', id: string, payload: TransactionTemplateInput): void;
}>();

const TYPE_OPTIONS: { value: TransactionType; label: string; icon: string }[] =
  [
    { value: 'EXPENSE', label: 'Gasto', icon: 'i-heroicons-arrow-up-right' },
    { value: 'INCOME', label: 'Ingreso', icon: 'i-heroicons-arrow-down-left' },
    {
      value: 'TRANSFER',
      label: 'Transferencia',
      icon: 'i-heroicons-arrows-right-left',
    },
  ];

const form = reactive<{
  name: string;
  type: TransactionType;
  accountId: string;
  destinationAccountId: string;
  categoryId: string;
  // A `type="number"` field v-models a number (or an empty string when cleared).
  defaultAmount: number | '';
  note: string;
}>({
  name: '',
  type: 'EXPENSE',
  accountId: '',
  destinationAccountId: '',
  categoryId: '',
  defaultAmount: '',
  note: '',
});

const errors = ref<string[]>([]);

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

const sourceAccount = computed(() =>
  props.accounts.find((acc) => acc.id === form.accountId),
);

// Categories are typed INCOME | EXPENSE only, so a transfer has no category to
// offer: the picker is hidden and the stored category stays null.
const showCategoryPicker = computed(() => form.type !== 'TRANSFER');

const visibleCategories = computed(() =>
  props.categories.filter((cat) => cat.type === form.type),
);

const destinationAccounts = computed(() =>
  props.accounts.filter((acc) => acc.id !== form.accountId),
);

const amountCurrency = computed(() => sourceAccount.value?.currency || 'USD');

watch(
  () => [props.open, props.template],
  ([open]) => {
    if (!open) return;

    form.name = props.template?.name ?? '';
    form.type = props.template?.type ?? 'EXPENSE';
    form.accountId = props.template?.accountId ?? props.accounts[0]?.id ?? '';
    form.destinationAccountId = props.template?.destinationAccountId ?? '';
    form.categoryId = props.template?.categoryId ?? '';
    form.defaultAmount =
      props.template?.defaultAmount !== null &&
      props.template?.defaultAmount !== undefined
        ? props.template.defaultAmount
        : '';
    form.note = props.template?.note ?? '';
    errors.value = [];
  },
  { immediate: true },
);

watch(
  () => form.type,
  (type) => {
    if (type === 'TRANSFER') {
      form.categoryId = '';
    } else {
      form.destinationAccountId = '';
    }
    errors.value = [];
  },
);

function selectAccount(accountId: string) {
  form.accountId = accountId;
  if (form.destinationAccountId === accountId) {
    form.destinationAccountId = '';
  }
  errors.value = [];
}

function buildInput(): TransactionTemplateInput {
  const rawAmount = form.defaultAmount;
  const parsedAmount =
    rawAmount === '' || rawAmount === null ? null : Number(rawAmount);

  return {
    name: form.name.trim(),
    type: form.type,
    accountId: form.accountId,
    destinationAccountId:
      form.type === 'TRANSFER' ? form.destinationAccountId || null : null,
    categoryId: showCategoryPicker.value ? form.categoryId || null : null,
    defaultAmount:
      parsedAmount === null || Number.isNaN(parsedAmount) ? null : parsedAmount,
    note: form.note.trim() || null,
  };
}

function handleSubmit() {
  const input = buildInput();
  const issues = TransactionTemplateService.validate(input);

  if (issues.length > 0) {
    errors.value = issues;
    return;
  }

  errors.value = [];
  if (props.template?.id) {
    emit('update', props.template.id, input);
  } else {
    emit('create', input);
  }
  isOpen.value = false;
}
</script>

<template>
  <UModal v-model:open="isOpen" :dismissible="false">
    <template #content>
      <div
        data-testid="template-form"
        class="p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto bg-white dark:bg-[#162032] text-slate-900 dark:text-[#f1f5f9]"
      >
        <header
          class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#283a59]/60"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B3E9B]/15 text-[#1B3E9B] dark:text-sky-400"
            >
              <UIcon name="i-heroicons-document-duplicate" class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-base font-bold">
                {{ template ? 'Editar plantilla' : 'Nueva plantilla' }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-[#94a3b8]">
                Deja el movimiento listo; el monto siempre se puede ajustar al
                usarlo.
              </p>
            </div>
          </div>
          <UButton
            data-testid="template-close"
            color="neutral"
            variant="ghost"
            icon="i-heroicons-x-mark"
            aria-label="Cerrar"
            class="min-h-[40px] min-w-[40px]"
            @click="isOpen = false"
          />
        </header>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1">
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Nombre
            </label>
            <input
              id="template-name"
              v-model="form.name"
              data-testid="template-name"
              type="text"
              required
              placeholder="Ej: Transporte público"
              class="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>

          <div class="space-y-1">
            <span
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Tipo de movimiento
            </span>
            <div
              class="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80"
            >
              <button
                v-for="option in TYPE_OPTIONS"
                :key="option.value"
                :data-testid="`template-type-${option.value}`"
                type="button"
                class="py-2.5 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                :class="[
                  form.type === option.value
                    ? 'bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900',
                ]"
                @click="form.type = option.value"
              >
                <UIcon :name="option.icon" class="w-4 h-4" />
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="space-y-1">
            <span
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {{ form.type === 'TRANSFER' ? 'Cuenta origen' : 'Cuenta' }}
            </span>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="acc in accounts"
                :key="acc.id"
                :data-testid="`template-source-${acc.id}`"
                type="button"
                class="p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer min-h-[44px] flex flex-col justify-center"
                :class="[
                  form.accountId === acc.id
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#162032] text-slate-700 dark:text-slate-300',
                ]"
                @click="selectAccount(acc.id)"
              >
                <span class="truncate">{{ acc.name }}</span>
                <span class="text-[10px] text-slate-400 font-mono">{{
                  acc.currency
                }}</span>
              </button>
            </div>
          </div>

          <div v-if="form.type === 'TRANSFER'" class="space-y-1">
            <span
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cuenta destino
            </span>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="acc in destinationAccounts"
                :key="acc.id"
                :data-testid="`template-destination-${acc.id}`"
                type="button"
                class="p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer min-h-[44px] flex flex-col justify-center"
                :class="[
                  form.destinationAccountId === acc.id
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#162032] text-slate-700 dark:text-slate-300',
                ]"
                @click="form.destinationAccountId = acc.id"
              >
                <span class="truncate">{{ acc.name }}</span>
                <span class="text-[10px] text-slate-400 font-mono">{{
                  acc.currency
                }}</span>
              </button>
            </div>
          </div>

          <div
            v-if="showCategoryPicker"
            data-testid="template-categories"
            class="space-y-1"
          >
            <span
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Categoría (Opcional)
            </span>
            <div
              class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800/80 rounded-xl"
            >
              <button
                v-for="cat in visibleCategories"
                :key="cat.id"
                :data-testid="`template-category-${cat.id}`"
                type="button"
                class="px-2.5 py-2 rounded-lg text-left text-xs font-medium transition-all cursor-pointer min-h-[40px] truncate flex items-center gap-1.5"
                :class="[
                  form.categoryId === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300',
                ]"
                @click="form.categoryId = cat.id"
              >
                <span
                  v-if="cat.color"
                  class="w-2 h-2 rounded-full inline-block shrink-0"
                  :style="{ backgroundColor: cat.color }"
                />
                <span class="truncate">{{ cat.name }}</span>
              </button>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Monto por defecto (Opcional)
              </label>
              <span class="text-[11px] text-slate-400 font-mono">
                {{ CurrencyFormatter.getSymbol(amountCurrency) }}
              </span>
            </div>
            <input
              id="template-amount"
              v-model="form.defaultAmount"
              data-testid="template-amount"
              type="number"
              inputmode="decimal"
              step="0.01"
              min="0.01"
              placeholder="Sin monto fijo"
              class="w-full px-3 py-2.5 text-base font-bold rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] font-mono"
            />
          </div>

          <div class="space-y-1">
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Nota (Opcional)
            </label>
            <input
              id="template-note"
              v-model="form.note"
              data-testid="template-note"
              type="text"
              placeholder="Ej: Ruta casa al trabajo"
              class="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>

          <div
            v-if="errors.length > 0"
            data-testid="template-errors"
            role="alert"
            class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 font-medium space-y-1"
          >
            <p v-for="issue in errors" :key="issue">{{ issue }}</p>
          </div>

          <div
            class="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-[#283a59]/60"
          >
            <UButton
              color="neutral"
              variant="ghost"
              class="min-h-[44px] flex-1 font-semibold justify-center"
              @click="isOpen = false"
            >
              Cancelar
            </UButton>
            <button
              data-testid="template-submit"
              type="button"
              class="flex-1 min-h-[44px] rounded-lg bg-primary-600 text-white text-sm font-bold shadow-md cursor-pointer hover:bg-primary-700 transition-colors"
              @click="handleSubmit"
            >
              {{ template ? 'Guardar cambios' : 'Crear plantilla' }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>
