<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useAuthStore } from '../store/auth';
import AppLayout from '../layouts/AppLayout.vue';
import { useCategoryStore } from '../store/categories';
import { useTransactionStore } from '../store/transactions';
import { useTaxStore } from '../store/tax.store';
import type { BudgetGroup, Category, CategoryType } from '../../core/entities/Category';
import type { TaxCategory, TaxDeductionType } from '../../core/entities/Tax';
import { useConfirm } from '../composables/useConfirm';
import CreateCategoryModal from '../components/categories/CreateCategoryModal.vue';

const authStore = useAuthStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();
const taxStore = useTaxStore();
const { confirm: confirmDialog } = useConfirm();

const activeTab = ref<'EXPENSE' | 'INCOME'>('EXPENSE');
const isCreateModalOpen = ref(false);
const editingCategory = ref<Category | null>(null);
const searchTerm = ref('');

onMounted(async () => {
  if (authStore.user?.id) {
    await Promise.all([
      categoryStore.fetchCategories(authStore.user.id),
      transactionStore.fetchTransactions(authStore.user.id),
      taxStore.fetchProfile(authStore.user.id),
    ]);
  }
});

const filteredCategories = computed(() => {
  const list = categoryStore.categories.filter(
    (c) => c.type === activeTab.value,
  );
  if (!searchTerm.value.trim()) return list;

  const q = searchTerm.value.toLowerCase();
  return list.filter((c) => c.name.toLowerCase().includes(q));
});

const expenseCount = computed(() => {
  return categoryStore.categories.filter((c) => c.type === 'EXPENSE').length;
});

const incomeCount = computed(() => {
  return categoryStore.categories.filter((c) => c.type === 'INCOME').length;
});

// Category stats (count of transactions per category)
const transactionCountsByCategoryId = computed(() => {
  const map: Record<string, number> = {};
  transactionStore.transactions.forEach((tx) => {
    if (tx.categoryId) {
      map[tx.categoryId] = (map[tx.categoryId] || 0) + 1;
    }
  });
  return map;
});

function openCreateModal() {
  editingCategory.value = null;
  isCreateModalOpen.value = true;
}

function openEditModal(category: Category) {
  editingCategory.value = category;
  isCreateModalOpen.value = true;
}

async function handleCreate(payload: {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  parentId?: string;
  taxCategory?: TaxCategory;
  taxDeductionType?: TaxDeductionType;
  budgetGroup?: BudgetGroup;
}) {
  if (!authStore.user?.id) return;
  await categoryStore.createCategory({
    ...payload,
    userId: authStore.user.id,
  });
}

async function handleUpdate(
  id: string,
  payload: {
    name: string;
    type: CategoryType;
    icon?: string;
    color?: string;
    parentId?: string;
    taxCategory?: TaxCategory;
    taxDeductionType?: TaxDeductionType;
    budgetGroup?: BudgetGroup;
  },
) {
  await categoryStore.updateCategory(id, payload);
}

async function handleDelete(id: string) {
  const confirmed = await confirmDialog({
    title: 'Eliminar categoría',
    message: '¿Estás seguro de que deseas eliminar esta categoría? Los movimientos existentes conservarán sus datos.',
    confirmText: 'Eliminar',
    variant: 'danger',
  });

  if (confirmed) {
    await categoryStore.deleteCategory(id);
  }
}
</script>

