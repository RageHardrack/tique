<script setup lang="ts">
import { computed } from 'vue';

import { useRoute } from 'vue-router';

const route = useRoute();

interface NavItem {
  name: string;
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  {
    name: 'dashboard',
    label: 'Inicio',
    path: '/dashboard',
    icon: 'i-heroicons-squares-2x2',
  },
  {
    name: 'accounts',
    label: 'Cuentas',
    path: '/cuentas',
    icon: 'i-heroicons-credit-card',
  },
  {
    name: 'transactions',
    label: 'Movimientos',
    path: '/movimientos',
    icon: 'i-heroicons-arrows-right-left',
  },
  {
    name: 'budgets',
    label: 'Presupuestos',
    path: '/presupuestos',
    icon: 'i-heroicons-chart-pie',
  },
  {
    name: 'goals',
    label: 'Metas',
    path: '/metas',
    icon: 'i-heroicons-banknotes',
  },
  {
    name: 'subscriptions',
    label: 'Suscripciones',
    path: '/suscripciones',
    icon: 'i-heroicons-arrow-path',
  },
  {
    name: 'categories',
    label: 'Categorías',
    path: '/categorias',
    icon: 'i-heroicons-tag',
  },
  {
    name: 'reports',
    label: 'Reportes',
    path: '/reportes',
    icon: 'i-heroicons-presentation-chart-line',
  },
];

const currentPath = computed(() => route.path);
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center justify-around bg-white/95 dark:bg-[#0f1523]/95 backdrop-blur-xl border-t border-slate-200 dark:border-[#283a59]/80 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
  >
    <RouterLink
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="flex flex-col items-center justify-center min-w-[52px] min-h-[44px] gap-1 px-1.5 py-1 rounded-xl text-[10px] font-semibold transition-all active:scale-90 select-none"
      :class="
        currentPath === item.path
          ? 'text-[#2563EB] dark:text-sky-300 font-bold bg-[#2563EB]/10 dark:bg-sky-500/15'
          : 'text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
      "
    >
      <UIcon
        :name="item.icon"
        class="h-5 w-5 transition-transform"
        :class="currentPath === item.path ? 'scale-110' : ''"
      />
      <span class="tracking-tight">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
