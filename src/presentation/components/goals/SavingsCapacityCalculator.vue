<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  SavingsCapacityCalculatorService,
  type MonthlyCommitmentsSummary,
  type FreeCashflowAnalysis,
  type PurchaseSimulationResult,
} from '../../../core/services/SavingsCapacityCalculatorService';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import { DateFormatter } from '../../../core/services/DateFormatter';
import type { Subscription } from '../../../core/entities/Subscription';
import type { Budget } from '../../../core/entities/Budget';
import type { Loan } from '../../../core/entities/Loan';
import type { SavingsGoal } from '../../../core/entities/Goal';
import type { SupportedCurrency } from '../../../core/entities/Account';

interface Props {
  subscriptions: Subscription[];
  budgets: Budget[];
  loans: Loan[];
  activeGoals: SavingsGoal[];
  baseCurrency: SupportedCurrency;
  convertFn: (amount: number, from: string, to: SupportedCurrency) => number;
  averageHistoricalIncome?: number;
}

const props = withDefaults(defineProps<Props>(), {
  averageHistoricalIncome: 0,
});

// UI state
const isExpanded = ref(true);
const monthlyIncome = ref<number | undefined>(undefined);
const simulationMode = ref<'CUSTOM' | 'GOAL'>('CUSTOM');
const customItemName = ref('');
const customItemCost = ref<number | undefined>(undefined);
const selectedGoalId = ref<string>('');
const savingsAllocationPercent = ref(50); // default to allocating 50% of free cashflow

// Initial fill of monthly income with average historical if available
watch(
  () => props.averageHistoricalIncome,
  (avg) => {
    if (monthlyIncome.value === undefined && avg && avg > 0) {
      monthlyIncome.value = Math.round(avg);
    }
  },
  { immediate: true },
);

function fillHistoricalAverage() {
  if (props.averageHistoricalIncome && props.averageHistoricalIncome > 0) {
    monthlyIncome.value = Math.round(props.averageHistoricalIncome);
  }
}

// 1. Commitments Breakdown
const commitments = computed<MonthlyCommitmentsSummary>(() => {
  return SavingsCapacityCalculatorService.calculateMonthlyCommitments({
    subscriptions: props.subscriptions,
    budgets: props.budgets,
    loans: props.loans,
    targetCurrency: props.baseCurrency,
    convertFn: props.convertFn,
  });
});

// 2. Free Cash Flow
const cashflow = computed<FreeCashflowAnalysis>(() => {
  return SavingsCapacityCalculatorService.calculateFreeCashflow({
    monthlyIncome: Number(monthlyIncome.value) || 0,
    commitments: commitments.value.totalCommitmentsMonthly,
  });
});

// 3. Purchase simulation target amount and title
const simulationTarget = computed<{ name: string; amount: number }>(() => {
  if (simulationMode.value === 'GOAL') {
    const goal = props.activeGoals.find((g) => g.id === selectedGoalId.value);
    if (!goal) return { name: 'Selecciona una meta', amount: 0 };
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    return {
      name: goal.name,
      amount: props.convertFn(remaining, goal.currency || 'USD', props.baseCurrency),
    };
  }

  return {
    name: customItemName.value.trim() || 'Compra Planeada',
    amount: Number(customItemCost.value) || 0,
  };
});

// 4. Monthly allocation amount dedicated to the purchase
const monthlyAllocationAmount = computed(() => {
  if (cashflow.value.freeMargin <= 0) return 0;
  return Math.round((cashflow.value.freeMargin * (savingsAllocationPercent.value / 100)) * 100) / 100;
});

// 5. Timeline simulation
const simulation = computed<PurchaseSimulationResult>(() => {
  return SavingsCapacityCalculatorService.simulatePurchaseTimeline({
    targetAmount: simulationTarget.value.amount,
    monthlyAllocation: monthlyAllocationAmount.value,
  });
});

const formattedEstimatedDate = computed(() => {
  if (!simulation.value.estimatedCompletionDate) return null;
  return DateFormatter.format(simulation.value.estimatedCompletionDate, 'MMMM YYYY');
});

function format(amount: number): string {
  return CurrencyFormatter.format(amount, props.baseCurrency);
}
</script>

