<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import type { Loan, LoanType } from '../../../core/entities/Loan';
import type { Account } from '../../../core/entities/Account';
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from '../../../core/services/CurrencyFormatter';

interface Props {
  loan?: Loan | null;
  accounts?: Account[];
  baseCurrency?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loan: null,
  accounts: () => [],
  baseCurrency: 'USD',
});

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  (
    e: 'created',
    payload: {
      personName: string;
      type: LoanType;
      amount: number;
      currency: string;
      dueDate?: string;
      notes?: string;
      initialAccountId?: string;
    },
  ): void;
  (
    e: 'updated',
    id: string,
    payload: {
      personName: string;
      amount: number;
      currency: string;
      dueDate?: string;
      notes?: string;
    },
  ): void;
}>();

const form = reactive({
  personName: '',
  type: 'LENT' as LoanType,
  amount: undefined as number | undefined,
  currency: 'USD' as SupportedCurrency,
  dueDate: '',
  notes: '',
  initialAccountId: '',
});

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const currencyOptions = computed(() =>
  SUPPORTED_CURRENCIES.map((c) => ({
    label: `${c.code} (${c.symbol})`,
    value: c.code as SupportedCurrency,
  })),
);

const accountOptions = computed(() =>
  (props.accounts || []).map((acc) => ({
    label: `${acc.name} (${acc.currency})`,
    value: acc.id,
  })),
);

function resetForm() {
  form.personName = '';
  form.type = 'LENT';
  form.amount = undefined;
  form.currency = (props.baseCurrency as SupportedCurrency) || 'USD';
  form.dueDate = '';
  form.notes = '';
  form.initialAccountId = '';
  errorMessage.value = null;
}

watch(
  () => [open.value, props.loan],
  ([isOpenVal]) => {
    if (isOpenVal) {
      if (props.loan) {
        form.personName = props.loan.personName;
        form.type = props.loan.type;
        form.amount = props.loan.amount;
        form.currency = (props.loan.currency as SupportedCurrency) || 'USD';
        form.dueDate = props.loan.dueDate ? props.loan.dueDate.split('T')[0] : '';
        form.notes = props.loan.notes || '';
        form.initialAccountId = '';
      } else {
        resetForm();
      }
    }
  },
  { immediate: true },
);

function handleClose() {
  open.value = false;
}

function handleSubmit() {
  if (!form.personName.trim()) {
    errorMessage.value = 'El nombre de la persona o contacto es obligatorio.';
    return;
  }
  const numericAmount = Number(form.amount);
  if (!numericAmount || numericAmount <= 0) {
    errorMessage.value = 'El monto debe ser mayor a 0.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    if (props.loan) {
      emit('updated', props.loan.id, {
        personName: form.personName.trim(),
        amount: numericAmount,
        currency: form.currency,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        notes: form.notes.trim() || undefined,
      });
    } else {
      emit('created', {
        personName: form.personName.trim(),
        type: form.type,
        amount: numericAmount,
        currency: form.currency,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        notes: form.notes.trim() || undefined,
        initialAccountId: form.initialAccountId || undefined,
      });
    }
    open.value = false;
  } catch (err: any) {
    errorMessage.value = err.message || 'Error al guardar el préstamo.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="loan ? 'Editar Préstamo / Deuda' : 'Nuevo Préstamo o Deuda'"
    :dismissible="false"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div
          v-if="errorMessage"
          class="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-600 dark:text-red-400 font-semibold"
        >
          {{ errorMessage }}
        </div>

        <!-- Tipo de Préstamo (Lent vs Borrowed) -->
        <div v-if="!loan" class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            ¿De qué tipo de préstamo se trata?
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer min-h-[54px]"
              :class="[
                form.type === 'LENT'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 dark:bg-[#0f1523] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400',
              ]"
              @click="form.type = 'LENT'"
            >
              <span class="text-sm font-black">Presté Dinero</span>
              <span class="text-[10px] opacity-75">Me deben a mí</span>
            </button>

            <button
              type="button"
              class="flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer min-h-[54px]"
              :class="[
                form.type === 'BORROWED'
                  ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20'
                  : 'bg-slate-50 dark:bg-[#0f1523] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400',
              ]"
              @click="form.type = 'BORROWED'"
            >
              <span class="text-sm font-black">Me Prestaron Dinero</span>
              <span class="text-[10px] opacity-75">Yo debo</span>
            </button>
          </div>
        </div>

        <!-- Nombre de la Persona / Contacto -->
        <div class="space-y-1">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Persona, Amigo o Entidad <span class="text-rose-500">*</span>
          </label>
          <UInput
            v-model="form.personName"
            placeholder="Ej: Carlos Gómez, Tía María, Banco Santander"
            required
            class="w-full"
          />
        </div>

        <!-- Monto y Moneda -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Monto Total <span class="text-rose-500">*</span>
            </label>
            <UInput
              v-model.number="form.amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
              class="w-full text-base font-bold"
            />
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Moneda
            </label>
            <USelect
              v-model="form.currency"
              :items="currencyOptions"
              value-key="value"
              class="w-full"
            />
          </div>
        </div>

        <!-- Fecha Límite / Vencimiento -->
        <div class="space-y-1">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Fecha Pactada de Pago (Opcional)
          </label>
          <UInput
            v-model="form.dueDate"
            type="date"
            class="w-full"
          />
        </div>

        <!-- Cuenta Bancaria Inicial (Opcional al crear) -->
        <div v-if="!loan && accounts && accounts.length > 0" class="space-y-1">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Impactar en Cuenta Bancaria (Opcional)
          </label>
          <USelect
            v-model="form.initialAccountId"
            :items="accountOptions"
            placeholder="No impactar saldo (Solo registrar recordatorio)"
            value-key="value"
            class="w-full"
          />
          <p class="text-[11px] text-slate-400">
            {{ form.type === 'LENT' ? 'Descontará el monto del saldo de la cuenta elegida.' : 'Sumará el monto al saldo de la cuenta elegida.' }}
          </p>
        </div>

        <!-- Notas / Comentarios -->
        <div class="space-y-1">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Notas o Motivo (Opcional)
          </label>
          <UInput
            v-model="form.notes"
            placeholder="Ej: Para compra de insumos, transferencia interbancaria"
            class="w-full"
          />
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          color="neutral"
          variant="ghost"
          class="min-h-[44px]"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Cancelar
        </UButton>
        <UButton
          color="primary"
          class="min-h-[44px] font-bold"
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          {{ loan ? 'Guardar Cambios' : 'Registrar Préstamo' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
