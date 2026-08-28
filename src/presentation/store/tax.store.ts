import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TaxDeductibleItem, TaxProfile, TaxProjectionResult } from '../../core/entities/Tax';
import { TaxApiClient } from '../../infrastructure/api/TaxApiClient';
import { useAuthStore } from './auth';

export const useTaxStore = defineStore('tax', () => {
  const profile = ref<TaxProfile>({
    taxProfileEnabled: false,
    taxCountry: 'PE',
    taxRuc: null,
  });

  const projection = ref<TaxProjectionResult | null>(null);
  const deductibles = ref<TaxDeductibleItem[]>([]);
  const selectedYear = ref<number>(new Date().getFullYear());
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchProfile(userId: string) {
    const authStore = useAuthStore();
    try {
      profile.value = await TaxApiClient.getProfile(userId, authStore.accessToken);
    } catch (err: any) {
      error.value = err.message || 'Error al obtener perfil tributario';
    }
  }

  async function updateProfile(userId: string, payload: { taxProfileEnabled: boolean; taxCountry?: string; taxRuc?: string }) {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      profile.value = await TaxApiClient.updateProfile(userId, payload, authStore.accessToken);
      if (profile.value.taxProfileEnabled) {
        await fetchProjection(userId, selectedYear.value);
        await fetchDeductibles(userId, selectedYear.value);
      }
      return profile.value;
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar perfil tributario';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchProjection(userId: string, year?: number) {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;
    try {
      const yr = year || selectedYear.value;
      projection.value = await TaxApiClient.getProjection(userId, yr, authStore.accessToken);
    } catch (err: any) {
      error.value = err.message || 'Error al calcular proyección tributaria';
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchDeductibles(userId: string, year?: number) {
    const authStore = useAuthStore();
    try {
      const yr = year || selectedYear.value;
      deductibles.value = await TaxApiClient.getDeductibles(userId, yr, authStore.accessToken);
    } catch (err: any) {
      error.value = err.message || 'Error al obtener gastos deducibles';
    }
  }

  async function changeYear(userId: string, year: number) {
    selectedYear.value = year;
    await fetchProjection(userId, year);
    await fetchDeductibles(userId, year);
  }

  return {
    profile,
    projection,
    deductibles,
    selectedYear,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    fetchProjection,
    fetchDeductibles,
    changeYear,
  };
});
