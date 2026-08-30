<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

import type { Account, AccountType } from '../../../core/entities/Account';
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from '../../../core/services/CurrencyFormatter';

interface Props {
  account?: Account | null;
}

const props = defineProps<Props>();

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  (
    e: 'created',
    account: {
      name: string;
      type: AccountType;
      balance: number;
      currency: string;
    },
  ): void;
  (
    e: 'updated',
    id: string,
    account: {
      name: string;
      type: AccountType;
      balance: number;
      currency: string;
    },
  ): void;
}>();

const form = reactive<{
  name: string;
  type: AccountType;
  balance: number;
  currency: SupportedCurrency;
  creditLimit?: number;
  statementClosingDay?: number;
  paymentDueDay?: number;
  monthlyInterestRate?: number;
}>({
  name: '',
  type: 'CHECKING',
  balance: 0,
  currency: 'USD',
  creditLimit: 1000,
  statementClosingDay: 15,
  paymentDueDay: 5,
  monthlyInterestRate: 4.5,
});

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

function resetForm() {
  form.name = '';
  form.type = 'CHECKING';
  form.balance = 0;
  form.currency = 'USD';
  form.creditLimit = 1000;
  form.statementClosingDay = 15;
  form.paymentDueDay = 5;
  form.monthlyInterestRate = 4.5;
  errorMessage.value = null;
}

const accountTypeOptions: { label: string; value: AccountType }[] = [
  { label: 'Cuenta Corriente', value: 'CHECKING' },
  { label: 'Caja de Ahorros', value: 'SAVINGS' },
  { label: 'Billetera Digital / Crypto (Wallet)', value: 'WALLET' },
  { label: 'Tarjeta de Crédito', value: 'CREDIT_CARD' },
  { label: 'Efectivo', value: 'CASH' },
  { label: 'Inversión', value: 'INVESTMENT' },
];

const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
  label: `${c.code} - ${c.name} (${c.symbol})`,
  value: c.code as SupportedCurrency,
}));

watch(
  () => [open.value, props.account],
  ([isOpen]) => {
    if (isOpen) {
      if (props.account) {
        form.name = props.account.name;
        form.type = props.account.type;
        form.balance = props.account.balance || 0;
        form.currency = (props.account.currency as SupportedCurrency) || 'USD';
        form.creditLimit = props.account.creditLimit || 1000;
        form.statementClosingDay = props.account.statementClosingDay || 15;
        form.paymentDueDay = props.account.paymentDueDay || 5;
        form.monthlyInterestRate = props.account.monthlyInterestRate || 4.5;
      } else {
        resetForm();
      }
    }
  },
  { immediate: true },
);

function handleClose() {
  resetForm();
  open.value = false;
}

function handleSubmit() {
  if (!form.name.trim()) {
    errorMessage.value = 'El nombre de la cuenta es obligatorio.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    const isCreditCard = form.type === 'CREDIT_CARD';
    const payload = {
      name: form.name.trim(),
      type: form.type,
      balance: Number(form.balance) || 0,
      currency: form.currency,
      creditLimit: isCreditCard ? Number(form.creditLimit) || 0 : undefined,
      statementClosingDay: isCreditCard ? Number(form.statementClosingDay) || 15 : undefined,
      paymentDueDay: isCreditCard ? Number(form.paymentDueDay) || 5 : undefined,
      monthlyInterestRate: isCreditCard ? Number(form.monthlyInterestRate) || 0 : undefined,
    };

    if (props.account?.id) {
      emit('updated', props.account.id, payload as any);
    } else {
      emit('created', payload as any);
    }
    resetForm();
    open.value = false;
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Error al guardar la cuenta.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="account ? 'Editar Cuenta o Billetera' : 'Nueva Cuenta o Billetera'"
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

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-200">
            Nombre de la cuenta <span class="text-red-400">*</span>
          </label>
          <UInput
            v-model="form.name"
            placeholder="Ej: Banco Galicia, Billetera Crypto, Efectivo"
            class="w-full"
            required
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-200"
              >Tipo de cuenta</label
            >
            <USelect
              v-model="form.type"
              :items="accountTypeOptions"
              value-key="value"
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-200">Moneda</label>
            <USelect
              v-model="form.currency"
              :items="currencyOptions"
              value-key="value"
              :disabled="!!props.account"
              class="w-full"
            />
            <p v-if="props.account" class="text-[11px] text-slate-400">
              La moneda es inmutable para proteger la integridad de los movimientos históricos.
            </p>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-200">
            {{ form.type === 'CREDIT_CARD' ? 'Deuda actual consumida' : 'Saldo inicial' }}
          </label>
          <UInput
            v-model.number="form.balance"
            type="number"
            step="0.01"
            placeholder="0.00"
            class="w-full"
          />
        </div>

        <!-- Credit Card Specific Settings -->
        <div
          v-if="form.type === 'CREDIT_CARD'"
          class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3"
        >
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-amber-500" />
            <h4 class="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Parámetros de Tarjeta de Crédito
            </h4>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-300">Línea de Crédito Total *</label>
              <UInput
                v-model.number="form.creditLimit"
                type="number"
                step="0.01"
                min="0"
                placeholder="1000.00"
                class="w-full"
                required
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-300">Tasa Interés Mensual (%)</label>
              <UInput
                v-model.number="form.monthlyInterestRate"
                type="number"
                step="0.1"
                min="0"
                placeholder="4.5"
                class="w-full"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-300">Día de Corte (1-31)</label>
              <UInput
                v-model.number="form.statementClosingDay"
                type="number"
                min="1"
                max="31"
                placeholder="15"
                class="w-full"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-300">Día Límite de Pago (1-31)</label>
              <UInput
                v-model.number="form.paymentDueDay"
                type="number"
                min="1"
                max="31"
                placeholder="5"
                class="w-full"
              />
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
          Guardar Cuenta
        </UButton>
      </div>
    </template>
  </UModal>
</template>
