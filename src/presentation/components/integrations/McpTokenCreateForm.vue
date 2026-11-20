<script setup lang="ts">
import { ref } from 'vue';

import {
  MCP_TOKEN_NAME_MAX_LENGTH,
  validateMcpTokenName,
} from '../../../core/services/McpTokenService';

interface Props {
  isBusy?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isBusy: false });

const emit = defineEmits<{
  (e: 'create', name: string): void;
}>();

const name = ref('');
const fieldError = ref<string | null>(null);

function handleSubmit() {
  const invalid = validateMcpTokenName(name.value);
  if (invalid) {
    fieldError.value = invalid;
    return;
  }

  fieldError.value = null;
  emit('create', name.value.trim());
}

/** Lets the parent clear the field once the token was created. */
function reset() {
  name.value = '';
  fieldError.value = null;
}

defineExpose({ reset });
</script>

<template>
  <section
    class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59]/60 shadow-sm space-y-4"
    aria-labelledby="mcp-token-create-title"
  >
    <div>
      <h2
        id="mcp-token-create-title"
        class="text-base sm:text-lg font-bold text-slate-900 dark:text-[#FAF7F2]"
      >
        Nuevo token
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Un nombre reconocible para saber qué conexión usa cada token, hasta
        {{ MCP_TOKEN_NAME_MAX_LENGTH }} caracteres.
      </p>
    </div>

    <div class="space-y-3">
      <label
        class="block text-xs font-bold text-slate-700 dark:text-slate-300"
        for="mcp-token-name"
      >
        Nombre del token
      </label>

      <UInput
        id="mcp-token-name"
        v-model="name"
        data-testid="token-name-input"
        type="text"
        placeholder="Ej. Hermes laptop"
        autocomplete="off"
        class="w-full"
        @update:model-value="fieldError = null"
        @keyup.enter="handleSubmit"
      />

      <p
        v-if="fieldError"
        data-testid="token-name-error"
        class="text-xs font-semibold text-rose-600 dark:text-rose-400"
      >
        {{ fieldError }}
      </p>

      <UButton
        data-testid="create-token-btn"
        color="primary"
        size="md"
        icon="i-heroicons-key"
        class="w-full sm:w-auto justify-center font-bold min-h-[44px]"
        :loading="props.isBusy"
        @click="handleSubmit"
      >
        Crear token
      </UButton>
    </div>
  </section>
</template>
