<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAccountStore } from '../../store/accounts';
import { useCategoryStore } from '../../store/categories';
import { useTransactionStore } from '../../store/transactions';
import { useAuthStore } from '../../store/auth';
import { useExchangeRateStore } from '../../store/exchange-rates';
import { useTransactionTemplateStore } from '../../store/transaction-templates';
import { FrequentTransactionsService, type FrequentPattern } from '../../../core/services/FrequentTransactionsService';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import { TransactionTemplateService } from '../../../core/services/TransactionTemplateService';
import { TransferAmountService } from '../../../core/services/TransferAmountService';
import type { TransactionTemplate } from '../../../core/entities/TransactionTemplate';
import type { TransactionType } from '../../../core/entities/Transaction';
import QuickAddTemplateChips from './QuickAddTemplateChips.vue';

interface Props {
  open: boolean;
  initialType?: TransactionType;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  initialType: 'EXPENSE',
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}>();

const authStore = useAuthStore();
const accountStore = useAccountStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();
const rateStore = useExchangeRateStore();
const templateStore = useTransactionTemplateStore();

const TYPE_OPTIONS: { value: TransactionType; label: string; icon: string }[] = [
  { value: 'EXPENSE', label: 'Gasto', icon: 'i-heroicons-arrow-up-right' },
  { value: 'INCOME', label: 'Ingreso', icon: 'i-heroicons-arrow-down-left' },
  { value: 'TRANSFER', label: 'Transferencia', icon: 'i-heroicons-arrows-right-left' },
];

const txType = ref<TransactionType>(props.initialType);
const selectedAccountId = ref('');
const selectedDestinationAccountId = ref('');
const destinationAmount = ref<number | ''>('');
const selectedCategoryId = ref('');
const categorySearch = ref('');
const amount = ref<number | ''>('');
const exchangeRate = ref<number | null>(null);
const note = ref('');
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
/** Template whose draft is on screen; used only to mark it as used on success. */
const activeTemplateId = ref<string | null>(null);

const frequentPatterns = computed<FrequentPattern[]>(() => {
  return FrequentTransactionsService.getFrequentPatterns(transactionStore.transactions, 4);
});

const selectedAccount = computed(() =>
  accountStore.accounts.find((acc) => acc.id === selectedAccountId.value),
);

const selectedDestinationAccount = computed(() =>
  accountStore.accounts.find((acc) => acc.id === selectedDestinationAccountId.value),
);

const isTransfer = computed(() => txType.value === 'TRANSFER');

const destinationAccounts = computed(() =>
  accountStore.accounts.filter((acc) => acc.id !== selectedAccountId.value),
);

const isCrossCurrency = computed(() =>
  TransferAmountService.isCrossCurrency(
    txType.value,
    selectedAccount.value?.currency,
    selectedDestinationAccount.value?.currency,
  ),
);

// Categories are typed INCOME | EXPENSE only, so a transfer has none to show.
const filteredCategories = computed(() => {
  if (isTransfer.value) return [];
  return categoryStore.categories.filter((c) => c.type === txType.value);
});

const displayedCategories = computed(() => {
  if (!categorySearch.value.trim()) return filteredCategories.value;
  const q = categorySearch.value.trim().toLowerCase();
  return filteredCategories.value.filter((c) =>
    c.name.toLowerCase().includes(q),
  );
});

const activeAccountCurrency = computed(() => {
  const acc = accountStore.accounts.find((a) => a.id === selectedAccountId.value);
  return acc?.currency || rateStore.baseCurrency;
});

const isVesAccount = computed(() => activeAccountCurrency.value === 'VES');

// The VES rate field mirrors the official daily rate until the user types
// their own rate, so a rate that arrives after the sheet opened still lands.
const followsOfficialRate = ref(false);

function seedDailyVesRate() {
  const official = rateStore.rates.VES;
  if (!isVesAccount.value || !official || official <= 0) return;
  if (exchangeRate.value && !followsOfficialRate.value) return;

  exchangeRate.value = official;
  followsOfficialRate.value = true;
}

function handleExchangeRateInput() {
  followsOfficialRate.value = false;
}