<template>
  <AppLayout
    title="Categorías"
    subtitle="Administra tus etiquetas de gastos e ingresos para organizar tus finanzas."
  >
    <div class="space-y-6">
      <!-- Top Action Bar -->
      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
      >
        <!-- Tab Selector -->
        <div
          class="flex p-1 bg-white dark:bg-[#162032] rounded-xl border border-slate-200 dark:border-[#283a59] text-sm shadow-sm"
        >
          <button
            class="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all"
            :class="
              activeTab === 'EXPENSE'
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-sm border border-rose-500/30'
                : 'text-slate-500 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white'
            "
            @click="activeTab = 'EXPENSE'"
          >
            <UIcon name="i-heroicons-arrow-trending-down" class="h-4 w-4" />
            <span>Gastos ({{ expenseCount }})</span>
          </button>

          <button
            class="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all"
            :class="
              activeTab === 'INCOME'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-500/30'
                : 'text-slate-500 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white'
            "
            @click="activeTab = 'INCOME'"
          >
            <UIcon name="i-heroicons-arrow-trending-up" class="h-4 w-4" />
            <span>Ingresos ({{ incomeCount }})</span>
          </button>
        </div>

        <div class="flex items-center gap-3">
          <!-- Search input -->
          <div class="relative w-full sm:w-64">
            <UInput
              v-model="searchTerm"
              placeholder="Buscar categoría..."
              icon="i-heroicons-magnifying-glass"
              size="sm"
            />
          </div>

          <!-- New Category Button -->
          <UButton
            color="primary"
            icon="i-heroicons-plus"
            @click="openCreateModal"
          >
            Nueva Categoría
          </UButton>
        </div>
      </div>

      <!-- Categories Grid -->
      <div
        v-if="categoryStore.isLoading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="h-24 rounded-2xl border border-slate-200 dark:border-[#283a59] bg-slate-100 dark:bg-[#162032]/40 p-4 animate-pulse"
        />
      </div>

      <div
        v-else-if="filteredCategories.length === 0"
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/50 p-12 text-center space-y-3 shadow-sm"
      >
        <div
          class="rounded-full bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-[#283a59] p-3 text-[#4D7EA8]"
        >
          <UIcon name="i-heroicons-tag" class="h-8 w-8" />
        </div>
        <div class="space-y-1">
          <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
            No se encontraron categorías de
            {{ activeTab === 'EXPENSE' ? 'gasto' : 'ingreso' }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-[#94a3b8] max-w-sm">
            Crea categorías personalizadas para clasificar automáticamente tus
            movimientos y presupuestos.
          </p>
        </div>
        <UButton
          color="primary"
          icon="i-heroicons-plus"
          size="sm"
          @click="openCreateModal"
        >
          Crear Categoría
        </UButton>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="cat in filteredCategories"
          :key="cat.id"
          class="rounded-2xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 dark:border-[#283a59] bg-slate-50 dark:bg-[#0f1523] shadow-inner"
              >
                <UIcon
                  :name="cat.icon || 'i-heroicons-tag'"
                  class="h-6 w-6"
                  :style="{ color: cat.color || '#3B82F6' }"
                />
              </div>
              <div>
                <h4
                  class="font-bold text-base text-slate-900 dark:text-[#f1f5f9]"
                >
                  {{ cat.name }}
                </h4>
                <span
                  class="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]"
                >
                  {{ transactionCountsByCategoryId[cat.id] || 0 }} movimientos
                  asociados
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-pencil-square"
                class="text-slate-400 hover:text-primary-500"
                @click="openEditModal(cat)"
              />
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-trash"
                class="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
                @click="handleDelete(cat.id)"
              />
            </div>
          </div>

          <div
            class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#283a59]/60"
          >
            <div class="flex items-center gap-2">
              <UBadge
                :color="cat.type === 'INCOME' ? 'success' : 'error'"
                variant="subtle"
                size="xs"
                class="font-bold"
              >
                {{ cat.type === 'INCOME' ? 'Ingreso' : 'Gasto' }}
              </UBadge>

              <!-- Etiqueta Regla 50/30/20 -->
              <span
                v-if="cat.budgetGroup && cat.budgetGroup !== 'UNASSIGNED'"
                class="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border"
                :class="[
                  cat.budgetGroup === 'NEEDS'
                    ? 'text-sky-400 bg-sky-950/60 border-sky-800/40'
                    : cat.budgetGroup === 'WANTS'
                      ? 'text-purple-400 bg-purple-950/60 border-purple-800/40'
                      : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
                ]"
              >
                {{
                  cat.budgetGroup === 'NEEDS'
                    ? '50% Necesidades'
                    : cat.budgetGroup === 'WANTS'
                      ? '30% Deseos'
                      : '20% Ahorro'
                }}
              </span>

              <!-- Etiqueta SUNAT si tiene regla asociada y el usuario tiene activo su perfil tributario en Perú -->
              <template v-if="authStore.user?.taxProfileEnabled && authStore.user?.taxCountry === 'PE'">
                <span
                  v-if="cat.taxDeductionType && cat.taxDeductionType !== 'NONE'"
                  class="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded"
                >
                  <UIcon name="i-heroicons-scale" class="w-3 h-3" />
                  3 UIT ({{ cat.taxDeductionType === 'RENTAL' || cat.taxDeductionType === 'PROFESSIONAL_SERVICE' ? '30%' : (cat.taxDeductionType === 'DOMESTIC_WORKER' ? '100%' : '15%') }})
                </span>
                <span
                  v-else-if="cat.taxCategory && cat.taxCategory === 'FOURTH_CATEGORY_INCOME'"
                  class="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded"
                >
                  <UIcon name="i-heroicons-scale" class="w-3 h-3" />
                  4ta Cat (8%)
                </span>
              </template>
            </div>

            <span
              class="inline-block h-3 w-3 rounded-full border border-black/10"
              :style="{ backgroundColor: cat.color || '#3B82F6' }"
              :title="cat.color || '#3B82F6'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Category Modal -->
    <CreateCategoryModal
      v-model:open="isCreateModalOpen"
      :category="editingCategory"
      :parent-categories="categoryStore.categories"
      @created="handleCreate"
      @updated="(id, payload) => handleUpdate(id, payload)"
    />
  </AppLayout>
</template>
