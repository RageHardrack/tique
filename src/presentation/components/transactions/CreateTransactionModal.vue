<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import type { Account } from '../../../core/entities/Account';
import type { Category } from '../../../core/entities/Category';
import type { Transaction, TransactionType } from '../../../core/entities/Transaction';
import type { TaxCategory, TaxDeductionType, TaxDocumentType } from '../../../core/entities/Tax';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import { DateFormatter } from '../../../core/services/DateFormatter';
import { useExchangeRateStore } from '../../store/exchange-rates';
import { useAuthStore } from '../../store/auth';
import SearchableSelect from '../base/SearchableSelect.vue';

interface Props {
  transaction?: Transaction | null;
  accounts: Account[];
  categories: Category[];
}

const props = defineProps<Props>();

const rateStore = useExchangeRateStore();
const authStore = useAuthStore();

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  (
    e: 'created',
    transaction: {
      type: TransactionType;
      accountId: string;
      destinationAccountId?: string;
      categoryId?: string;
      amount: number;
      destinationAmount?: number;
      exchangeRate?: number;
      date: string;
      note?: string;
      taxCategory?: TaxCategory;
      taxDocumentType?: TaxDocumentType;
      taxDocumentNumber?: string;
      taxWithholdingAmount?: number;
      taxDeductionType?: TaxDeductionType;
    },
  ): void;
  (
    e: 'updated',
    id: string,
    transaction: {
      type: TransactionType;
      accountId: string;
      destinationAccountId?: string;
      categoryId?: string;
      amount: number;
      destinationAmount?: number;
      exchangeRate?: number;
      date: string;
      note?: string;
      taxCategory?: TaxCategory;
      taxDocumentType?: TaxDocumentType;
      taxDocumentNumber?: string;
      taxWithholdingAmount?: number;
      taxDeductionType?: TaxDeductionType;
    },
  ): void;
}>();

const today = DateFormatter.toInputDate();

const form = reactive<{
  type: TransactionType;
  accountId: string;
  destinationAccountId: string;
  categoryId: string;
  amount: number | null;
  destinationAmount: number | null;
  exchangeRate: number | null;
  date: string;
  note: string;
  taxCategory: TaxCategory;
  taxDocumentType: TaxDocumentType;
  taxDocumentNumber: string;
  taxWithholdingAmount: number | null;
  taxDeductionType: TaxDeductionType;
}>({
  type: 'EXPENSE',
  accountId: '',
  destinationAccountId: '',
  categoryId: '',
  amount: null,
  destinationAmount: null,
  exchangeRate: null,
  date: today,
  note: '',
  taxCategory: 'NONE',
  taxDocumentType: 'NONE',
  taxDocumentNumber: '',
  taxWithholdingAmount: null,
  taxDeductionType: 'NONE',
});

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const selectedAccount = computed(() => {
  return props.accounts.find((acc) => acc.id === form.accountId);
});

const selectedDestinationAccount = computed(() => {
  return props.accounts.find((acc) => acc.id === form.destinationAccountId);
});

const isCrossCurrency = computed(() => {
  return (
    form.type === 'TRANSFER' &&
    !!selectedAccount.value &&
    !!selectedDestinationAccount.value &&
    selectedAccount.value.currency !== selectedDestinationAccount.value.currency
  );
});

function calculateDestinationAmount() {
  if (
    isCrossCurrency.value &&
    selectedAccount.value &&
    selectedDestinationAccount.value &&
    form.amount &&
    Number(form.amount) > 0
  ) {
    const converted = rateStore.convert(
      Number(form.amount),
      selectedAccount.value.currency,
      selectedDestinationAccount.value.currency,
    );
    form.destinationAmount = Math.round(converted * 100) / 100;
    form.exchangeRate =
      Math.round(
        (Number(form.destinationAmount) / Number(form.amount)) * 10000,
      ) / 10000;
  } else if (!isCrossCurrency.value) {
    form.destinationAmount = form.amount;
    form.exchangeRate = 1;
  }
}

function handleAmountInput() {
  if (form.type === 'TRANSFER' && isCrossCurrency.value) {
    calculateDestinationAmount();
  }
}

function handleDestinationAmountInput() {
  if (
    form.amount &&
    Number(form.amount) > 0 &&
    form.destinationAmount &&
    Number(form.destinationAmount) > 0
  ) {
    form.exchangeRate =
      Math.round(
        (Number(form.destinationAmount) / Number(form.amount)) * 10000,
      ) / 10000;
  }
}

