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
}>({
  name: '',
  type: 'CHECKING',
  balance: 0,
  currency: 'USD',
});

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

function resetForm() {
  form.name = '';
  form.type = 'CHECKING';
  form.balance = 0;
  form.currency = 'USD';
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
    if (props.account?.id) {
      emit('updated', props.account.id, {
        name: form.name.trim(),
        type: form.type,
        balance: Number(form.balance) || 0,
        currency: form.currency,
      });
    } else {
      emit('created', {
        name: form.name.trim(),
        type: form.type,
        balance: Number(form.balance) || 0,
        currency: form.currency,
      });
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
          <label class="text-sm font-medium text-slate-200"
            >Saldo inicial</label
          >
          <UInput
            v-model.number="form.balance"
            type="number"
            step="0.01"
            placeholder="0.00"
            class="w-full"
          />
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
