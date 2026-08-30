<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import { useAuthStore } from '../store/auth';
import { useTaxStore } from '../store/tax.store';
import { CurrencyFormatter } from '../../core/services/CurrencyFormatter';
import { DateFormatter } from '../../core/services/DateFormatter';

const authStore = useAuthStore();
const taxStore = useTaxStore();

const isActivating = ref(false);
const rucInput = ref('');
const countryInput = ref('PE');

const availableYears = [2024, 2025, 2026];

onMounted(async () => {
  if (authStore.user?.id) {
    await taxStore.fetchProfile(authStore.user.id);
    if (taxStore.profile.taxProfileEnabled) {
      rucInput.value = taxStore.profile.taxRuc || '';
      countryInput.value = taxStore.profile.taxCountry || 'PE';
      await taxStore.fetchProjection(authStore.user.id);
      await taxStore.fetchDeductibles(authStore.user.id);
    }
  }
});

async function handleToggleProfile(enable: boolean) {
  if (!authStore.user?.id) return;
  isActivating.value = true;
  try {
    await taxStore.updateProfile(authStore.user.id, {
      taxProfileEnabled: enable,
      taxCountry: countryInput.value,
      taxRuc: rucInput.value.trim() || undefined,
    });
    if (enable) {
      await taxStore.fetchProjection(authStore.user.id);
      await taxStore.fetchDeductibles(authStore.user.id);
    }
  } finally {
    isActivating.value = false;
  }
}

async function handleYearChange(year: number) {
  if (!authStore.user?.id) return;
  await taxStore.changeYear(authStore.user.id, year);
}

const projection = computed(() => taxStore.projection);
const deductibles = computed(() => taxStore.deductibles);

const deductibleProgressPct = computed(() => {
  if (!projection.value) return 0;
  const max = projection.value.deductible3UitLimit;
  if (!max || max <= 0) return 0;
  return Math.min(100, Math.round((projection.value.appliedDeductible3Uit / max) * 100));
});

function formatMoney(amount: number) {
  return CurrencyFormatter.format(amount, 'PEN');
}

function getDeductionLabel(type: string) {
  switch (type) {
    case 'RESTAURANT_BAR':
      return 'Restaurante / Bar (15%)';
    case 'HOTEL':
      return 'Hotel / Hospedaje (15%)';
    case 'RENTAL':
      return 'Alquiler de Inmueble (30%)';
    case 'PROFESSIONAL_SERVICE':
      return 'Servicio Profesional 4ta (30%)';
    case 'DOMESTIC_WORKER':
      return 'Trabajadora del Hogar (100%)';
    default:
      return type;
  }
}
</script>

