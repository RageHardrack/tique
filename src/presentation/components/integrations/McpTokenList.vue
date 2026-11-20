<script setup lang="ts">
import type { McpTokenView } from '../../../core/entities/McpToken';
import { DateFormatter } from '../../../core/services/DateFormatter';

interface Props {
  tokens: McpTokenView[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isLoading: false });

const emit = defineEmits<{
  (e: 'revoke', token: McpTokenView): void;
}>();

function lastUseLabel(token: McpTokenView): string {
  if (!token.lastUsedAt) return 'Nunca';
  return DateFormatter.format(token.lastUsedAt);
}

function createdLabel(token: McpTokenView): string {
  return DateFormatter.format(token.createdAt);
}
</script>

<template>
  <section
    class="bg-white dark:bg-[#162032] rounded-2xl border border-slate-200 dark:border-[#283a59]/60 shadow-sm overflow-hidden"
    aria-labelledby="mcp-token-list-title"
  >
    <div class="p-4 sm:p-5 border-b border-slate-100 dark:border-[#283a59]/40">
      <h2
        id="mcp-token-list-title"
        class="text-base sm:text-lg font-bold text-slate-900 dark:text-[#FAF7F2]"
      >
        Tokens de MCP
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Nombre, creación, último uso y estado. El valor del token no se conserva
        ni se vuelve a mostrar.
      </p>
    </div>

    <div
      v-if="props.isLoading && props.tokens.length === 0"
      class="p-12 text-center"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="h-8 w-8 animate-spin mx-auto text-primary-500 mb-2"
      />
      <p class="text-sm font-semibold text-slate-500">Cargando tokens...</p>
    </div>

    <div
      v-else-if="props.tokens.length === 0"
      class="p-12 text-center space-y-2"
    >
      <UIcon name="i-heroicons-key" class="h-10 w-10 mx-auto text-slate-400" />
      <p class="text-base font-bold text-slate-800 dark:text-slate-200">
        Aún no tienes tokens
      </p>
      <p class="text-xs text-slate-500">
        Crea uno para conectar a Hermes con tus finanzas reales.
      </p>
    </div>

    <ul v-else class="divide-y divide-slate-100 dark:divide-[#283a59]/40">
      <li
        v-for="token in props.tokens"
        :key="token.id"
        data-testid="mcp-token-row"
        class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="min-w-0 space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h3
              class="text-sm font-bold text-slate-900 dark:text-slate-100 truncate"
            >
              {{ token.name }}
            </h3>
            <span
              class="px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider"
              :class="
                token.isRevoked
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30'
              "
            >
              {{ token.isRevoked ? 'Revocado' : 'Activo' }}
            </span>
          </div>

          <dl
            class="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400"
          >
            <div class="flex items-center gap-1">
              <dt class="font-semibold">Creado:</dt>
              <dd>{{ createdLabel(token) }}</dd>
            </div>
            <div class="flex items-center gap-1">
              <dt class="font-semibold">Último uso:</dt>
              <dd>{{ lastUseLabel(token) }}</dd>
            </div>
          </dl>
        </div>

        <UButton
          v-if="!token.isRevoked"
          color="error"
          variant="ghost"
          size="xs"
          icon="i-heroicons-no-symbol"
          data-testid="revoke-token-btn"
          class="self-end sm:self-center min-h-[44px] font-bold"
          @click="emit('revoke', token)"
        >
          Revocar
        </UButton>
      </li>
    </ul>
  </section>
</template>