// Auto-calculate 8% withholding when selecting 4ta category
function calculateWithholding() {
  if (form.amount && Number(form.amount) > 1500) {
    form.taxWithholdingAmount =
      Math.round(Number(form.amount) * 0.08 * 100) / 100;
  } else {
    form.taxWithholdingAmount = 0;
  }
}

function handleSelectFourthCategory() {
  form.taxCategory = 'FOURTH_CATEGORY_INCOME';
  form.taxDocumentType = 'RXH';
  calculateWithholding();
}

function toggleDeductible(val: boolean | string | 'indeterminate') {
  if (val === true) {
    form.taxCategory = 'DEDUCTIBLE_EXPENSE_3UIT';
    if (form.taxDeductionType === 'NONE') {
      form.taxDeductionType = 'RESTAURANT_BAR';
    }
  } else {
    form.taxCategory = 'NONE';
    form.taxDeductionType = 'NONE';
    form.taxDocumentNumber = '';
  }
}

// Initialize default account or prefill editing transaction
watch(
  () => [open.value, props.transaction, props.accounts],
  ([isOpen]) => {
    if (isOpen) {
      if (props.transaction) {
        form.type = props.transaction.type;
        form.accountId = props.transaction.accountId;
        form.destinationAccountId =
          props.transaction.destinationAccountId || '';
        form.categoryId = props.transaction.categoryId || '';
        form.amount = props.transaction.amount;
        form.destinationAmount =
          props.transaction.destinationAmount ??
          (props.transaction.type === 'TRANSFER'
            ? props.transaction.amount
            : null);
        form.exchangeRate = props.transaction.exchangeRate ?? null;
        form.date = DateFormatter.toInputDate(props.transaction.date);
        form.note = props.transaction.note || '';
        form.taxCategory = props.transaction.taxCategory || 'NONE';
        form.taxDocumentType = props.transaction.taxDocumentType || 'NONE';
        form.taxDocumentNumber = props.transaction.taxDocumentNumber || '';
        form.taxWithholdingAmount =
          props.transaction.taxWithholdingAmount ?? null;
        form.taxDeductionType = props.transaction.taxDeductionType || 'NONE';
      } else {
        resetForm();
      }
      errorMessage.value = null;
    }
  },
  { immediate: true },
);

watch(
  () => props.accounts,
  (accounts) => {
    if (!form.accountId && accounts && accounts.length > 0) {
      form.accountId = accounts[0].id;
    }
  },
  { immediate: true },
);

watch(
  () => [form.destinationAccountId, form.accountId, form.type],
  ([, , currentType]) => {
    if (currentType === 'TRANSFER' && !props.transaction) {
      calculateDestinationAmount();
    }
  },
);

// Filter categories by transaction type
const filteredCategories = computed(() => {
  if (form.type === 'TRANSFER') return [];
  return props.categories.filter((cat) => cat.type === form.type);
});

// Auto-completar configuración tributaria según la categoría seleccionada (si no estamos editando)
watch(
  () => form.categoryId,
  (newCatId) => {
    if (!newCatId || props.transaction) return;
    const cat = props.categories.find((c) => c.id === newCatId);
    if (!cat) return;

    if (cat.type === 'EXPENSE') {
      if (cat.taxDeductionType && cat.taxDeductionType !== 'NONE') {
        form.taxCategory = 'DEDUCTIBLE_EXPENSE_3UIT';
        form.taxDeductionType = cat.taxDeductionType;
        if (form.taxDocumentType === 'NONE') {
          form.taxDocumentType = 'BOLETA';
        }
      }
    } else if (cat.type === 'INCOME') {
      if (cat.taxCategory && cat.taxCategory !== 'NONE') {
        form.taxCategory = cat.taxCategory;
        if (cat.taxCategory === 'FOURTH_CATEGORY_INCOME') {
          form.taxDocumentType = 'RXH';
          calculateWithholding();
        } else if (cat.taxCategory === 'FIFTH_CATEGORY_INCOME') {
          form.taxDocumentType = 'PAYROLL_SLIP';
        }
      }
    }
  },
);

// Destination account options (exclude source account)
const destinationAccountOptions = computed(() => {
  return props.accounts.filter((acc) => acc.id !== form.accountId);
});

const accountOptions = computed(() =>
  props.accounts.map((acc) => ({
    label: `${acc.name} (${acc.currency})`,
    value: acc.id,
  })),
);

const destinationOptions = computed(() =>
  destinationAccountOptions.value.map((acc) => ({
    label: `${acc.name} (${acc.currency})`,
    value: acc.id,
  })),
);

