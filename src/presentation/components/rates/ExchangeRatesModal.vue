<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import { useExchangeRateStore } from '../../store/exchange-rates';
import { useAuthStore } from '../../store/auth';

const open = defineModel<boolean>('open', { default: false });

const rateStore = useExchangeRateStore();
const authStore = useAuthStore();

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

async function handleSyncOfficial() {
  await rateStore.syncRates(authStore.accessToken);
  form.PEN = rateStore.rates.PEN;
  form.VES = rateStore.rates.VES;
}

const formattedLastUpdate = computed(() => {
  if (!rateStore.lastUpdated) return 'Pendiente de sincronización';
  try {
    const d = new Date(rateStore.lastUpdated);
    return d.toLocaleString('es-VE', {
      timeZone: 'America/Caracas',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return rateStore.lastUpdated;
  }
});
</script>

<template>
  <UModal v-model:open="open" title="Tasas de Cambio Oficiales" :dismissible="false">
    <template #body>
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs text-slate-400">
          <p>
            Actualización automática todos los días a las <strong class="text-white">8:00 PM (hora Caracas)</strong> desde fuentes oficiales.
          </p>
        </div>

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

          <!-- PEN (SUNAT) -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#283a59] bg-[#0f1523] p-3"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white">PEN</span>
                <span class="text-xs text-[#94a3b8]">Sol peruano (S/)</span>
                <span
                  class="px-1.5 py-0.5 text-[10px] font-bold rounded"
                  :class="
                    rateStore.sources.PEN === 'SUNAT'
                      ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                      : 'bg-slate-800 text-slate-400'
                  "
                >
                  {{ rateStore.sources.PEN === 'SUNAT' ? 'Oficial SUNAT' : rateStore.sources.PEN }}
                </span>
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

          <!-- VES (BCV) -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#283a59] bg-[#0f1523] p-3"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white">VES</span>
                <span class="text-xs text-[#94a3b8]">Bolívar venezolano (Bs.)</span>
                <span
                  class="px-1.5 py-0.5 text-[10px] font-bold rounded"
                  :class="
                    rateStore.sources.VES === 'BCV'
                      ? 'bg-sky-950/70 text-sky-400 border border-sky-800/50'
                      : 'bg-slate-800 text-slate-400'
                  "
                >
                  {{ rateStore.sources.VES === 'BCV' ? 'Oficial BCV' : rateStore.sources.VES }}
                </span>
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

        <!-- Sync metadata footer -->
        <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
          <span>Última sincronización: <strong class="text-slate-200">{{ formattedLastUpdate }}</strong></span>
          <UButton
            color="primary"
            variant="soft"
            size="xs"
            icon="i-heroicons-arrow-path"
            :loading="rateStore.isSyncing"
            @click="handleSyncOfficial"
          >
            Sincronizar ahora
          </UButton>
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
