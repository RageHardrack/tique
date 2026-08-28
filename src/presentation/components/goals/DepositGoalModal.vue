<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { SavingsGoal } from '../../../core/entities/Goal';
import type { Account } from '../../../core/entities/Account';

interface Props {
  open: boolean;
  goal: SavingsGoal | null;
  accounts: Account[];
  mode: 'deposit' | 'withdraw';
  formatFn: (amount: number, currency: string) => string;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  goal: null,
  accounts: () => [],
  mode: 'deposit',
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'confirm', payload: { goalId: string; amount: number; accountId?: string; mode: 'deposit' | 'withdraw' }): void;
}>();

const title = computed(() =>
  props.mode === 'deposit'
    ? `Abonar a ${props.goal?.name || 'Meta'}`
    : `Retirar de ${props.goal?.name || 'Meta'}`,
);

const form = reactive({
  amount: 50,
  accountId: '',
});

const errorMessage = ref<string | null>(null);

const accountOptions = computed(() => [
  { label: 'Sin vincular a cuenta bancaria', value: '' },
  ...props.accounts.map((a) => ({
    label: `${a.name} (${a.currency} - Saldo: ${props.formatFn(a.balance, a.currency)})`,
    value: a.id,
  })),
]);

function resetForm() {
  form.amount = 50;
  form.accountId = props.accounts.length > 0 ? props.accounts[0].id : '';
  errorMessage.value = null;
}

watch(
  () => [props.open, props.goal],
  ([isOpen]) => {
    if (isOpen) {
      resetForm();
    }
  },
  { immediate: true },
);

function handleClose() {
  resetForm();
  emit('update:open', false);
}

function handleSubmit() {
  if (form.amount <= 0) {
    errorMessage.value = 'El monto debe ser mayor a 0.';
    return;
  }

  if (props.mode === 'withdraw' && props.goal && form.amount > props.goal.currentAmount) {
    errorMessage.value = `No puedes retirar más de lo ahorrado (${props.formatFn(props.goal.currentAmount, props.goal.currency)}).`;
    return;
  }

  if (!props.goal) return;

  emit('confirm', {
    goalId: props.goal.id,
    amount: Number(form.amount),
    accountId: form.accountId || undefined,
    mode: props.mode,
  });

  handleClose();
}
</script>

<template>
  <UModal :open="open" :dismissible="false" @update:open="emit('update:open', $event)">
    <template #content>
      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg text-white"
              :class="[mode === 'deposit' ? 'bg-emerald-500' : 'bg-rose-500']"
            >
              <UIcon
                :name="mode === 'deposit' ? 'i-heroicons-plus-circle' : 'i-heroicons-minus-circle'"
                class="w-5 h-5"
              />
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              {{ title }}
            </h3>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-x-mark"
            aria-label="Cerrar"
            @click="handleClose"
          />
        </div>

        <div v-if="goal" class="p-3 rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 flex justify-between text-xs">
          <span class="text-slate-500 dark:text-slate-400">Progreso actual:</span>
          <span class="font-bold text-slate-900 dark:text-white">
            {{ formatFn(goal.currentAmount, goal.currency) }} / {{ formatFn(goal.targetAmount, goal.currency) }}
          </span>
        </div>

        <div v-if="errorMessage" class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 font-medium">
          {{ errorMessage }}
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Monto a {{ mode === 'deposit' ? 'Abonar' : 'Retirar' }}
            </label>
            <UInput
              v-model.number="form.amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cuenta Bancaria (Opcional para debitar/acreditar automáticamente)
            </label>
            <USelect
              v-model="form.accountId"
              :items="accountOptions"
              class="w-full"
            />
          </div>

          <div class="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <UButton color="neutral" variant="ghost" @click="handleClose">
              Cancelar
            </UButton>
            <UButton :color="mode === 'deposit' ? 'primary' : 'error'" type="submit">
              {{ mode === 'deposit' ? 'Confirmar Abono' : 'Confirmar Retiro' }}
            </UButton>
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>
