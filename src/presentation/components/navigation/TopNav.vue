<script setup lang="ts">
import { computed, ref } from 'vue';

import { useThemeStore } from '../../store/theme';
import ExchangeRatesModal from '../rates/ExchangeRatesModal.vue';
import { useExchangeRateStore } from '../../store/exchange-rates';
import { SUPPORTED_CURRENCIES } from '../../../core/services/CurrencyFormatter';

interface Props {
  title?: string;
  subtitle?: string;
}

defineProps<Props>();

const rateStore = useExchangeRateStore();
const themeStore = useThemeStore();
const isExchangeRatesOpen = ref(false);

const currencyOptions = computed(() =>
  SUPPORTED_CURRENCIES.map((c) => ({
    label: `${c.code} (${c.symbol})`,
    value: c.code,
  })),
);
</script>

<template>
  <header
    class="sticky top-0 z-10 flex items-center justify-between px-3.5 sm:px-6 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2.5 sm:pb-4 border-b border-slate-200 dark:border-[#283a59]/60 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl transition-all"
  >
    <!-- View Title & Subtitle -->
    <div class="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
      <div class="min-w-0 flex-1">
        <h1
          class="text-base sm:text-xl font-black text-slate-900 dark:text-[#f1f5f9] tracking-tight truncate"
        >
          {{ title || 'Tique' }}
        </h1>
        <p
          v-if="subtitle"
          class="text-[11px] sm:text-xs text-slate-500 dark:text-[#4D7EA8] truncate"
        >
          {{ subtitle }}
        </p>
      </div>
    </div>

    <!-- Quick Actions Toolbar -->
    <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
      <!-- Dark/Light Theme Toggle -->
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        :icon="themeStore.isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
        :title="
          themeStore.isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
        "
        aria-label="Cambiar tema de color"
        class="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center cursor-pointer"
        @click="themeStore.toggleTheme"
      />

      <!-- Base Currency Selector -->
      <div class="flex items-center">
        <USelect
          v-model="rateStore.baseCurrency"
          :items="currencyOptions"
          value-key="value"
          size="sm"
          color="neutral"
          variant="outline"
          class="w-[78px] sm:w-32 font-bold text-xs"
          aria-label="Moneda base"
        />
      </div>

      <!-- Exchange Rates Modal Trigger -->
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        icon="i-heroicons-arrows-right-left"
        aria-label="Tasas de cambio"
        class="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center font-semibold cursor-pointer"
        @click="isExchangeRatesOpen = true"
      >
        <span class="hidden sm:inline">Tasas</span>
      </UButton>
    </div>

    <!-- Exchange Rates Modal -->
    <ExchangeRatesModal
      v-model:open="isExchangeRatesOpen"
      :rates="rateStore.rates"
      :base-currency="rateStore.baseCurrency"
    />
  </header>
</template>
