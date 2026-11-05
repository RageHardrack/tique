import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import { useAuthStore } from './auth';
import { ApiClient } from '../../infrastructure/api/api-client';
import { TransactionTemplateService } from '../../core/services/TransactionTemplateService';
import type {
  TransactionTemplate,
  TransactionTemplateInput,
} from '../../core/entities/TransactionTemplate';

/**
 * Templates are the user's own (S1): every call carries the JWT and the API
 * derives the owner from it, so no request ever sends a `userId`.
 */
export const useTransactionTemplateStore = defineStore(
  'transactionTemplates',
  () => {
    const templates = ref<TransactionTemplate[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    /** S7 ordering for any consumer, not only the quick-add sheet. */
    const sortedTemplates = computed(() =>
      TransactionTemplateService.sortByUsage(templates.value),
    );

    async function fetchTemplates(): Promise<void> {
      const authStore = useAuthStore();
      isLoading.value = true;
      error.value = null;
      try {
        templates.value = await ApiClient.get<TransactionTemplate[]>(
          '/transaction-templates',
          authStore.accessToken,
        );
      } catch (err: unknown) {
        error.value = (err as Error).message || 'Error al cargar plantillas';
      } finally {
        isLoading.value = false;
      }
    }

    async function createTemplate(
      payload: TransactionTemplateInput,
    ): Promise<TransactionTemplate> {
      const authStore = useAuthStore();
      isLoading.value = true;
      error.value = null;
      try {
        const created = await ApiClient.post<TransactionTemplate>(
          '/transaction-templates',
          payload,
          authStore.accessToken,
        );
        templates.value.push(created);
        return created;
      } catch (err: unknown) {
        error.value = (err as Error).message || 'Error al registrar plantilla';
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    async function updateTemplate(
      id: string,
      payload: TransactionTemplateInput,
    ): Promise<TransactionTemplate> {
      const authStore = useAuthStore();
      isLoading.value = true;
      error.value = null;
      try {
        const updated = await ApiClient.put<TransactionTemplate>(
          `/transaction-templates/${id}`,
          payload,
          authStore.accessToken,
        );
        const index = templates.value.findIndex((t) => t.id === id);
        if (index !== -1) {
          templates.value[index] = updated;
        }
        return updated;
      } catch (err: unknown) {
        error.value = (err as Error).message || 'Error al actualizar plantilla';
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    async function deleteTemplate(id: string): Promise<void> {
      const authStore = useAuthStore();
      isLoading.value = true;
      error.value = null;
      try {
        await ApiClient.delete(
          `/transaction-templates/${id}`,
          authStore.accessToken,
        );
        templates.value = templates.value.filter((t) => t.id !== id);
      } catch (err: unknown) {
        error.value = (err as Error).message || 'Error al eliminar plantilla';
        throw err;
      } finally {
        isLoading.value = false;
      }
    }

    /** S7: a template counts as used only once its movement was created. */
    async function markUsed(id: string): Promise<TransactionTemplate | null> {
      const authStore = useAuthStore();
      try {
        const used = await ApiClient.post<TransactionTemplate>(
          `/transaction-templates/${id}/use`,
          {},
          authStore.accessToken,
        );
        const index = templates.value.findIndex((t) => t.id === id);
        if (index !== -1) {
          // Merge so a thin response can never erase the stored template.
          templates.value[index] = { ...templates.value[index], ...used };
        }
        return templates.value[index] ?? used;
      } catch (err: unknown) {
        error.value =
          (err as Error).message || 'Error al marcar plantilla como usada';
        return null;
      }
    }

    return {
      templates,
      isLoading,
      error,
      sortedTemplates,
      fetchTemplates,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      markUsed,
    };
  },
);
