<script setup lang="ts">
import { ref } from 'vue';

import AccountCard from './AccountCard.vue';
import CreateAccountModal from './CreateAccountModal.vue';
import type { Account, AccountType } from '../../../core/entities/Account';

interface Props {
  accounts: Account[];
  isLoading: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (
    e: 'create',
    account: {
      name: string;
      type: AccountType;
      balance: number;
      currency: string;
    },
  ): void;
  (
    e: 'update',
    id: string,
    account: {
      name: string;
      type: AccountType;
      balance: number;
      currency: string;
    },
  ): void;
  (e: 'delete', id: string): void;
}>();

const isCreateModalOpen = ref(false);
const editingAccount = ref<Account | null>(null);

function handleOpenModal() {
  editingAccount.value = null;
  isCreateModalOpen.value = true;
}

function handleEditAccount(account: Account) {
  editingAccount.value = account;
  isCreateModalOpen.value = true;
}

function handleCreateAccount(payload: {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}) {
  emit('create', payload);
}

function handleUpdateAccount(
  id: string,
  payload: {
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
  },
) {
  emit('update', id, payload);
}

function handleDeleteAccount(id: string) {
  emit('delete', id);
}
</script>

<template>
  <section class="space-y-4">
    <header
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div>
        <h2
          class="text-xl font-black text-[#2B4162] dark:text-[#E0DDCF] tracking-tight"
        >
          Mis Cuentas y Billeteras
        </h2>
        <p class="text-sm text-slate-500 dark:text-[#4D7EA8]">
          Administra tus cuentas bancarias, billeteras digitales y efectivo.
        </p>
      </div>

      <UButton
        color="primary"
        icon="i-heroicons-plus-circle"
        @click="handleOpenModal"
      >
        Nueva Cuenta
      </UButton>
    </header>

    <!-- Loading Skeleton -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="h-36 rounded-xl border border-slate-200 dark:border-[#283a59] bg-slate-100 dark:bg-[#162032]/40 p-5 animate-pulse flex flex-col justify-between"
      >
        <div class="h-4 bg-slate-200 dark:bg-[#283a59]/60 rounded w-1/2" />
        <div class="h-8 bg-slate-200 dark:bg-[#283a59]/60 rounded w-3/4" />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="accounts.length === 0"
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/50 p-10 text-center space-y-3 shadow-sm"
    >
      <div
        class="rounded-full bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-[#283a59] p-3 text-[#4D7EA8]"
      >
        <UIcon name="i-heroicons-building-library" class="h-8 w-8" />
      </div>
      <div class="space-y-1">
        <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
          No tienes cuentas registradas
        </h3>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8] max-w-sm">
          Agrega tu primera cuenta o billetera para empezar a registrar
          ingresos, gastos y transferencias.
        </p>
      </div>
      <UButton
        color="primary"
        variant="subtle"
        icon="i-heroicons-plus"
        @click="handleOpenModal"
      >
        Crear primera cuenta
      </UButton>
    </div>

    <!-- Accounts Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AccountCard
        v-for="account in accounts"
        :key="account.id"
        :account="account"
        @edit="handleEditAccount"
        @delete="handleDeleteAccount"
      />
    </div>

    <!-- Create/Edit Modal -->
    <CreateAccountModal
      v-model:open="isCreateModalOpen"
      :account="editingAccount"
      @created="handleCreateAccount"
      @updated="handleUpdateAccount"
    />
  </section>
</template>
