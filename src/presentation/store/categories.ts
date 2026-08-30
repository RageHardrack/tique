import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import { ApiClient } from '../../infrastructure/api/api-client';
import type { BudgetGroup, Category, CategoryType } from '../../core/entities/Category';
import type { TaxCategory, TaxDeductionType } from '../../core/entities/Tax';

export interface CreateCategoryInput {
  userId: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  parentId?: string;
  taxCategory?: TaxCategory;
  taxDeductionType?: TaxDeductionType;
  budgetGroup?: BudgetGroup;
}

export const useCategoryStore = defineStore('categories', () => {
  const categories = ref<Category[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const incomeCategories = computed(() => {
    return categories.value.filter((cat) => cat.type === 'INCOME');
  });

  const expenseCategories = computed(() => {
    return categories.value.filter((cat) => cat.type === 'EXPENSE');
  });

  async function fetchCategories(userId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      categories.value = await ApiClient.get<Category[]>(
        `/categories?userId=${userId}`,
      );
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      isLoading.value = false;
    }
  }

  async function createCategory(input: CreateCategoryInput) {
    isLoading.value = true;
    error.value = null;
    try {
      const newCat = await ApiClient.post<Category>('/categories', input);
      categories.value.push(newCat);
      return newCat;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateCategory(
    id: string,
    payload: Partial<Omit<CreateCategoryInput, 'userId'>>,
  ) {
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await ApiClient.put<Category>(
        `/categories/${id}`,
        payload,
      );
      const index = categories.value.findIndex((cat) => cat.id === id);
      if (index !== -1) {
        categories.value[index] = updated;
      }
      return updated;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteCategory(id: string) {
    isLoading.value = true;
    error.value = null;
    try {
      await ApiClient.delete<{ success: boolean }>(`/categories/${id}`);
      categories.value = categories.value.filter((cat) => cat.id !== id);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    categories,
    isLoading,
    error,
    incomeCategories,
    expenseCategories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
});
