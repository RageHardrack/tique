<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

import AppLayout from '../layouts/AppLayout.vue';
import { useConfirm } from '../composables/useConfirm';
import { useMcpTokensStore } from '../store/mcp-tokens';
import type { McpTokenView } from '../../core/entities/McpToken';
import McpTokenList from '../components/integrations/McpTokenList.vue';
import McpTokenCreateForm from '../components/integrations/McpTokenCreateForm.vue';
import McpIssuedTokenPanel from '../components/integrations/McpIssuedTokenPanel.vue';

const mcpStore = useMcpTokensStore();
const { confirm: confirmDialog } = useConfirm();
const createForm = ref<InstanceType<typeof McpTokenCreateForm> | null>(null);

onMounted(() => {
  void mcpStore.fetchTokens();
});

// Leaving the view closes the panel for good: the plaintext never survives
// the navigation (S11).
onBeforeUnmount(() => {
  mcpStore.clearIssuedToken();
});

async function handleCreate(name: string) {
  const issued = await mcpStore.createToken(name);
  if (issued) {
    createForm.value?.reset();
  }
}

function handleCloseIssued() {
  mcpStore.clearIssuedToken();
}

async function handleRevoke(token: McpTokenView) {
  const confirmed = await confirmDialog({
    title: 'Revocar token',
    message: `¿Revocar "${token.name}"? Las conexiones que lo usen dejarán de funcionar de inmediato y el valor no se puede recuperar.`,
    confirmText: 'Revocar',
    variant: 'danger',
  });

  if (confirmed) {
    await mcpStore.revokeToken(token.id);
  }
}
</script>

<template>
  <AppLayout
    title="Integraciones"
    subtitle="Tokens de MCP para conectar tus finanzas con agentes externos"
  >
    <div class="space-y-6">
      <div
        v-if="mcpStore.error"
        data-testid="integrations-error"
        class="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-2xl text-sm font-semibold"
      >
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="h-5 w-5 shrink-0"
        />
        <span>{{ mcpStore.error }}</span>
      </div>

      <McpTokenCreateForm
        ref="createForm"
        :is-busy="mcpStore.isLoading"
        @create="handleCreate"
      />

      <McpIssuedTokenPanel
        v-if="mcpStore.issuedToken"
        :issued="mcpStore.issuedToken"
        :endpoint-url="mcpStore.endpointUrl"
        @close="handleCloseIssued"
      />

      <McpTokenList
        :tokens="mcpStore.tokens"
        :is-loading="mcpStore.isLoading"
        @revoke="handleRevoke"
      />
    </div>
  </AppLayout>
</template>
