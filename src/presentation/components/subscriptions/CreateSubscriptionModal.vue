<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { Category } from '../../../core/entities/Category';
import type { RecurrenceFrequency, Subscription } from '../../../core/entities/Subscription';
import { SUPPORTED_CURRENCIES } from '../../../core/services/CurrencyFormatter';
import type {
  Account,
  SupportedCurrency,
} from '../../../core/entities/Account';

interface Props {
  open: boolean;
  subscription?: Subscription | null;
  accounts: Account[];
  categories: Category[];
  baseCurrency: SupportedCurrency;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (
    e: 'create',
    payload: {
      name: string;
      accountId: string;
      categoryId?: string;
      amount: number;
      currency: string;
      frequency: RecurrenceFrequency;
      customIntervalDays?: number | null;
      nextDueDate: string;
    },
  ): void;
  (
    e: 'update',
    id: string,
    payload: {
      name: string;
      accountId: string;
      categoryId?: string | null;
      amount: number;
      currency: string;
      frequency: RecurrenceFrequency;
      customIntervalDays?: number | null;
      nextDueDate: string;
    },
  ): void;
}>();

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const name = ref('');
const accountId = ref('');
const categoryId = ref('');
const amount = ref<number | undefined>(undefined);
const currency = ref(props.baseCurrency);
const frequency = ref<RecurrenceFrequency>('MONTHLY');
const customIntervalDays = ref<number | undefined>(undefined);
const nextDueDate = ref('');
const errorMessage = ref('');

const expenseCategories = computed(() => {
  return props.categories.filter((c) => c.type === 'EXPENSE');
});

const accountOptions = computed(() =>
  props.accounts.map((acc) => ({
    label: `${acc.name} (${acc.currency})`,
    value: acc.id,
  })),
);

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

const frequencyOptions = [
  { label: 'Semanal (cada 7 días)', value: 'WEEKLY' },
  { label: 'Quincenal (cada 14 días)', value: 'BIWEEKLY' },
  { label: 'Mensual (cada mes)', value: 'MONTHLY' },
  { label: 'Bimestral / Bimensual (cada 2 meses)', value: 'BIMONTHLY' },
  { label: 'Trimestral (cada 3 meses)', value: 'QUARTERLY' },
  { label: 'Semestral (cada 6 meses)', value: 'SEMIANNUAL' },
  { label: 'Anual (cada año)', value: 'YEARLY' },
  { label: 'Personalizado (en días)', value: 'CUSTOM' },
];

// Set default date to today in YYYY-MM-DD
function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

watch(
  () => [props.open, props.subscription],
  ([newVal]) => {
    if (newVal) {
      if (props.subscription) {
        name.value = props.subscription.name;
        accountId.value = props.subscription.accountId;
        categoryId.value = props.subscription.categoryId || '';
        amount.value = props.subscription.amount;
        currency.value = (props.subscription.currency as SupportedCurrency) || props.baseCurrency;
        frequency.value = props.subscription.frequency;
        customIntervalDays.value = props.subscription.customIntervalDays || undefined;
        nextDueDate.value = new Date(props.subscription.nextDueDate).toISOString().slice(0, 10);
      } else {
        name.value = '';
        accountId.value = props.accounts[0]?.id || '';
        categoryId.value = expenseCategories.value[0]?.id || '';
        amount.value = undefined;
        currency.value = props.baseCurrency;
        frequency.value = 'MONTHLY';
        customIntervalDays.value = undefined;
        nextDueDate.value = getTodayDateString();
      }
      errorMessage.value = '';
    }
  },
  { immediate: true },
);

function handleSubmit() {
  errorMessage.value = '';
  if (!name.value.trim()) {
    errorMessage.value = 'El nombre de la suscripción es requerido';
    return;
  }
  if (!accountId.value) {
    errorMessage.value = 'Selecciona la cuenta de débito';
    return;
  }
  if (!amount.value || amount.value <= 0) {
    errorMessage.value = 'El monto recurrente debe ser mayor a 0';
    return;
  }
  if (frequency.value === 'CUSTOM' && (!customIntervalDays.value || customIntervalDays.value <= 0)) {
    errorMessage.value = 'Ingresa los días de intervalo para la frecuencia personalizada';
    return;
  }
  if (!nextDueDate.value) {
    errorMessage.value = 'Selecciona la próxima fecha de vencimiento';
    return;
  }

  const payloadCustomInterval =
    frequency.value === 'CUSTOM' && customIntervalDays.value
      ? Number(customIntervalDays.value)
      : null;

  if (props.subscription?.id) {
    emit('update', props.subscription.id, {
      name: name.value.trim(),
      accountId: accountId.value,
      categoryId: categoryId.value || null,
      amount: Number(amount.value),
      currency: currency.value,
      frequency: frequency.value,
      customIntervalDays: payloadCustomInterval,
      nextDueDate: new Date(nextDueDate.value).toISOString(),
    });
  } else {
    emit('create', {
      name: name.value.trim(),
      accountId: accountId.value,
      categoryId: categoryId.value || undefined,
      amount: Number(amount.value),
      currency: currency.value,
      frequency: frequency.value,
      customIntervalDays: payloadCustomInterval,
      nextDueDate: new Date(nextDueDate.value).toISOString(),
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
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B3E9B]/15 text-[#1B3E9B] dark:text-sky-400"
            >
              <UIcon name="i-heroicons-arrow-path" class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-[#f1f5f9]">
                Nueva Suscripción / Pago Fijo
              </h3>
              <p class="text-xs text-slate-500 dark:text-[#4D7EA8]">
                Controla tus cobros recurrentes y fechas de vencimiento
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
          <!-- Name -->
          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Nombre del Servicio
            </label>
            <UInput
              v-model="name"
              type="text"
              placeholder="Ej: Spotify, Netflix, Alquiler, Gym"
              required
              class="w-full"
            />
          </div>

          <!-- Account & Category -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Cuenta de Débito
              </label>
              <USelect
                v-model="accountId"
                :items="accountOptions"
                value-key="value"
                class="w-full"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Categoría (Opcional)
              </label>
              <USelect
                v-model="categoryId"
                :items="categoryOptions"
                placeholder="Sin categoría (Opcional)"
                value-key="value"
                class="w-full"
              />
            </div>
          </div>

          <!-- Amount and Currency -->
          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-2">
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Monto Recurrente
              </label>
              <UInput
                v-model="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="15.00"
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

          <!-- Frequency and Next Due Date -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Frecuencia
              </label>
              <USelect
                v-model="frequency"
                :items="frequencyOptions"
                value-key="value"
                class="w-full"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Próximo Cobro
              </label>
              <UInput
                v-model="nextDueDate"
                type="date"
                required
                class="w-full"
              />
            </div>

            <!-- Custom Interval Input -->
            <div v-if="frequency === 'CUSTOM'" class="col-span-2 space-y-1">
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Intervalo personalizado (días)
              </label>
              <UInput
                v-model.number="customIntervalDays"
                type="number"
                min="1"
                placeholder="Ej. 45"
                required
                class="w-full"
              />
              <p class="text-[11px] text-slate-400">
                Se programará el siguiente pago cada {{ customIntervalDays || 'X' }} días tras registrar el cobro.
              </p>
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
              Guardar Suscripción
            </UButton>
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>
