import { ref } from 'vue';

import { defineStore } from 'pinia';

import { registerSW } from 'virtual:pwa-register';

export const usePwaStore = defineStore('pwa', () => {
  const needRefresh = ref(false);
  const offlineReady = ref(false);

  const updateSW = registerSW({
    onNeedRefresh() {
      needRefresh.value = true;
    },
    onOfflineReady() {
      offlineReady.value = true;
    },
  });

  const closePrompt = () => {
    needRefresh.value = false;
  };

  const updateApp = () => {
    updateSW(true);
  };

  return {
    needRefresh,
    offlineReady,
    closePrompt,
    updateApp,
  };
});
