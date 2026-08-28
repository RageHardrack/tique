<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAccountStore } from '../../store/accounts';
import { useCategoryStore } from '../../store/categories';
import { useTransactionStore } from '../../store/transactions';
import { useAuthStore } from '../../store/auth';
import { useExchangeRateStore } from '../../store/exchange-rates';
import { FrequentTransactionsService, type FrequentPattern } from '../../../core/services/FrequentTransactionsService';

interface Props {
  open: boolean;
  initialType?: 'EXPENSE' | 'INCOME';
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

const txType = ref<'EXPENSE' | 'INCOME'>(props.initialType);
const selectedAccountId = ref('');
const selectedCategoryId = ref('');
const amount = ref<number | ''>('');
const note = ref('');
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const frequentPatterns = computed<FrequentPattern[]>(() => {
  return FrequentTransactionsService.getFrequentPatterns(transactionStore.transactions, 4);
});

const filteredCategories = computed(() => {
  return categoryStore.categories.filter((c) => c.type === txType.value);
});

const activeAccountCurrency = computed(() => {
  const acc = accountStore.accounts.find((a) => a.id === selectedAccountId.value);
  return acc?.currency || rateStore.baseCurrency;
});

function resetForm() {
  txType.value = props.initialType || 'EXPENSE';
  selectedAccountId.value = accountStore.accounts.length > 0 ? accountStore.accounts[0].id : '';
  selectedCategoryId.value = '';
  amount.value = '';
  note.value = '';
  errorMessage.value = null;
}

watch(
  () => [props.open, props.initialType],
  ([isOpen]) => {
    if (isOpen) {
      resetForm();
    }
  },
  { immediate: true },
);

function applyPattern(pattern: FrequentPattern) {
  txType.value = pattern.type;
  selectedAccountId.value = pattern.accountId;
  selectedCategoryId.value = pattern.categoryId || '';
  amount.value = pattern.averageAmount;
  note.value = pattern.note || '';
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
  if (!authStore.user?.id) return;

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
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
      categoryId: selectedCategoryId.value || undefined,
      amount: Number(amount.value),
      type: txType.value,
      date: new Date().toISOString(),
      note: note.value.trim() || undefined,
      taxCategory,
      taxDocumentType,
      taxDeductionType,
      taxWithholdingAmount,
    });

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
        <div class="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
          <button
            type="button"
            class="py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            :class="[
              txType === 'EXPENSE'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900',
            ]"
            @click="txType = 'EXPENSE'"
          >
            <UIcon name="i-heroicons-arrow-up-right" class="w-4 h-4" />
            Gasto
          </button>
          <button
            type="button"
            class="py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            :class="[
              txType === 'INCOME'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900',
            ]"
            @click="txType = 'INCOME'"
          >
            <UIcon name="i-heroicons-arrow-down-left" class="w-4 h-4" />
            Ingreso
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
              v-model="amount"
              type="number"
              inputmode="decimal"
              step="0.01"
              placeholder="0.00"
              required
              class="w-full pl-12 pr-4 py-3 text-2xl font-black rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono min-h-[56px]"
            />
          </div>
        </div>

        <!-- Fast Account Selection -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">Cuenta</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <button
              v-for="acc in accountStore.accounts"
              :key="acc.id"
              type="button"
              class="p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer min-h-[44px] flex flex-col justify-center"
              :class="[
                selectedAccountId === acc.id
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#162032] text-slate-700 dark:text-slate-300',
              ]"
              @click="selectedAccountId = acc.id"
            >
              <span class="truncate">{{ acc.name }}</span>
              <span class="text-[10px] text-slate-400 font-mono">{{ acc.currency }}</span>
            </button>
          </div>
        </div>

        <!-- Fast Category Grid -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">Categoría</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800/80 rounded-xl">
            <button
              type="button"
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
              v-for="cat in filteredCategories"
              :key="cat.id"
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
            v-model="note"
            placeholder="Ej: Café con colegas, Uber, Mercado"
            class="w-full"
          />
        </div>

        <div v-if="errorMessage" class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 font-medium">
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
          <UButton
            color="primary"
            class="min-h-[44px] flex-1 font-bold shadow-md cursor-pointer justify-center"
            :loading="isSubmitting"
            @click="handleSubmit"
          >
            Guardar
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
