<script setup lang="ts">
import { computed } from 'vue';

import { useClipboard } from '@vueuse/core';

interface Props {
  text: string;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Copiar',
});

const { copy, copied } = useClipboard({ legacy: true });

const buttonLabel = computed(() => (copied.value ? 'Copiado' : props.label));

async function handleCopy() {
  try {
    await copy(props.text);
  } catch {
    // The browser refused the clipboard; the label stays as "Copiar".
  }
}
</script>

<template>
  <UButton
    color="neutral"
    variant="soft"
    size="xs"
    icon="i-heroicons-clipboard-document"
    data-testid="copy-btn"
    class="min-h-[36px] font-bold"
    :aria-label="buttonLabel"
    :title="buttonLabel"
    @click="handleCopy"
  >
    {{ buttonLabel }}
  </UButton>
</template>
