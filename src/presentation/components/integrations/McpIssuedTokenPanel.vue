<script setup lang="ts">
import { computed } from 'vue';

import McpTokenCopyButton from './McpTokenCopyButton.vue';
import type { McpIssuedToken } from '../../../core/entities/McpToken';
import {
  hermesConfigYaml,
  hermesEnvLine,
} from '../../../core/services/McpTokenService';

interface Props {
  issued: McpIssuedToken;
  endpointUrl: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const configYaml = computed(() => hermesConfigYaml(props.endpointUrl));
const envLine = computed(() => hermesEnvLine(props.issued.token));
</script>

<template>
  <section
    data-testid="issued-token-panel"
    class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#162032] border border-emerald-500/40 shadow-sm space-y-4"
    aria-labelledby="issued-token-title"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h2
          id="issued-token-title"
          class="text-base sm:text-lg font-bold text-slate-900 dark:text-[#FAF7F2] truncate"
        >
          Token creado: {{ props.issued.name }}
        </h2>
        <p class="text-xs font-semibold text-amber-700 dark:text-amber-400">
          El token solo se muestra una vez. Guárdalo ahora; no se podrá volver a
          consultar.
        </p>
      </div>

      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-heroicons-x-mark"
        data-testid="close-issued-panel"
        aria-label="Cerrar y ocultar el token"
        @click="emit('close')"
      />
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300">
          Token de acceso
        </h3>
        <McpTokenCopyButton :text="props.issued.token" />
      </div>
      <p
        class="p-3 rounded-xl bg-slate-900 dark:bg-[#0f1523] text-emerald-300 font-mono text-xs break-all"
      >
        {{ props.issued.token }}
      </p>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300">
          config.yaml de Hermes
        </h3>
        <McpTokenCopyButton :text="configYaml" />
      </div>
      <pre
        class="p-3 rounded-xl bg-slate-900 dark:bg-[#0f1523] text-slate-100 font-mono text-xs overflow-x-auto"
      ><code>{{ configYaml }}</code></pre>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300">
          ~/.hermes/.env
        </h3>
        <McpTokenCopyButton :text="envLine" />
      </div>
      <p
        class="p-3 rounded-xl bg-slate-900 dark:bg-[#0f1523] text-slate-100 font-mono text-xs break-all"
      >
        {{ envLine }}
      </p>
    </div>
  </section>
</template>
