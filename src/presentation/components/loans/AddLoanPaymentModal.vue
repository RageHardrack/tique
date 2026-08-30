<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { Loan } from '../../../core/entities/Loan';
import type { Account } from '../../../core/entities/Account';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';

interface Props {
  loan?: Loan | null;
  accounts?: Account[];
}

const props = withDefaults(defineProps<Props>(), {
  loan: null,
  accounts: () => [],
});

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  (
    e: 'paymentAdded',
    loanId: string,
    payload: {
      amount: number;
      date?: string;
      accountId?: string;
      notes?: string;
    },
  ): void;
}>();

const form = reactive({
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  accountId: '',
  notes: '',
});

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const accountOptions = computed(() =>
  (props.accounts || []).map((acc) => ({
    label: `${acc.name} (${acc.currency})`,
    value: acc.id,
  })),
);

const remainingBefore = computed(() => (props.loan ? Number(props.loan.remainingAmount) : 0));
const remainingAfter = computed(() => {
  const left = remainingBefore.value - (Number(form.amount) || 0);
  return Math.max(0, Math.round(left * 100) / 100);
});

function format(amount: number, currency?: string) {
  return CurrencyFormatter.format(amount, currency || 'USD');
}

watch(
  () => [open.value, props.loan, props.accounts],
  ([isOpenVal]) => {
    if (isOpenVal && props.loan) {
      form.amount = props.loan.remainingAmount || 0;
      form.date = new Date().toISOString().split('T')[0];
      const matchAcc = (props.accounts || []).find(
        (a) => a.currency === props.loan?.currency,
      );
      form.accountId =
        matchAcc?.id || (props.accounts && props.accounts.length > 0 ? props.accounts[0].id : '');
      form.notes = '';
      errorMessage.value = null;
    }
  },
  { immediate: true },
);

function handleClose() {
  open.value = false;
}

function handleSubmit() {
  if (!props.loan) return;
  if (!form.amount || form.amount <= 0) {
    errorMessage.value = 'El monto del abono debe ser mayor a 0.';
    return;
  }
  if (form.amount > props.loan.remainingAmount + 0.01) {
    errorMessage.value = `El abono no puede superar el saldo pendiente (${format(props.loan.remainingAmount, props.loan.currency)}).`;
    return;
  }
  if (!form.accountId) {
    errorMessage.value = 'Debes seleccionar una cuenta bancaria o billetera para procesar el abono.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    emit('paymentAdded', props.loan.id, {
      amount: Number(form.amount),
      date: form.date ? new Date(form.date).toISOString() : undefined,
      accountId: form.accountId,
      notes: form.notes.trim() || undefined,
    });
    open.value = false;
  } catch (err: any) {
    errorMessage.value = err.message || 'Error al registrar el abono.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="loan ? `Registrar Abono — ${loan.personName}` : 'Registrar Abono'"
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

        <!-- Comparative Cards (Saldo actual vs Saldo tras abono) -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Saldo Pendiente</span>
            <div class="text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {{ format(remainingBefore, loan?.currency) }}
            </div>
          </div>

          <div
            class="p-3 rounded-xl border transition-colors"
            :class="[
              remainingAfter === 0
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30'
                : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/30',
            ]"
          >
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nuevo Saldo Restante</span>
            <div
              class="text-base font-black mt-0.5"
              :class="[
                remainingAfter === 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-blue-600 dark:text-blue-400',
              ]"
            >
              {{ format(remainingAfter, loan?.currency) }}
            </div>
          </div>
        </div>

        <!-- Monto del Abono -->
        <div class="space-y-1">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Monto a Abonar ({{ loan?.currency }}) <span class="text-rose-500">*</span>
          </label>
          <UInput
            v-model.number="form.amount"
            type="number"
            step="0.01"
            required
            class="w-full text-lg font-bold"
          />
        </div>

        <!-- Fecha del Abono -->
        <div class="space-y-1">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Fecha del Abono
          </label>
          <UInput
            v-model="form.date"
            type="date"
            class="w-full"
          />
        </div>

        <!-- Cuenta Bancaria para Conciliar (Requerida) -->
        <div v-if="accounts && accounts.length > 0" class="space-y-1">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {{ loan?.type === 'LENT' ? 'Cuenta de Depósito' : 'Cuenta de Pago / Débito' }} <span class="text-red-400">*</span>
          </label>
          <USelect
            v-model="form.accountId"
            :items="accountOptions"
            placeholder="Seleccionar cuenta..."
            value-key="value"
            class="w-full"
            required
          />
          <p class="text-[11px] text-slate-400">
            {{ loan?.type === 'LENT' ? 'Sumará el abono al saldo de tu cuenta.' : 'Descontará el abono del saldo de tu cuenta.' }}
          </p>
        </div>

        <!-- Notas / Referencia -->
        <div class="space-y-1">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Notas o Referencia de Pago (Opcional)
          </label>
          <UInput
            v-model="form.notes"
            placeholder="Ej: Transferencia Yape / Plin, efectivo entregado"
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
          Aplicar Abono
        </UButton>
      </div>
    </template>
  </UModal>
</template>
