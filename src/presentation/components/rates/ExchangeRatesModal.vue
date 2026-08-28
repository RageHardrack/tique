<script setup lang="ts">
import { reactive, watch } from 'vue';

import { useExchangeRateStore } from '../../store/exchange-rates';

const open = defineModel<boolean>('open', { default: false });

const rateStore = useExchangeRateStore();

const form = reactive({
  PEN: rateStore.rates.PEN,
  VES: rateStore.rates.VES,
});

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      form.PEN = rateStore.rates.PEN;
      form.VES = rateStore.rates.VES;
    }
  },
);

function handleSave() {
  if (form.PEN > 0) rateStore.updateRate('PEN', Number(form.PEN));
  if (form.VES > 0) rateStore.updateRate('VES', Number(form.VES));
  open.value = false;
}

function handleReset() {
  rateStore.resetRates();
  form.PEN = rateStore.rates.PEN;
  form.VES = rateStore.rates.VES;
}
</script>

<template>
  <UModal v-model:open="open" title="Tasas de Cambio" :dismissible="false">
    <template #body>
      <div class="space-y-4">
        <p class="text-xs text-slate-400">
          Personalizá las tasas de cambio de referencia respecto al Dólar
          americano (USD). Los saldos y conversiones del dashboard se
          recalcularán automáticamente.
        </p>

        <div class="space-y-3">
          <!-- USD (Base reference) -->
          <div
            class="flex items-center justify-between rounded-lg border border-[#283a59] bg-[#0f1523] p-3"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-sm font-bold text-white">USD</span>
              <span class="text-xs text-[#94a3b8]">Dólar americano (Base)</span>
            </div>
            <span class="text-sm font-semibold text-[#D4AF37]">1.00 USD</span>
          </div>

          <!-- PEN -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#283a59] bg-[#0f1523] p-3"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white">PEN</span>
                <span class="text-xs text-[#94a3b8]">Sol peruano (S/)</span>
              </div>
              <span class="text-xs text-[#4D7EA8]">1 USD equivale a:</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-slate-300">S/</span>
              <UInput
                v-model.number="form.PEN"
                type="number"
                step="0.01"
                min="0.01"
                class="w-28 text-right font-bold"
              />
            </div>
          </div>

          <!-- VES -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#283a59] bg-[#0f1523] p-3"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white">VES</span>
                <span class="text-xs text-[#94a3b8]"
                  >Bolívar venezolano (Bs.)</span
                >
              </div>
              <span class="text-xs text-[#4D7EA8]">1 USD equivale a:</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-slate-300">Bs.</span>
              <UInput
                v-model.number="form.VES"
                type="number"
                step="0.1"
                min="0.1"
                class="w-28 text-right font-bold"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-heroicons-arrow-path"
          @click="handleReset"
        >
          Restablecer
        </UButton>

        <div class="flex gap-2">
          <UButton color="neutral" variant="ghost" @click="open = false">
            Cancelar
          </UButton>
          <UButton color="primary" @click="handleSave"> Guardar Tasas </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
