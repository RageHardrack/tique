<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { Budget } from '../../../core/entities/Budget';
import type { Category } from '../../../core/entities/Category';
import type { SupportedCurrency } from '../../../core/entities/Account';
import { SUPPORTED_CURRENCIES } from '../../../core/services/CurrencyFormatter';

interface Props {
  open: boolean;
  budget?: Budget | null;
  categories: Category[];
  baseCurrency: SupportedCurrency;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (
    e: 'create',
    payload: {
      categoryId: string;
      amount: number;
      currency: string;
      period: string;
    },
  ): void;
  (
    e: 'update',
    id: string,
    payload: {
      amount: number;
      currency: string;
      period: string;
    },
  ): void;
}>();

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const categoryId = ref('');
const amount = ref<number | undefined>(undefined);
const currency = ref(props.baseCurrency);
const period = ref('MONTHLY');
const errorMessage = ref('');

const expenseCategories = computed(() => {
  return props.categories.filter((c) => c.type === 'EXPENSE');
});

const categoryOptions = computed(() =>
  expenseCategories.value.map((cat) => ({
    label: cat.name,
    value: cat.id,
  })),
);

const currencyOptions = computed(() =>
  SUPPORTED_CURRENCIES.map((c) => ({
    label: c.code,
    value: c.code,
  })),
);

watch(
  () => [props.open, props.budget],
  ([newVal]) => {
    if (newVal) {
      if (props.budget) {
        categoryId.value = props.budget.categoryId;
        amount.value = props.budget.amount;
        currency.value = (props.budget.currency as SupportedCurrency) || props.baseCurrency;
        period.value = props.budget.period || 'MONTHLY';
      } else {
        categoryId.value = expenseCategories.value[0]?.id || '';
        amount.value = undefined;
        currency.value = props.baseCurrency;
        period.value = 'MONTHLY';
      }
      errorMessage.value = '';
    }
  },
  { immediate: true },
);

function handleSubmit() {
  errorMessage.value = '';
  if (!categoryId.value) {
    errorMessage.value = 'Selecciona una categoría de gasto';
    return;
  }
  if (!amount.value || amount.value <= 0) {
    errorMessage.value = 'El límite mensual debe ser mayor a 0';
    return;
  }

  if (props.budget?.id) {
    emit('update', props.budget.id, {
      amount: Number(amount.value),
      currency: currency.value,
      period: period.value,
    });
  } else {
    emit('create', {
      categoryId: categoryId.value,
      amount: Number(amount.value),
      currency: currency.value,
      period: period.value,
    });
  }

  isOpen.value = false;
}
</script>

<template>
  <UModal v-model:open="isOpen" :dismissible="false">
    <template #content>
      <div
        class="p-6 bg-white dark:bg-[#162032] text-slate-900 dark:text-[#f1f5f9] rounded-2xl border border-slate-200 dark:border-[#283a59]"
      >
        <header
          class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#283a59]/60"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#D4AF37]"
            >
              <UIcon name="i-heroicons-banknotes" class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-[#f1f5f9]">
                Configurar Presupuesto Mensual
              </h3>
              <p class="text-xs text-slate-500 dark:text-[#4D7EA8]">
                Establece un límite de gasto para controlar tu presupuesto
              </p>
            </div>
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="xs"
            @click="isOpen = false"
          />
        </header>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Category Select -->
          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Categoría de Gasto
            </label>
            <USelect
              v-model="categoryId"
              :items="categoryOptions"
              value-key="value"
              class="w-full"
            />
          </div>

          <!-- Amount and Currency -->
          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-2">
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Límite Mensual
              </label>
              <UInput
                v-model="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="500.00"
                required
                class="w-full"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Moneda
              </label>
              <USelect
                v-model="currency"
                :items="currencyOptions"
                value-key="value"
                class="w-full"
              />
            </div>
          </div>

          <div v-if="errorMessage" class="text-xs font-medium text-rose-500">
            {{ errorMessage }}
          </div>

          <!-- Actions -->
          <div
            class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#283a59]/60"
          >
            <UButton color="neutral" variant="ghost" @click="isOpen = false">
              Cancelar
            </UButton>
            <UButton type="submit" color="primary" icon="i-heroicons-check">
              Guardar Presupuesto
            </UButton>
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>
