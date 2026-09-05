<script setup lang="ts">
import ConfirmModal from './presentation/components/common/ConfirmModal.vue';
import { usePwaStore } from './presentation/store/pwa';

const pwaStore = usePwaStore();
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 overflow-x-hidden">
    <router-view />
    <ConfirmModal />

    <!-- PWA Update Notification Prompt -->
    <div
      v-if="pwaStore.needRefresh"
      class="fixed bottom-4 right-4 bg-slate-800 border border-slate-700 shadow-xl rounded-lg p-4 max-w-sm flex flex-col gap-2 z-50 alert-prompt"
    >
      <div class="text-sm font-semibold text-white">
        ¡Nueva versión disponible!
      </div>
      <div class="text-xs text-slate-400">
        Actualice la aplicación para obtener las últimas funciones.
      </div>
      <div class="flex gap-2 justify-end mt-2">
        <button
          @click="pwaStore.closePrompt"
          class="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
        >
          Descartar
        </button>
        <button
          @click="pwaStore.updateApp"
          class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
        >
          Actualizar
        </button>
      </div>
    </div>
  </div>
</template>