<template>
  <section class="rounded-3xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032] p-5 sm:p-6 shadow-sm space-y-5 transition-all">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
          <UIcon name="i-heroicons-calculator" class="h-6 w-6" />
        </div>
        <div>
          <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            Calculadora de Capacidad y Compras
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Simulador
            </span>
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Descubre tu margen libre mensual y calcula en cuánto tiempo puedes financiar una meta con dinero real.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
        :aria-label="isExpanded ? 'Contraer calculadora' : 'Expandir calculadora'"
        @click="isExpanded = !isExpanded"
      >
        <UIcon
          :name="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="w-5 h-5 transition-transform"
        />
      </button>
    </div>

    <div v-show="isExpanded" class="space-y-6 pt-2 border-t border-slate-100 dark:border-[#283a59]/60">
      <!-- Input: Ingreso Mensual y Compromisos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Col 1: Ingreso Mensual -->
        <div class="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#0f1523]/80 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Ingreso Mensual Estimado
            </label>
            <button
              v-if="averageHistoricalIncome > 0"
              type="button"
              class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
              @click="fillHistoricalAverage"
            >
              <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5" />
              <span>Promedio ({{ format(averageHistoricalIncome) }})</span>
            </button>
          </div>

          <div class="relative">
            <UInput
              v-model.number="monthlyIncome"
              type="number"
              min="0"
              step="10"
              placeholder="Ej. 1500"
              size="lg"
              class="w-full font-bold"
            />
          </div>

          <p class="text-[11px] text-slate-500 dark:text-slate-400">
            Ingresa tu ingreso neto recurrente estimado para calcular tu capacidad de ahorro libre de compromisos.
          </p>
        </div>

        <!-- Col 2: Resumen de Compromisos Fijos -->
        <div class="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#0f1523]/80 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Compromisos Fijos Mensuales
            </span>
            <span class="text-sm font-black text-rose-600 dark:text-rose-400">
              {{ format(commitments.totalCommitmentsMonthly) }}
            </span>
          </div>

          <!-- Breakdown Tags -->
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div class="p-2 rounded-xl bg-white dark:bg-[#162032] border border-slate-200/60 dark:border-slate-800">
              <span class="block text-[10px] text-slate-400">Suscripciones</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">{{ format(commitments.totalSubscriptionsMonthly) }}</span>
            </div>
            <div class="p-2 rounded-xl bg-white dark:bg-[#162032] border border-slate-200/60 dark:border-slate-800">
              <span class="block text-[10px] text-slate-400">Presupuestos</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">{{ format(commitments.totalBudgetsMonthly) }}</span>
            </div>
            <div class="p-2 rounded-xl bg-white dark:bg-[#162032] border border-slate-200/60 dark:border-slate-800">
              <span class="block text-[10px] text-slate-400">Cuotas Deudas</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">{{ format(commitments.totalLoanPaymentsMonthly) }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80 text-xs">
            <span class="font-bold text-slate-600 dark:text-slate-400">Margen Libre Mensual:</span>
            <span
              class="font-black text-base"
              :class="cashflow.isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'"
            >
              {{ format(cashflow.freeMargin) }}
              <span class="text-[11px] font-semibold text-slate-400">({{ cashflow.marginPercentage }}%)</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Alerta si hay déficit -->
      <div
        v-if="cashflow.isDeficit"
        class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5"
      >
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 shrink-0 text-rose-600" />
        <span>
          Tus compromisos mensuales superan tus ingresos proyectados por {{ format(Math.abs(cashflow.freeMargin)) }}. No hay margen libre para nuevas compras sin reducir gastos o presupuestos.
        </span>
      </div>

      <!-- Simulador de Compra / Meta -->
      <div class="p-4 sm:p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 class="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-heroicons-shopping-bag" class="w-4 h-4 text-indigo-500" />
              Simular Compra Importante o Meta
            </h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Elige una meta registrada o ingresa un monto personalizado para estimar la fecha en que podrás pagarla.
            </p>
          </div>

          <!-- Selector de Modo -->
          <div class="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 w-fit">
            <button
              type="button"
              class="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
              :class="simulationMode === 'CUSTOM' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'"
              @click="simulationMode = 'CUSTOM'"
            >
              Personalizada
            </button>
            <button
              type="button"
              class="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
              :class="simulationMode === 'GOAL' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'"
              @click="simulationMode = 'GOAL'"
            >
              Meta de Ahorro
            </button>
          </div>
        </div>

        <!-- Inputs de Simulación -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Modo Personalizado -->
          <template v-if="simulationMode === 'CUSTOM'">
            <div class="sm:col-span-2">
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                ¿Qué deseas comprar?
              </label>
              <UInput
                v-model="customItemName"
                placeholder="Ej. Nueva Laptop, Curso, Viaje"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Costo Total ({{ baseCurrency }})
              </label>
              <UInput
                v-model.number="customItemCost"
                type="number"
                min="0"
                step="10"
                placeholder="Ej. 1200"
                class="w-full font-bold"
              />
            </div>
          </template>

          <!-- Modo Meta de Ahorro -->
          <template v-else>
            <div class="sm:col-span-3">
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Selecciona una de tus metas activas
              </label>
              <select
                v-model="selectedGoalId"
                class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#162032] text-sm text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="" disabled>-- Elige una meta --</option>
                <option
                  v-for="g in activeGoals"
                  :key="g.id"
                  :value="g.id"
                >
                  {{ g.name }} — Falta {{ format(Math.max(0, g.targetAmount - g.currentAmount)) }}
                </option>
              </select>
            </div>
          </template>
        </div>

        <!-- Slider de Asignación del Margen -->
        <div v-if="cashflow.freeMargin > 0 && simulationTarget.amount > 0" class="pt-2 border-t border-indigo-500/10 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-700 dark:text-slate-300">
              ¿Cuánto de tu margen libre mensual destinarás a esta compra?
            </span>
            <span class="font-black text-indigo-600 dark:text-indigo-400">
              {{ savingsAllocationPercent }}% ({{ format(monthlyAllocationAmount) }} / mes)
            </span>
          </div>

          <input
            v-model.number="savingsAllocationPercent"
            type="range"
            min="10"
            max="100"
            step="5"
            class="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        <!-- Resultado de la Proyección -->
        <div
          v-if="simulationTarget.amount > 0"
          class="p-4 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div class="space-y-1 text-center sm:text-left">
            <span class="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Tiempo estimado de cumplimiento
            </span>
            <h5 class="text-base font-bold text-slate-900 dark:text-white">
              {{ simulationTarget.name }} ({{ format(simulationTarget.amount) }})
            </h5>
          </div>

          <div v-if="simulation.isAchievable" class="flex items-center gap-3">
            <div class="text-right">
              <div class="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {{ simulation.monthsNeeded }} {{ simulation.monthsNeeded === 1 ? 'mes' : 'meses' }}
              </div>
              <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Aprox. {{ simulation.weeksNeeded }} semanas • {{ formattedEstimatedDate }}
              </div>
            </div>

            <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UIcon name="i-heroicons-calendar-days" class="w-5 h-5" />
            </div>
          </div>

          <div v-else class="text-xs text-rose-500 font-bold">
            No es alcanzable actualmente porque el margen mensual asignado es 0 o negativo.
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
