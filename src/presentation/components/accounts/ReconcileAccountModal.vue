<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { Account } from '../../../core/entities/Account';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';

interface Props {
  account?: Account | null;
}

const props = defineProps<Props>();

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  (e: 'reconciled', payload: { accountId: string; realBalance: number; note?: string }): void;
}>();

const form = reactive({
  realBalance: 0,
  note: '',
});

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const registeredBalance = computed(() => (props.account ? props.account.balance : 0));
const discrepancy = computed(() => {
  const diff = Number(form.realBalance || 0) - registeredBalance.value;
  return Math.round(diff * 100) / 100;
});

function formatBalance(amount: number, currency?: string): string {
  return CurrencyFormatter.format(amount, currency || 'USD');
}

watch(
  () => [open.value, props.account],
  ([isOpenVal]) => {
    if (isOpenVal && props.account) {
      form.realBalance = props.account.balance || 0;
      form.note = '';
      errorMessage.value = null;
    }
  },
  { immediate: true },
);

function handleClose() {
  open.value = false;
}

function handleSubmit() {
  if (!props.account) return;

  emit('reconciled', {
    accountId: props.account.id,
    realBalance: Number(form.realBalance),
    note: form.note.trim() || undefined,
  });

  open.value = false;
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="account ? `Conciliación — ${account.name}` : 'Conciliación de Saldo'"
    :dismissible="false"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Comparative Balance Cards -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Saldo Registrado</span>
            <div class="text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {{ formatBalance(registeredBalance, account?.currency) }}
            </div>
          </div>

          <div
            class="p-3 rounded-xl border transition-colors"
            :class="[
              discrepancy === 0
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30'
                : discrepancy > 0
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/30'
                  : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500/30',
            ]"
          >
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Discrepancia</span>
            <div
              class="text-base font-black mt-0.5"
              :class="[
                discrepancy === 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : discrepancy > 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-rose-600 dark:text-rose-400',
              ]"
            >
              {{ discrepancy > 0 ? '+' : '' }}{{ formatBalance(discrepancy, account?.currency) }}
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Saldo Real en tu Banco / Billetera
          </label>
          <UInput
            v-model.number="form.realBalance"
            type="number"
            step="0.01"
            required
            class="w-full text-lg font-bold"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Motivo o Detalle del Ajuste (Opcional)
          </label>
          <UInput
            v-model="form.note"
            placeholder="Ej: Intereses bancarios, comisiones por mantenimiento"
            class="w-full"
          />
        </div>

        <div v-if="discrepancy !== 0" class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
          <span class="font-bold">Aviso:</span> Se creará automáticamente una transacción de
          <strong>{{ discrepancy > 0 ? 'Ingreso' : 'Gasto' }}</strong> por
          <strong>{{ formatBalance(Math.abs(discrepancy), account?.currency) }}</strong>
          para cuadrar el saldo exacto en la cuenta.
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" class="min-h-[44px]" @click="handleClose">
          Cancelar
        </UButton>
        <UButton color="primary" class="min-h-[44px] font-bold" :loading="isSubmitting" @click="handleSubmit">
          Aplicar Ajuste
        </UButton>
      </div>
    </template>
  </UModal>
</template>