const categoryOptions = computed(() => [
  { label: 'Sin categoría / General', value: '', icon: 'i-heroicons-tag' },
  ...filteredCategories.value.map((cat) => ({
    label: cat.name,
    value: cat.id,
    icon: cat.icon || 'i-heroicons-tag',
    color: cat.color,
  })),
]);

const taxDeductionOptions = [
  { label: 'Restaurante / Bar (15%)', value: 'RESTAURANT_BAR' },
  { label: 'Hotel / Hospedaje (15%)', value: 'HOTEL' },
  { label: 'Alquiler de Inmueble (30%)', value: 'RENTAL' },
  { label: 'Servicio Profesional 4ta (30%)', value: 'PROFESSIONAL_SERVICE' },
  { label: 'Trabajadora del Hogar (100%)', value: 'DOMESTIC_WORKER' },
];

function resetForm() {
  form.type = 'EXPENSE';
  form.accountId = props.accounts[0]?.id || '';
  form.destinationAccountId = '';
  form.categoryId = '';
  form.amount = null;
  form.destinationAmount = null;
  form.exchangeRate = null;
  form.date = DateFormatter.toInputDate();
  form.note = '';
  form.taxCategory = 'NONE';
  form.taxDocumentType = 'NONE';
  form.taxDocumentNumber = '';
  form.taxWithholdingAmount = null;
  form.taxDeductionType = 'NONE';
  errorMessage.value = null;
}

function handleClose() {
  resetForm();
  open.value = false;
}

