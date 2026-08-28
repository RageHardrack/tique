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
    class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#283a59]/60 bg-white/70 dark:bg-[#0B0F19]/70 backdrop-blur-xl transition-all"
  >
    <!-- View Title & Subtitle -->
    <div class="flex items-center gap-3">
      <div>
        <h1
          class="text-xl font-black text-slate-900 dark:text-[#f1f5f9] tracking-tight"
        >
          {{ title || 'Tique' }}
        </h1>
        <p v-if="subtitle" class="text-xs text-slate-500 dark:text-[#4D7EA8]">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <!-- Quick Actions Toolbar -->
    <div class="flex items-center gap-3">
      <!-- Dark/Light Theme Toggle -->
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        :icon="themeStore.isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
        :title="
          themeStore.isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
        "
        @click="themeStore.toggleTheme"
      />

      <!-- Base Currency Selector -->
      <div class="flex items-center gap-1.5">
        <USelect
          v-model="rateStore.baseCurrency"
          :items="currencyOptions"
          value-key="value"
          size="sm"
          color="neutral"
          variant="outline"
          class="w-32 font-bold text-xs"
        />
      </div>

      <!-- Exchange Rates Modal Trigger -->
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        icon="i-heroicons-arrows-right-left"
        @click="isExchangeRatesOpen = true"
      >
        Tasas
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