<template>
  <AppLayout
    title="Impuestos & SUNAT"
    subtitle="Proyección y cálculo tributario de Renta de Trabajo (4ta y 5ta Categoría)"
  >
    <div class="space-y-6">
      <!-- Header Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <UIcon name="i-heroicons-scale" class="w-8 h-8 text-sky-500" />
            Impuestos & SUNAT (Renta de Trabajo)
          </h1>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Proyección en vivo de 4ta (Recibos por Honorarios) y 5ta Categoría (Planilla) para Perú.
          </p>
        </div>

        <!-- Year Selector -->
        <div v-if="taxStore.profile.taxProfileEnabled" class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-500">Ejercicio Fiscal:</span>
          <div class="flex p-1 rounded-xl bg-slate-200 dark:bg-[#162032] border border-slate-300 dark:border-slate-800">
            <button
              v-for="yr in availableYears"
              :key="yr"
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              :class="[
                taxStore.selectedYear === yr
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
              ]"
              @click="handleYearChange(yr)"
            >
              {{ yr }}
            </button>
          </div>
        </div>
      </div>

      <!-- Activation Card if profile is disabled -->
      <div
        v-if="!taxStore.profile.taxProfileEnabled"
        class="p-8 rounded-3xl bg-gradient-to-br from-sky-500/10 via-slate-50 to-blue-500/10 dark:from-sky-950/30 dark:via-[#0f1523] dark:to-[#162032] border border-sky-500/30 text-center space-y-4 max-w-2xl mx-auto"
      >
        <div class="inline-flex p-3.5 rounded-2xl bg-sky-500/20 text-sky-500 dark:text-sky-400">
          <UIcon name="i-heroicons-document-currency-dollar" class="w-10 h-10" />
        </div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">
          Activar Gestión Tributaria SUNAT (Perú)
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Este módulo calcula automáticamente tus deducciones de 7 UIT, gastos deducibles de hasta 3 UIT, tramos progresivos de renta de trabajo y retenciones del 8% de 4ta categoría.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto text-left pt-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300">RUC Persona Natural</label>
            <UInput v-model="rucInput" placeholder="Ej: 15548932014" class="w-full" />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300">País</label>
            <select
              v-model="countryInput"
              class="w-full rounded-md border border-[#283a59] bg-[#0f1523] px-3 py-2 text-sm text-[#f1f5f9] focus:border-[#4D7EA8] focus:outline-none min-h-[40px]"
            >
              <option value="PE">Perú (SUNAT)</option>
            </select>
          </div>
        </div>

        <div class="pt-4">
          <UButton
            color="primary"
            class="font-bold min-h-[44px] px-6"
            :loading="isActivating"
            @click="handleToggleProfile(true)"
          >
            Activar Módulo Tributario
          </UButton>
        </div>
      </div>

      <!-- Active Tax Dashboard -->
      <div v-else class="space-y-6">
        <!-- Top Summary Metrics Grid -->
        <div v-if="projection" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Renta Bruta 4ta & 5ta -->
          <div class="p-5 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59]/60 shadow-sm space-y-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ingresos Totales (Bruto)
            </span>
            <div class="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {{ formatMoney(projection.totalGrossIncome) }}
            </div>
            <div class="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div>4ta (Honorarios): <span class="font-bold font-mono">{{ formatMoney(projection.grossFourthCategory) }}</span></div>
              <div>5ta (Planilla): <span class="font-bold font-mono">{{ formatMoney(projection.grossFifthCategory) }}</span></div>
            </div>
          </div>

          <!-- Deducciones Totales (7 UIT + 3 UIT) -->
          <div class="p-5 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59]/60 shadow-sm space-y-2">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Deducciones Computadas
            </span>
            <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              - {{ formatMoney(projection.totalDeductions + projection.fourthCategoryDeduction20) }}
            </div>
            <div class="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div>20% Legal 4ta: <span class="font-bold font-mono">-{{ formatMoney(projection.fourthCategoryDeduction20) }}</span></div>
              <div>7 UIT Fija: <span class="font-bold font-mono">-{{ formatMoney(projection.fixedDeduction7Uit) }}</span></div>
              <div>3 UIT Adicionales: <span class="font-bold font-mono">-{{ formatMoney(projection.appliedDeductible3Uit) }}</span></div>
            </div>
          </div>

          <!-- Base Imponible Neta & Impuesto -->
          <div class="p-5 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59]/60 shadow-sm space-y-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Impuesto Calculado
            </span>
            <div class="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {{ formatMoney(projection.totalCalculatedTax) }}
            </div>
            <div class="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div>Renta Neta Imponible: <span class="font-bold font-mono">{{ formatMoney(projection.netTaxableIncome) }}</span></div>
              <div>Retenciones 4ta & 5ta: <span class="font-bold font-mono">-{{ formatMoney(projection.totalWithholdings) }}</span></div>
            </div>
          </div>

          <!-- Saldo a Pagar o Saldo a Favor -->
          <div
            class="p-5 rounded-2xl border shadow-sm space-y-2"
            :class="[
              projection.status === 'REFUND_DUE'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : projection.status === 'PAYMENT_DUE'
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-white dark:bg-[#162032] border-slate-200 dark:border-[#283a59]/60',
            ]"
          >
            <span
              class="text-xs font-bold uppercase tracking-wider"
              :class="[
                projection.status === 'REFUND_DUE'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : projection.status === 'PAYMENT_DUE'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-500',
              ]"
            >
              {{ projection.status === 'REFUND_DUE' ? 'Saldo a Favor (Devolución)' : projection.status === 'PAYMENT_DUE' ? 'Saldo por Regularizar' : 'Al Día con SUNAT' }}
            </span>
            <div
              class="text-2xl font-black font-mono"
              :class="[
                projection.status === 'REFUND_DUE'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : projection.status === 'PAYMENT_DUE'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-900 dark:text-white',
              ]"
            >
              {{ formatMoney(Math.abs(projection.estimatedTaxDue)) }}
            </div>
            <p class="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
              {{ projection.status === 'REFUND_DUE' ? 'SUNAT te devolverá este excedente tras la DJ Anual.' : projection.status === 'PAYMENT_DUE' ? 'Monto estimado a pagar en la regularización anual.' : 'No tienes pagos pendientes proyectados.' }}
            </p>
          </div>
        </div>

        <!-- Deductions 3 UIT Progress Bar -->
        <div v-if="projection" class="p-6 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59]/60 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-amber-500" />
                Deducción Adicional de hasta 3 UIT (Gastos Personales)
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Tope legal máximo de 3 UIT = {{ formatMoney(projection.deductible3UitLimit) }} (Restaurantes, Hoteles, Alquileres, Servicios 4ta).
              </p>
            </div>
            <div class="text-right">
              <span class="text-lg font-black font-mono text-sky-500">
                {{ formatMoney(projection.appliedDeductible3Uit) }}
              </span>
              <span class="text-xs text-slate-400 font-mono"> / {{ formatMoney(projection.deductible3UitLimit) }}</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5">
            <div
              class="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              :style="{ width: `${deductibleProgressPct}%` }"
            />
          </div>
        </div>

        <!-- Progressive Brackets (Tramos SUNAT) -->
        <div v-if="projection" class="p-6 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59]/60 space-y-4">
          <h3 class="text-base font-bold text-slate-900 dark:text-white">
            Escala Progresiva Acumulativa (Cálculo por Tramos)
          </h3>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th class="py-2 px-3">Tramo</th>
                  <th class="py-2 px-3">Rango en UIT</th>
                  <th class="py-2 px-3">Tasa %</th>
                  <th class="py-2 px-3 text-right">Base Gravada</th>
                  <th class="py-2 px-3 text-right">Impuesto Resultante</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                <tr
                  v-for="b in projection.brackets"
                  :key="b.bracketNumber"
                  :class="b.taxableAmount > 0 ? 'bg-sky-50/30 dark:bg-sky-950/20 font-bold' : 'opacity-60'"
                >
                  <td class="py-2.5 px-3">Tramo {{ b.bracketNumber }}</td>
                  <td class="py-2.5 px-3">{{ b.description }}</td>
                  <td class="py-2.5 px-3 text-sky-500 font-bold">{{ Math.round(b.rate * 100) }}%</td>
                  <td class="py-2.5 px-3 text-right">{{ formatMoney(b.taxableAmount) }}</td>
                  <td class="py-2.5 px-3 text-right text-slate-900 dark:text-white">{{ formatMoney(b.taxAmount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Deductibles History Table -->
        <div v-if="deductibles && deductibles.length > 0" class="p-6 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59]/60 space-y-4">
          <h3 class="text-base font-bold text-slate-900 dark:text-white">
            Gastos Deducibles Registrados (Año {{ taxStore.selectedYear }})
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th class="py-2 px-3">Fecha</th>
                  <th class="py-2 px-3">Tipo de Deducción</th>
                  <th class="py-2 px-3">N° Comprobante</th>
                  <th class="py-2 px-3">Nota / Detalle</th>
                  <th class="py-2 px-3 text-right">Monto Pagado</th>
                  <th class="py-2 px-3 text-right">Deducción Real</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                <tr v-for="item in deductibles" :key="item.id">
                  <td class="py-2 px-3">{{ DateFormatter.format(item.date, 'DD/MM/YYYY') }}</td>
                  <td class="py-2 px-3 font-sans">{{ getDeductionLabel(item.deductionType) }}</td>
                  <td class="py-2 px-3">{{ item.documentNumber || '-' }}</td>
                  <td class="py-2 px-3 font-sans">{{ item.note || '-' }}</td>
                  <td class="py-2 px-3 text-right">{{ formatMoney(item.originalAmount) }}</td>
                  <td class="py-2 px-3 text-right text-emerald-500 font-bold">{{ formatMoney(item.deductibleAmount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
