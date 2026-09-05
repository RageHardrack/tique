<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();
const isDrawerOpen = ref(false);

interface NavItem {
  name: string;
  label: string;
  path: string;
  icon: string;
}

const primaryNavItems: NavItem[] = [
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
];

const secondaryNavItems: NavItem[] = [
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
    name: 'loans',
    label: 'Préstamos',
    path: '/prestamos',
    icon: 'i-heroicons-scale',
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
  {
    name: 'tax',
    label: 'Impuestos',
    path: '/impuestos',
    icon: 'i-heroicons-document-currency-dollar',
  },
];

const currentPath = computed(() => route.path);

function toggleDrawer() {
  isDrawerOpen.value = !isDrawerOpen.value;
}

function closeDrawer() {
  isDrawerOpen.value = false;
}
</script>

<template>
  <div>
    <nav
      class="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center justify-around bg-white/95 dark:bg-[#0f1523]/95 backdrop-blur-xl border-t border-slate-200 dark:border-[#283a59]/80 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
    >
      <RouterLink
        v-for="item in primaryNavItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center flex-1 min-h-[44px] gap-1 px-1 py-1 rounded-xl text-[11px] font-semibold transition-all active:scale-95 select-none"
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

      <!-- More Options Button -->
      <button
        type="button"
        data-testid="more-nav-btn"
        class="flex flex-col items-center justify-center flex-1 min-h-[44px] gap-1 px-1 py-1 rounded-xl text-[11px] font-semibold transition-all active:scale-95 select-none"
        :class="
          isDrawerOpen || secondaryNavItems.some((s) => s.path === currentPath)
            ? 'text-[#2563EB] dark:text-sky-300 font-bold bg-[#2563EB]/10 dark:bg-sky-500/15'
            : 'text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
        "
        aria-label="Más secciones"
        @click="toggleDrawer"
      >
        <UIcon name="i-heroicons-bars-3" class="h-5 w-5" />
        <span class="tracking-tight">Más</span>
      </button>
    </nav>

    <!-- Nuxt UI Slideover / Drawer for Secondary Navigation -->
    <USlideover
      v-model:open="isDrawerOpen"
      side="bottom"
      :ui="{
        content: 'max-h-[80vh] rounded-t-3xl bg-white dark:bg-[#0f1523] p-5 space-y-4 border-t border-slate-200 dark:border-[#283a59]',
      }"
    >
      <template #content>
        <div class="space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <!-- Drawer Header -->
          <div class="flex items-center justify-between border-b border-slate-200 dark:border-[#283a59]/60 pb-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-squares-plus" class="w-5 h-5 text-primary-500" />
              <h2 class="text-base font-bold text-slate-900 dark:text-white">
                Más Secciones
              </h2>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="sm"
              aria-label="Cerrar menú"
              @click="closeDrawer"
            />
          </div>

          <!-- Secondary Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <RouterLink
              v-for="sub in secondaryNavItems"
              :key="sub.path"
              :to="sub.path"
              class="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-[#283a59] bg-slate-50 dark:bg-[#162032] hover:border-primary-500 transition-all active:scale-95"
              :class="
                currentPath === sub.path
                  ? 'border-primary-500 ring-1 ring-primary-500 bg-primary-500/10'
                  : ''
              "
              @click="closeDrawer"
            >
              <div
                class="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center text-primary-500"
              >
                <UIcon :name="sub.icon" class="w-5 h-5" />
              </div>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100">
                {{ sub.label }}
              </span>
            </RouterLink>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>
