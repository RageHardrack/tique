import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const isSidebarCollapsed = ref<boolean>(
    localStorage.getItem('tique_sidebar_collapsed') === 'true'
  );

  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
    localStorage.setItem('tique_sidebar_collapsed', String(isSidebarCollapsed.value));
  }

  function setSidebarCollapsed(collapsed: boolean) {
    isSidebarCollapsed.value = collapsed;
    localStorage.setItem('tique_sidebar_collapsed', String(collapsed));
  }

  return {
    isSidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
  };
});
