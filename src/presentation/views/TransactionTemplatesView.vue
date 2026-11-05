<script setup lang="ts">
import { onMounted } from 'vue';

import { useAuthStore } from '../store/auth';
import AppLayout from '../layouts/AppLayout.vue';
import { useAccountStore } from '../store/accounts';
import { useConfirm } from '../composables/useConfirm';
import { useCategoryStore } from '../store/categories';
import { useTransactionTemplateStore } from '../store/transaction-templates';
import type { TransactionTemplateInput } from '../../core/entities/TransactionTemplate';
import TransactionTemplatesSection from '../components/transaction-templates/TransactionTemplatesSection.vue';

const authStore = useAuthStore();
const accountStore = useAccountStore();
const categoryStore = useCategoryStore();
const templateStore = useTransactionTemplateStore();
const { confirm: confirmDialog } = useConfirm();

onMounted(async () => {
  if (!authStore.user?.id) return;

  await Promise.all([
    accountStore.fetchAccounts(authStore.user.id),
    categoryStore.fetchCategories(authStore.user.id),
    templateStore.fetchTemplates(),
  ]);
});

async function handleCreate(payload: TransactionTemplateInput) {
  await templateStore.createTemplate(payload);
}

async function handleUpdate(id: string, payload: TransactionTemplateInput) {
  await templateStore.updateTemplate(id, payload);
}

async function handleDelete(id: string) {
  const confirmed = await confirmDialog({
    title: 'Eliminar plantilla',
    message:
      '¿Seguro que quieres eliminar esta plantilla? Tus movimientos registrados no se modifican.',
    confirmText: 'Eliminar',
    variant: 'danger',
  });

  if (confirmed) {
    await templateStore.deleteTemplate(id);
  }
}
</script>

<template>
  <AppLayout
    title="Plantillas"
    subtitle="Movimientos pre-hechos para registrar un gasto, ingreso o transferencia en un toque."
  >
    <div class="space-y-6">
      <TransactionTemplatesSection
        :templates="templateStore.sortedTemplates"
        :accounts="accountStore.accounts"
        :categories="categoryStore.categories"
        :is-loading="templateStore.isLoading"
        @create="handleCreate"
        @update="handleUpdate"
        @delete="handleDelete"
      />

      <p
        v-if="templateStore.error"
        role="alert"
        class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 font-medium"
      >
        {{ templateStore.error }}
      </p>
    </div>
  </AppLayout>
</template>