function handleSubmit() {
  errorMessage.value = null;

  if (!form.accountId) {
    errorMessage.value = 'Debes seleccionar una cuenta de origen.';
    return;
  }

  if (!form.amount || form.amount <= 0) {
    errorMessage.value = 'El monto debe ser mayor a 0.';
    return;
  }

  if (form.type === 'TRANSFER') {
    if (!form.destinationAccountId) {
      errorMessage.value =
        'Debes seleccionar una cuenta de destino para transferencias.';
      return;
    }
    if (form.destinationAccountId === form.accountId) {
      errorMessage.value =
        'La cuenta de destino debe ser diferente a la cuenta de origen.';
      return;
    }
    if (isCrossCurrency.value && (!form.destinationAmount || form.destinationAmount <= 0)) {
      errorMessage.value = 'El monto a recibir en la cuenta destino debe ser mayor a 0.';
      return;
    }
  }

  isSubmitting.value = true;

  const destinationAmountValue =
    form.type === 'TRANSFER'
      ? form.destinationAmount !== null && form.destinationAmount !== undefined
        ? Number(form.destinationAmount)
        : Number(form.amount)
      : undefined;

  const exchangeRateValue =
    form.type === 'TRANSFER' && isCrossCurrency.value
      ? form.exchangeRate !== null && form.exchangeRate !== undefined
        ? Number(form.exchangeRate)
        : form.amount && destinationAmountValue
          ? Number((destinationAmountValue / Number(form.amount)).toFixed(4))
          : undefined
      : undefined;

  const isoDate = DateFormatter.toIsoString(form.date);

  try {
    if (props.transaction?.id) {
      emit('updated', props.transaction.id, {
        type: form.type,
        accountId: form.accountId,
        destinationAccountId:
          form.type === 'TRANSFER' ? form.destinationAccountId : undefined,
        categoryId: form.categoryId || undefined,
        amount: Number(form.amount),
        destinationAmount: destinationAmountValue,
        exchangeRate: exchangeRateValue,
        date: isoDate,
        note: form.note.trim() || undefined,
        taxCategory: form.taxCategory,
        taxDocumentType: form.taxDocumentType,
        taxDocumentNumber: form.taxDocumentNumber.trim() || undefined,
        taxWithholdingAmount: form.taxWithholdingAmount ? Number(form.taxWithholdingAmount) : undefined,
        taxDeductionType: form.taxDeductionType,
      });
    } else {
      emit('created', {
        type: form.type,
        accountId: form.accountId,
        destinationAccountId:
          form.type === 'TRANSFER' ? form.destinationAccountId : undefined,
        categoryId: form.categoryId || undefined,
        amount: Number(form.amount),
        destinationAmount: destinationAmountValue,
        exchangeRate: exchangeRateValue,
        date: isoDate,
        note: form.note.trim() || undefined,
        taxCategory: form.taxCategory,
        taxDocumentType: form.taxDocumentType,
        taxDocumentNumber: form.taxDocumentNumber.trim() || undefined,
        taxWithholdingAmount: form.taxWithholdingAmount ? Number(form.taxWithholdingAmount) : undefined,
        taxDeductionType: form.taxDeductionType,
      });
    }
    resetForm();
    open.value = false;
  } catch (err) {
    errorMessage.value =
      (err as Error).message || 'Error al guardar la transacción.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="transaction ? 'Editar Movimiento' : 'Nuevo Movimiento'"
    :dismissible="false"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div
          v-if="errorMessage"
          class="rounded-lg bg-red-950/50 p-3 text-sm text-red-400 border border-red-800"
        >
          {{ errorMessage }}
        </div>

        <!-- Type Selector Tabs -->
        <div
          class="grid grid-cols-3 gap-2 p-1 bg-slate-900/90 rounded-lg border border-slate-800"
        >
          <button
            type="button"
            class="py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5"
            :class="
              form.type === 'EXPENSE'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            "
            @click="form.type = 'EXPENSE'"
          >
            <UIcon name="i-heroicons-arrow-down-left" class="h-3.5 w-3.5" />
            Gasto
          </button>
          <button
            type="button"
            class="py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5"
            :class="
              form.type === 'INCOME'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            "
            @click="form.type = 'INCOME'"
          >
            <UIcon name="i-heroicons-arrow-up-right" class="h-3.5 w-3.5" />
            Ingreso
          </button>
          <button
            type="button"
            class="py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5"
            :class="
              form.type === 'TRANSFER'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            "
            @click="form.type = 'TRANSFER'"
          >
            <UIcon name="i-heroicons-arrows-right-left" class="h-3.5 w-3.5" />
            Transferencia
          </button>
        </div>

        <!-- Account Selection -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-200">
              {{ form.type === 'TRANSFER' ? 'Cuenta Origen' : 'Cuenta' }}
              <span class="text-red-400">*</span>
            </label>
            <USelect
              v-model="form.accountId"
              :items="accountOptions"
              value-key="value"
              class="w-full"
            />
          </div>

          <!-- Destination Account (if TRANSFER) or Category (if Income/Expense) -->
          <div v-if="form.type === 'TRANSFER'" class="space-y-1.5">
            <label class="text-sm font-medium text-slate-200">
              Cuenta Destino <span class="text-red-400">*</span>
            </label>
            <USelect
              v-model="form.destinationAccountId"
              :items="destinationOptions"
              value-key="value"
              class="w-full"
            />
          </div>

          <div v-else class="space-y-1.5">
            <label class="text-sm font-medium text-slate-200">Categoría</label>
            <SearchableSelect
              v-model="form.categoryId"
              :items="categoryOptions"
              placeholder="Sin categoría / General"
              search-placeholder="Buscar categoría..."
            />
          </div>
        </div>

        <!-- Amount Fields: Standard vs Cross-Currency Transfer -->
        <div v-if="isCrossCurrency" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Source Amount (Enviar) -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-slate-200">
                  Monto a Enviar <span class="text-red-400">*</span>
                </label>
                <span
                  v-if="selectedAccount"
                  class="text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30"
                >
                  {{ selectedAccount.currency }} ({{
                    CurrencyFormatter.getSymbol(selectedAccount.currency)
                  }})
                </span>
              </div>
              <UInput
                v-model.number="form.amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                class="w-full text-base font-bold"
                required
                @input="handleAmountInput"
              />
            </div>

            <!-- Destination Amount (Recibir) -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-slate-200">
                  Monto a Recibir <span class="text-red-400">*</span>
                </label>
                <span
                  v-if="selectedDestinationAccount"
                  class="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30"
                >
                  {{ selectedDestinationAccount.currency }} ({{
                    CurrencyFormatter.getSymbol(selectedDestinationAccount.currency)
                  }})
                </span>
              </div>
              <UInput
                v-model.number="form.destinationAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                class="w-full text-base font-bold text-emerald-400"
                required
                @input="handleDestinationAmountInput"
              />
            </div>
          </div>

          <!-- Exchange Rate Info Banner -->
          <div
            v-if="selectedAccount && selectedDestinationAccount"
            class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400"
          >
            <div class="flex items-center gap-1.5">
              <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4 text-sky-400" />
              <span>
                Tipo de cambio:
                <strong class="text-slate-200">
                  1 {{ selectedAccount.currency }} =
                  {{
                    form.exchangeRate
                      ? form.exchangeRate.toFixed(4)
                      : (rateStore.convert(1, selectedAccount.currency, selectedDestinationAccount.currency)).toFixed(4)
                  }}
                  {{ selectedDestinationAccount.currency }}
                </strong>
              </span>
            </div>
            <button
              type="button"
              class="text-[11px] font-semibold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
              @click="calculateDestinationAmount"
            >
              Recalcular tasa
            </button>
          </div>
        </div>

        <!-- Standard Amount Field (Single Currency or Income/Expense) -->
        <div v-else class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-200">
              Monto <span class="text-red-400">*</span>
            </label>
            <span
              v-if="selectedAccount"
              class="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30"
            >
              {{ selectedAccount.currency }} ({{
                CurrencyFormatter.getSymbol(selectedAccount.currency)
              }})
            </span>
          </div>
          <UInput
            v-model.number="form.amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            class="w-full text-lg font-bold"
            required
            autofocus
            @input="handleAmountInput"
          />
        </div>

        <!-- Date and Note -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-200">Fecha</label>
            <UInput
              v-model="form.date"
              type="date"
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-200"
              >Nota / Descripción</label
            >
            <UInput
              v-model="form.note"
              placeholder="Ej: Supermercado, Alquiler, Salario"
              class="w-full"
            />
          </div>
        </div>

        <!-- Tax Metadata Section (SUNAT / Impuestos) -->
        <div
          v-if="form.type !== 'TRANSFER' && authStore.user?.taxProfileEnabled && authStore.user?.taxCountry === 'PE'"
          class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f1523]/60 space-y-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-scale" class="w-4 h-4 text-sky-400" />
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
                Información Tributaria (SUNAT)
              </span>
            </div>
            <span class="text-[10px] text-slate-400 font-medium">Opcional</span>
          </div>

          <!-- Income: 4ta vs 5ta -->
          <div v-if="form.type === 'INCOME'" class="space-y-2">
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                class="p-2 rounded-lg border text-center text-xs font-semibold cursor-pointer transition-all min-h-[36px]"
                :class="[
                  form.taxCategory === 'NONE'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400',
                ]"
                @click="form.taxCategory = 'NONE'"
              >
                Sin régimen
              </button>
              <button
                type="button"
                class="p-2 rounded-lg border text-center text-xs font-semibold cursor-pointer transition-all min-h-[36px]"
                :class="[
                  form.taxCategory === 'FOURTH_CATEGORY_INCOME'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400',
                ]"
                @click="handleSelectFourthCategory"
              >
                4ta (Honorarios / RxH)
              </button>
              <button
                type="button"
                class="p-2 rounded-lg border text-center text-xs font-semibold cursor-pointer transition-all min-h-[36px]"
                :class="[
                  form.taxCategory === 'FIFTH_CATEGORY_INCOME'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400',
                ]"
                @click="form.taxCategory = 'FIFTH_CATEGORY_INCOME'"
              >
                5ta (Planilla)
              </button>
            </div>

            <!-- Fourth Category Details -->
            <div
              v-if="form.taxCategory === 'FOURTH_CATEGORY_INCOME'"
              class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1"
            >
              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-slate-300">N° Recibo por Honorarios</label>
                <UInput
                  v-model="form.taxDocumentNumber"
                  placeholder="Ej: E001-45"
                  class="w-full"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-slate-300">Retención 8% (PEN)</label>
                <UInput
                  v-model.number="form.taxWithholdingAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <!-- Expense: Deducción 3 UIT -->
          <div v-else-if="form.type === 'EXPENSE'" class="space-y-2">
            <div class="flex items-center gap-2">
              <UCheckbox
                id="isDeductible"
                :model-value="form.taxCategory === 'DEDUCTIBLE_EXPENSE_3UIT'"
                label="Aplica para Deducción Adicional de 3 UIT ante SUNAT"
                @update:model-value="toggleDeductible"
              />
            </div>

            <div
              v-if="form.taxCategory === 'DEDUCTIBLE_EXPENSE_3UIT'"
              class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1"
            >
              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-slate-300">Tipo de Gasto Deducible</label>
                <USelect
                  v-model="form.taxDeductionType"
                  :items="taxDeductionOptions"
                  value-key="value"
                  class="w-full"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-slate-300">N° Comprobante / Factura / Boleta</label>
                <UInput
                  v-model="form.taxDocumentNumber"
                  placeholder="Ej: F001-00234 o B001-12"
                  class="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Cancelar
        </UButton>
        <UButton color="primary" :loading="isSubmitting" @click="handleSubmit">
          Guardar Movimiento
        </UButton>
      </div>
    </template>
  </UModal>
</template>