watch(() => rateStore.rates.VES, seedDailyVesRate);

const liveUsdEquivalent = computed(() => {
  if (
    !isVesAccount.value ||
    !amount.value ||
    !exchangeRate.value ||
    Number(exchangeRate.value) <= 0
  ) {
    return null;
  }
  const usd = Number(amount.value) / Number(exchangeRate.value);
  return CurrencyFormatter.format(usd, 'USD');
});

watch(
  () => activeAccountCurrency.value,
  (curr) => {
    if (curr === 'VES') {
      seedDailyVesRate();
    } else {
      exchangeRate.value = null;
      followsOfficialRate.value = false;
    }
  },
  { immediate: true },
);

/**
 * A cross-currency transfer shows what the destination account will receive.
 * Same-currency transfers mirror the source amount, and everything else keeps
 * the destination field out of the way.
 */
function syncDestinationAmount() {
  if (!isCrossCurrency.value || !amount.value || Number(amount.value) <= 0) {
    destinationAmount.value = '';
    return;
  }

  const converted = rateStore.convert(
    Number(amount.value),
    selectedAccount.value?.currency,
    selectedDestinationAccount.value?.currency,
  );

  destinationAmount.value = TransferAmountService.autoCalculate({
    amount: Number(amount.value),
    convertedAmount: converted,
  }).destinationAmount;
}

function handleAmountInput() {
  syncDestinationAmount();
}

function handleDestinationAmountInput() {
  // The rate the amounts express is derived again on submit.
  followsOfficialRate.value = false;
}

/** Rate the two amount fields currently express, shown next to the destination. */
const impliedRate = computed(() => {
  const rate = TransferAmountService.deriveRate(
    amount.value === '' ? null : Number(amount.value),
    destinationAmount.value === '' ? null : Number(destinationAmount.value),
  );
  return rate === null ? null : rate.toFixed(4);
});

function selectType(type: TransactionType) {
  txType.value = type;
  if (type !== 'TRANSFER') {
    selectedDestinationAccountId.value = '';
    destinationAmount.value = '';
  } else {
    syncDestinationAmount();
  }
  errorMessage.value = null;
}

function selectSourceAccount(accountId: string) {
  selectedAccountId.value = accountId;
  if (selectedDestinationAccountId.value === accountId) {
    selectedDestinationAccountId.value = '';
  }
  syncDestinationAmount();
}

function resetForm() {
  txType.value = props.initialType || 'EXPENSE';
  selectedAccountId.value = accountStore.accounts.length > 0 ? accountStore.accounts[0].id : '';
  selectedDestinationAccountId.value = '';
  destinationAmount.value = '';
  selectedCategoryId.value = '';
  categorySearch.value = '';
  amount.value = '';
  exchangeRate.value = null;
  followsOfficialRate.value = false;
  seedDailyVesRate();
  note.value = '';
  errorMessage.value = null;
  activeTemplateId.value = null;
}

watch(
  () => [props.open, props.initialType],
  ([isOpen]) => {
    if (isOpen) {
      resetForm();
      void rateStore.ensureFreshRates();
      void templateStore.fetchTemplates();
    }
  },
  { immediate: true },
);

function applyPattern(pattern: FrequentPattern) {
  txType.value = pattern.type;
  selectedDestinationAccountId.value = '';
  destinationAmount.value = '';
  selectedAccountId.value = pattern.accountId;
  selectedCategoryId.value = pattern.categoryId || '';
  amount.value = pattern.averageAmount;
  note.value = pattern.note || '';
  activeTemplateId.value = null;
}

/** S5: a template prefills the sheet; the user still confirms the movement. */
function applyTemplate(template: TransactionTemplate) {
  const draft = TransactionTemplateService.buildDraft(template);

  activeTemplateId.value = template.id;
  txType.value = draft.type;
  selectedAccountId.value = draft.accountId;
  selectedDestinationAccountId.value = draft.destinationAccountId ?? '';
  selectedCategoryId.value = draft.categoryId ?? '';
  amount.value = draft.amount ?? '';
  note.value = draft.note ?? '';
  errorMessage.value = null;

  syncDestinationAmount();
}

