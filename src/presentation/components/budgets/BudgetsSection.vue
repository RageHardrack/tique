<script setup lang="ts">
import { computed, ref } from 'vue';

import CreateBudgetModal from './CreateBudgetModal.vue';
import type { Category } from '../../../core/entities/Category';
import type { Transaction } from '../../../core/entities/Transaction';
import type { SupportedCurrency } from '../../../core/entities/Account';
import type { Budget, BudgetProgress } from '../../../core/entities/Budget';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';

interface Props {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  accountsCurrencyMap: Record<string, string>;
  baseCurrency: SupportedCurrency;
  convertFn: (
    amount: number,
    fromCurrency: string,
    toCurrency: SupportedCurrency,
  ) => number;
  isLoading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (
    e: 'create',
    payload: {
      categoryId: string;
      amount: number;
      currency: string;
      period: string;
    },
  ): void;
  (
    e: 'update',
    id: string,
    payload: {
      amount: number;
      currency: string;
      period: string;
    },
  ): void;
  (e: 'delete', id: string): void;
}>();

const isCreateModalOpen = ref(false);
const editingBudget = ref<Budget | null>(null);

function handleOpenCreate() {
  editingBudget.value = null;
  isCreateModalOpen.value = true;
}

function handleEdit(budget: Budget) {
  editingBudget.value = budget;
  isCreateModalOpen.value = true;
}

const categoriesMap = computed(() => {
  const map: Record<string, Category> = {};
  props.categories.forEach((cat) => {
    map[cat.id] = cat;
  });
  return map;
});

// Calculate spent amount per category for current month's expenses
const categorySpentMap = computed(() => {
  const map: Record<string, number> = {};

  props.transactions
    .filter((tx) => tx.type === 'EXPENSE' && tx.categoryId)
    .forEach((tx) => {
      const sourceCurrency = props.accountsCurrencyMap[tx.accountId] || 'USD';
      const converted = props.convertFn(
        tx.amount,
        sourceCurrency,
        props.baseCurrency,
      );
      const catId = tx.categoryId!;
      map[catId] = (map[catId] || 0) + converted;
    });

  return map;
});

const progressList = computed<BudgetProgress[]>(() => {
  return props.budgets.map((b) => {
    const category = categoriesMap.value[b.categoryId];
    const categoryName = category?.name || 'Categoría';
    const categoryIcon = category?.icon || 'i-heroicons-tag';
    const categoryColor = category?.color || '#3B82F6';

    const budgetInBase = props.convertFn(
      b.amount,
      b.currency || 'USD',
      props.baseCurrency,
    );
    const spentInBase = categorySpentMap.value[b.categoryId] || 0;
    const remaining = budgetInBase - spentInBase;
    const percentage =
      budgetInBase > 0
        ? Math.round((spentInBase / budgetInBase) * 1000) / 10
        : 0;

    let status: 'ON_TRACK' | 'WARNING' | 'EXCEEDED' = 'ON_TRACK';
    if (percentage >= 100) {
      status = 'EXCEEDED';
    } else if (percentage >= 75) {
      status = 'WARNING';
    }

    return {
      budget: b,
      categoryName,
      categoryIcon,
      categoryColor,
      budgetAmount: Math.round(budgetInBase * 100) / 100,
      spentAmount: Math.round(spentInBase * 100) / 100,
      remainingAmount: Math.round(remaining * 100) / 100,
      percentage,
      status,
    };
  });
});

function handleDelete(id: string) {
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
          Presupuestos Mensuales
        </h2>
        <p class="text-sm text-slate-500 dark:text-[#4D7EA8]">
          Monitorea tus metas y límites de gasto por categoría en
          {{ baseCurrency }}.
        </p>
      </div>

      <UButton
        color="primary"
        icon="i-heroicons-plus-circle"
        :disabled="categories.length === 0"
        @click="handleOpenCreate"
      >
        Nuevo Presupuesto
      </UButton>
    </header>

    <!-- Empty State -->
    <div
      v-if="progressList.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/50 p-10 text-center space-y-3 shadow-sm"
    >
      <div
        class="rounded-full bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-[#283a59] p-3 text-[#D4AF37]"
      >
        <UIcon name="i-heroicons-banknotes" class="h-8 w-8" />
      </div>
      <div class="space-y-1">
        <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
          No tienes presupuestos activos
        </h3>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8] max-w-sm">
          Establece límites mensuales para tus categorías principales y evita
          gastos imprevistos.
        </p>
      </div>
      <UButton
        color="primary"
        variant="subtle"
        icon="i-heroicons-plus"
        @click="isCreateModalOpen = true"
      >
        Configurar primer presupuesto
      </UButton>
    </div>

    <!-- Budgets Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in progressList"
        :key="item.budget.id"
        class="rounded-2xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-5 shadow-sm dark:shadow-lg dark:shadow-black/20 flex flex-col justify-between space-y-4"
      >
        <div>
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span
                class="w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: item.categoryColor }"
              />
              <span
                class="font-bold text-sm text-slate-900 dark:text-[#f1f5f9]"
              >
                {{ item.categoryName }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <UBadge
                :color="
                  item.status === 'EXCEEDED'
                    ? 'error'
                    : item.status === 'WARNING'
                      ? 'warning'
                      : 'success'
                "
                variant="subtle"
                size="xs"
                class="font-bold"
              >
                {{ item.percentage }}%
              </UBadge>

              <div class="flex items-center gap-1">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-pencil-square"
                  class="text-slate-400 hover:text-primary-500"
                  @click="handleEdit(item.budget)"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-trash"
                  class="text-slate-400 hover:text-rose-500"
                  @click="handleDelete(item.budget.id)"
                />
              </div>
            </div>
          </div>

          <!-- Figures -->
          <div class="mt-3 flex items-baseline justify-between text-xs">
            <span class="text-slate-500 dark:text-[#94a3b8]">
              Gastado:
              <strong class="text-slate-900 dark:text-white">{{
                CurrencyFormatter.format(item.spentAmount, baseCurrency)
              }}</strong>
            </span>
            <span class="text-slate-500 dark:text-[#94a3b8]">
              Límite:
              <strong>{{
                CurrencyFormatter.format(item.budgetAmount, baseCurrency)
              }}</strong>
            </span>
          </div>

          <!-- Progress Bar -->
          <div
            class="mt-2 w-full bg-slate-100 dark:bg-[#0f1523] h-2 rounded-full overflow-hidden"
          >
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="
                item.status === 'EXCEEDED'
                  ? 'bg-rose-500'
                  : item.status === 'WARNING'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              "
              :style="{ width: `${Math.min(item.percentage, 100)}%` }"
            />
          </div>
        </div>

        <!-- Remaining or Exceeded Footer -->
        <div
          class="pt-2 border-t border-slate-100 dark:border-[#283a59]/60 flex items-center justify-between text-xs"
        >
          <span class="text-slate-500 dark:text-[#94a3b8]">
            {{ item.remainingAmount >= 0 ? 'Disponible:' : 'Exceso:' }}
          </span>
          <span
            class="font-bold"
            :class="
              item.remainingAmount >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            "
          >
            {{
              CurrencyFormatter.format(
                Math.abs(item.remainingAmount),
                baseCurrency,
              )
            }}
          </span>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <CreateBudgetModal
      v-model:open="isCreateModalOpen"
      :budget="editingBudget"
      :categories="categories"
      :base-currency="baseCurrency"
      @create="emit('create', $event)"
      @update="(id, payload) => emit('update', id, payload)"
    />
  </section>
</template>
