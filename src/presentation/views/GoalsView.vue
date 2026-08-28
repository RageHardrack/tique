<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import GoalCard from '../components/goals/GoalCard.vue';
import CreateGoalModal from '../components/goals/CreateGoalModal.vue';
import DepositGoalModal from '../components/goals/DepositGoalModal.vue';
import { useGoalStore } from '../store/goals';
import { useAccountStore } from '../store/accounts';
import { useAuthStore } from '../store/auth';
import { useExchangeRateStore } from '../store/exchange-rates';
import type { CreateGoalInput, SavingsGoal, UpdateGoalInput } from '../../core/entities/Goal';

const authStore = useAuthStore();
const goalStore = useGoalStore();
const accountStore = useAccountStore();
const rateStore = useExchangeRateStore();

const isCreateModalOpen = ref(false);
const editingGoal = ref<SavingsGoal | null>(null);

const isDepositModalOpen = ref(false);
const targetGoal = ref<SavingsGoal | null>(null);
const depositMode = ref<'deposit' | 'withdraw'>('deposit');

onMounted(async () => {
  if (authStore.user?.id) {
    await Promise.all([
      goalStore.fetchGoals(authStore.user.id),
      accountStore.fetchAccounts(authStore.user.id),
    ]);
  }
});

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency || rateStore.baseCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function handleOpenCreate() {
  editingGoal.value = null;
  isCreateModalOpen.value = true;
}

function handleEdit(goal: SavingsGoal) {
  editingGoal.value = goal;
  isCreateModalOpen.value = true;
}

async function handleDelete(goalId: string) {
  if (confirm('¿Estás seguro de que deseas eliminar esta meta de ahorro?')) {
    await goalStore.deleteGoal(goalId);
  }
}

function handleOpenDeposit(goal: SavingsGoal) {
  targetGoal.value = goal;
  depositMode.value = 'deposit';
  isDepositModalOpen.value = true;
}

function handleOpenWithdraw(goal: SavingsGoal) {
  targetGoal.value = goal;
  depositMode.value = 'withdraw';
  isDepositModalOpen.value = true;
}

async function handleCreated(payload: CreateGoalInput) {
  await goalStore.createGoal(payload);
}

async function handleUpdated(id: string, payload: UpdateGoalInput) {
  await goalStore.updateGoal(id, payload);
}

async function handleConfirmTransaction(payload: {
  goalId: string;
  amount: number;
  accountId?: string;
  mode: 'deposit' | 'withdraw';
}) {
  if (payload.mode === 'deposit') {
    await goalStore.deposit(payload.goalId, payload.amount, payload.accountId);
  } else {
    await goalStore.withdraw(payload.goalId, payload.amount, payload.accountId);
  }
  if (payload.accountId && authStore.user?.id) {
    await accountStore.fetchAccounts(authStore.user.id);
  }
}

const activeGoals = computed(() => goalStore.goals.filter((g) => !g.isCompleted));
const completedGoals = computed(() => goalStore.goals.filter((g) => g.isCompleted));
</script>

<template>
  <AppLayout
    title="Metas de Ahorro"
    subtitle="Planificación de fondos especiales, metas patrimoniales y avance de ahorro acumulado."
  >
    <div class="space-y-6">
      <!-- Header Summary Card -->
      <section class="rounded-2xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#283a59]/60">
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-[#1B3E9B] dark:text-[#4D7EA8]" />
              Resumen de Fondos Especiales
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acumulado total de tus objetivos de ahorro activos
            </p>
          </div>

          <UButton
            color="primary"
            icon="i-heroicons-plus"
            class="font-semibold cursor-pointer min-h-[40px]"
            @click="handleOpenCreate"
          >
            Nueva Meta
          </UButton>
        </div>

        <!-- Global Progress Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Ahorrado</span>
            <div class="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {{ formatAmount(goalStore.totalSavedAmount, rateStore.baseCurrency) }}
            </div>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Objetivo Global</span>
            <div class="text-xl font-black text-slate-900 dark:text-white mt-1">
              {{ formatAmount(goalStore.totalTargetAmount, rateStore.baseCurrency) }}
            </div>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Progreso Total</span>
            <div class="text-xl font-black text-[#1B3E9B] dark:text-[#4D7EA8] mt-1">
              {{ goalStore.overallProgressPercentage }}%
            </div>
          </div>
        </div>
      </section>

      <!-- Active Goals Grid -->
      <section class="space-y-3">
        <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-amber-500" />
          Metas en Progreso ({{ activeGoals.length }})
        </h3>

        <div v-if="activeGoals.length === 0" class="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#162032]/50 text-slate-400 dark:text-slate-500 text-sm">
          No tienes metas de ahorro activas. ¡Crea tu primer fondo de ahorro especial!
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <GoalCard
            v-for="goal in activeGoals"
            :key="goal.id"
            :goal="goal"
            :base-currency="rateStore.baseCurrency"
            :format-fn="formatAmount"
            @deposit="handleOpenDeposit"
            @withdraw="handleOpenWithdraw"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>
      </section>

      <!-- Completed Goals Grid -->
      <section v-if="completedGoals.length > 0" class="space-y-3 pt-4">
        <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-heroicons-check-badge" class="w-5 h-5 text-emerald-500" />
          Metas Completadas ({{ completedGoals.length }})
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <GoalCard
            v-for="goal in completedGoals"
            :key="goal.id"
            :goal="goal"
            :base-currency="rateStore.baseCurrency"
            :format-fn="formatAmount"
            @deposit="handleOpenDeposit"
            @withdraw="handleOpenWithdraw"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>
      </section>

      <!-- Modals -->
      <CreateGoalModal
        v-model:open="isCreateModalOpen"
        :goal="editingGoal"
        :base-currency="rateStore.baseCurrency"
        @created="handleCreated"
        @updated="handleUpdated"
      />

      <DepositGoalModal
        v-model:open="isDepositModalOpen"
        :goal="targetGoal"
        :accounts="accountStore.accounts"
        :mode="depositMode"
        :format-fn="formatAmount"
        @confirm="handleConfirmTransaction"
      />
    </div>
  </AppLayout>
</template>
