<script setup lang="ts">
import { onMounted } from 'vue';
import TopNav from '../components/navigation/TopNav.vue';
import SidebarNav from '../components/navigation/SidebarNav.vue';
import MobileBottomNav from '../components/navigation/MobileBottomNav.vue';
import QuickAddFab from '../components/quick-add/QuickAddFab.vue';
import { useExchangeRateStore } from '../store/exchange-rates';

interface Props {
  title?: string;
  subtitle?: string;
}

defineProps<Props>();

const rateStore = useExchangeRateStore();

onMounted(() => {
  rateStore.fetchRates();
});
</script>

<template>
  <div
    class="flex min-h-screen bg-[#FAF7F2] dark:bg-[#0B0F19] text-slate-900 dark:text-[#f1f5f9] font-sans antialiased selection:bg-[#1B3E9B]/30"
  >
    <!-- Desktop Sidebar -->
    <SidebarNav class="hidden md:flex h-screen sticky top-0 shrink-0" />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
      <!-- Global Top Nav -->
      <TopNav :title="title" :subtitle="subtitle" />

      <!-- Page Content Slot -->
      <main class="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        <slot />
      </main>
    </div>

    <!-- Floating Quick Add Button & Bottom Sheet -->
    <QuickAddFab />

    <!-- Mobile Bottom Nav -->
    <MobileBottomNav />
  </div>
</template>