function handleClose() {
  emit('update:open', false);
}

async function handleSubmit() {
  if (!amount.value || Number(amount.value) <= 0) {
    errorMessage.value = 'El monto debe ser mayor a 0.';
    return;
  }
  if (!selectedAccountId.value) {
    errorMessage.value = 'Por favor selecciona una cuenta.';
    return;
  }
  if (isTransfer.value) {
    if (!selectedDestinationAccountId.value) {
      errorMessage.value =
        'Debes seleccionar una cuenta destino para la transferencia.';
      return;
    }
    if (selectedDestinationAccountId.value === selectedAccountId.value) {
      errorMessage.value =
        'La cuenta destino debe ser diferente a la cuenta de origen.';
      return;
    }
    if (
      isCrossCurrency.value &&
      (!destinationAmount.value || Number(destinationAmount.value) <= 0)
    ) {
      errorMessage.value =
        'El monto a recibir en la cuenta destino debe ser mayor a 0.';
      return;
    }
  }
  if (
    !isTransfer.value &&
    isVesAccount.value &&
    (!exchangeRate.value || Number(exchangeRate.value) <= 0)
  ) {
    errorMessage.value = 'Debes ingresar la tasa de cambio del día (VES/USD).';
    return;
  }
  if (!authStore.user?.id) return;

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    const transferAmounts = TransferAmountService.resolveSubmitAmounts({
      type: txType.value,
      isCrossCurrency: isCrossCurrency.value,
      amount: Number(amount.value),
      destinationAmount:
        destinationAmount.value === '' ? null : Number(destinationAmount.value),
      // The daily VES rate is what the app records for bolivar movements; a
      // cross-currency transfer records the rate its two amounts express.
      exchangeRate:
        isCrossCurrency.value
          ? null
          : isVesAccount.value && exchangeRate.value
            ? Number(exchangeRate.value)
            : null,
    });

    const cat = categoryStore.categories.find((c) => c.id === selectedCategoryId.value);
    let taxCategory: any = 'NONE';
    let taxDocumentType: any = 'NONE';
    let taxDeductionType: any = 'NONE';
    let taxWithholdingAmount: number | undefined = undefined;

    if (cat) {
      if (cat.type === 'EXPENSE' && cat.taxDeductionType && cat.taxDeductionType !== 'NONE') {
        taxCategory = 'DEDUCTIBLE_EXPENSE_3UIT';
        taxDeductionType = cat.taxDeductionType;
        taxDocumentType = 'BOLETA';
      } else if (cat.type === 'INCOME' && cat.taxCategory && cat.taxCategory !== 'NONE') {
        taxCategory = cat.taxCategory;
        if (cat.taxCategory === 'FOURTH_CATEGORY_INCOME') {
          taxDocumentType = 'RXH';
          const numericAmount = Number(amount.value);
          if (numericAmount > 1500) {
            taxWithholdingAmount = Math.round(numericAmount * 0.08 * 100) / 100;
          }
        } else if (cat.taxCategory === 'FIFTH_CATEGORY_INCOME') {
          taxDocumentType = 'PAYROLL_SLIP';
        }
      }
    }

    await transactionStore.createTransaction({
      userId: authStore.user.id,
      accountId: selectedAccountId.value,
      destinationAccountId: isTransfer.value
        ? selectedDestinationAccountId.value
        : undefined,
      categoryId: selectedCategoryId.value || undefined,
      amount: Number(amount.value),
      destinationAmount: transferAmounts.destinationAmount,
      exchangeRate: transferAmounts.exchangeRate,
      type: txType.value,
      date: new Date().toISOString(),
      note: note.value.trim() || undefined,
      taxCategory,
      taxDocumentType,
      taxDeductionType,
      taxWithholdingAmount,
    });

    // S7: the template is only marked as used once the movement exists.
    if (activeTemplateId.value) {
      await templateStore.markUsed(activeTemplateId.value);
    }

    await accountStore.fetchAccounts(authStore.user.id);
    emit('success');
    handleClose();
  } catch (e) {
    errorMessage.value = (e as Error).message;
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="false"
    :ui="{ content: 'max-w-xl sm:max-w-2xl' }"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <div class="p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <UIcon name="i-heroicons-bolt" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 dark:text-white">
                Registro Rápido
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Guarda un movimiento en un solo toque
              </p>
            </div>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-x-mark"
            aria-label="Cerrar"
            class="min-h-[40px] min-w-[40px]"
            @click="handleClose"
          />
        </div>

        <!-- Templates (S7): prefill only, never submit on their own -->
        <QuickAddTemplateChips
          :templates="templateStore.sortedTemplates"
          :accounts="accountStore.accounts"
          :active-template-id="activeTemplateId"
          @select="applyTemplate"
        />

        <!-- Frequent Patterns Chips -->
        <div v-if="frequentPatterns.length > 0" class="space-y-1.5">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Frecuentes
          </span>
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              v-for="p in frequentPatterns"
              :key="p.key"
              type="button"
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer min-h-[36px]"
              @click="applyPattern(p)"
            >
              <UIcon
                :name="p.type === 'EXPENSE' ? 'i-heroicons-arrow-up-right' : 'i-heroicons-arrow-down-left'"
                class="w-3.5 h-3.5"
                :class="p.type === 'EXPENSE' ? 'text-rose-500' : 'text-emerald-500'"
              />
              <span>{{ p.note || 'Movimiento' }}</span>
              <span class="text-slate-400 font-mono text-[10px]">{{ p.averageAmount }}</span>
            </button>
          </div>
        </div>

        <!-- Type Segmented Control -->
        <div class="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
          <button
            v-for="option in TYPE_OPTIONS"
            :key="option.value"
            :data-testid="`quick-add-type-${option.value}`"
            :aria-pressed="txType === option.value"
            type="button"
            class="py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            :class="[
              txType === option.value
                ? option.value === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : option.value === 'INCOME'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900',
            ]"
            @click="selectType(option.value)"
          >
            <UIcon :name="option.icon" class="w-4 h-4" />
            {{ option.label }}
          </button>
        </div>

        <!-- Big Numeric Input for Touch Screens -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Monto ({{ activeAccountCurrency }})
          </label>
          <div class="relative flex items-center">
            <span class="absolute left-4 text-xl font-bold text-slate-400 font-mono">
              {{ activeAccountCurrency === 'USD' ? '$' : activeAccountCurrency === 'PEN' ? 'S/' : 'Bs.' }}
            </span>
            <input
              id="quick-add-amount"
              data-testid="quick-add-amount"
              v-model="amount"
              type="number"
              inputmode="decimal"
              step="0.01"
              placeholder="0.00"
              required
              class="w-full pl-12 pr-4 py-3 text-2xl font-black rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono min-h-[56px]"
              @input="handleAmountInput"
            />
          </div>
        </div>

        <!-- Destination Amount, only when the transfer crosses currencies -->
        <div
          v-if="isCrossCurrency"
          class="space-y-1.5 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
        >
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4 text-sky-500" />
              Monto a recibir ({{ selectedDestinationAccount?.currency }}) <span class="text-red-400">*</span>
            </label>
            <span class="text-[11px] text-slate-400 font-mono">
              Tasa 1 {{ selectedAccount?.currency }} = {{ impliedRate }} {{ selectedDestinationAccount?.currency }}
            </span>
          </div>
          <UInput
            data-testid="quick-add-destination-amount"
            v-model.number="destinationAmount"
            type="number"
            inputmode="decimal"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            size="sm"
            class="w-full"
            required
            @input="handleDestinationAmountInput"
          />
        </div>

        <!-- VES Exchange Rate Field & Live USD Preview -->
        <div
          v-if="isVesAccount && !isTransfer"
          class="space-y-1.5 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
        >
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4 text-emerald-500" />
              Tasa del día (VES/USD) <span class="text-red-400">*</span>
            </label>
            <span
              v-if="liveUsdEquivalent"
              class="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30"
            >
              ≈ {{ liveUsdEquivalent }}
            </span>
          </div>
          <UInput
            v-model.number="exchangeRate"
            type="number"
            step="0.0001"
            min="0.0001"
            placeholder="Ej. 813.74"
            size="sm"
            class="w-full"
            required
            @input="handleExchangeRateInput"
          />
        </div>

        <!-- Fast Account Selection -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {{ isTransfer ? 'Cuenta origen' : 'Cuenta' }}
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <button
              v-for="acc in accountStore.accounts"
              :key="acc.id"
              :data-testid="`quick-add-account-${acc.id}`"
              :aria-pressed="selectedAccountId === acc.id"
              type="button"
              class="p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer min-h-[44px] flex flex-col justify-center"
              :class="[
                selectedAccountId === acc.id
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#162032] text-slate-700 dark:text-slate-300',
              ]"
              @click="selectSourceAccount(acc.id)"
            >
              <span class="truncate">{{ acc.name }}</span>
              <span class="text-[10px] text-slate-400 font-mono">{{ acc.currency }}</span>
            </button>
          </div>
        </div>

        <!-- Destination Account Selection (transfers only, never the source) -->
        <div v-if="isTransfer" class="space-y-1">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Cuenta destino
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <button
              v-for="acc in destinationAccounts"
              :key="acc.id"
              :data-testid="`quick-add-destination-${acc.id}`"
              :aria-pressed="selectedDestinationAccountId === acc.id"
              type="button"
              class="p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer min-h-[44px] flex flex-col justify-center"
              :class="[
                selectedDestinationAccountId === acc.id
                  ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#162032] text-slate-700 dark:text-slate-300',
              ]"
              @click="selectedDestinationAccountId = acc.id; syncDestinationAmount()"
            >
              <span class="truncate">{{ acc.name }}</span>
              <span class="text-[10px] text-slate-400 font-mono">{{ acc.currency }}</span>
            </button>
          </div>
        </div>

        <!-- Fast Category Grid with Search -->
        <div v-if="!isTransfer" class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">Categoría</label>
            <span v-if="filteredCategories.length > 4" class="text-[10px] text-slate-400">
              {{ displayedCategories.length }} disponibles
            </span>
          </div>
          <UInput
            v-if="filteredCategories.length > 4"
            v-model="categorySearch"
            placeholder="Buscar categoría..."
            icon="i-heroicons-magnifying-glass"
            size="xs"
            class="w-full mb-1"
          />
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800/80 rounded-xl">
            <button
              v-if="!categorySearch.trim()"
              type="button"
              :aria-pressed="selectedCategoryId === ''"
              class="px-2.5 py-2 rounded-lg text-left text-xs font-medium transition-all cursor-pointer min-h-[40px] truncate"
              :class="[
                selectedCategoryId === ''
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300',
              ]"
              @click="selectedCategoryId = ''"
            >
              General
            </button>
            <button
              v-for="cat in displayedCategories"
              :key="cat.id"
              :data-testid="`quick-add-category-${cat.id}`"
              :aria-pressed="selectedCategoryId === cat.id"
              type="button"
              class="px-2.5 py-2 rounded-lg text-left text-xs font-medium transition-all cursor-pointer min-h-[40px] truncate flex items-center gap-1.5"
              :class="[
                selectedCategoryId === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300',
              ]"
              @click="selectedCategoryId = cat.id"
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

        <!-- Note input -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">Nota / Detalle (Opcional)</label>
          <UInput
            id="quick-add-note"
            data-testid="quick-add-note"
            v-model="note"
            placeholder="Ej: Café con colegas, Uber, Mercado"
            class="w-full"
          />
        </div>

        <div
          v-if="errorMessage"
          data-testid="quick-add-error"
          role="alert"
          class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 font-medium"
        >
          {{ errorMessage }}
        </div>

        <!-- Submit Buttons -->
        <div class="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
          <UButton
            color="neutral"
            variant="ghost"
            class="min-h-[44px] flex-1 font-semibold"
            @click="handleClose"
          >
            Cancelar
          </UButton>
          <button
            data-testid="quick-add-submit"
            type="button"
            :disabled="isSubmitting"
            class="flex-1 min-h-[44px] rounded-lg bg-primary-600 text-white text-sm font-bold shadow-md cursor-pointer hover:bg-primary-700 transition-colors disabled:opacity-60"
            @click="handleSubmit"
          >
            Guardar
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>
