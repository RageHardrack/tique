<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import { useUiStore } from '../../store/ui.store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();

interface NavItem {
  name: string;
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  {
    name: 'dashboard',
    label: 'Resumen General',
    path: '/dashboard',
    icon: 'i-heroicons-squares-2x2',
  },
  {
    name: 'accounts',
    label: 'Cuentas & Saldos',
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
    label: 'Metas de Ahorro',
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
    label: 'Préstamos & Deudas',
    path: '/prestamos',
    icon: 'i-heroicons-user-group',
  },
  {
    name: 'tax',
    label: 'Impuestos & SUNAT',
    path: '/impuestos',
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
];

const displayedNavItems = computed(() => {
  let items = [...navItems];

  // Solo mostrar el módulo de Impuestos & SUNAT si el usuario lo tiene explícitamente activado para Perú
  if (!authStore.user?.taxProfileEnabled || authStore.user?.taxCountry !== 'PE') {
    items = items.filter((item) => item.name !== 'tax');
  }

  if (authStore.isAdmin) {
    items.push({
      name: 'admin-users',
      label: 'Usuarios & Accesos',
      path: '/admin/users',
      icon: 'i-heroicons-shield-check',
    });
  }
  return items;
});

const currentPath = computed(() => route.path);

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <aside
    class="flex flex-col justify-between h-screen border-r border-slate-200 dark:border-[#283a59]/60 bg-white/80 dark:bg-[#0f1523]/80 backdrop-blur-xl transition-all duration-300 select-none"
    :class="uiStore.isSidebarCollapsed ? 'w-20 p-3' : 'w-64 p-4'"
  >
    <!-- Brand / Header & Scrollable Links -->
    <div class="flex-1 flex flex-col min-h-0 space-y-4 overflow-hidden">
      <!-- Brand & Collapse Toggle -->
      <div
        class="flex items-center shrink-0"
        :class="uiStore.isSidebarCollapsed ? 'justify-center' : 'px-2'"
      >
        <div class="flex items-center gap-3 min-w-0">
          <button
            type="button"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#1B3E9B] to-[#4D7EA8] text-[#E0DDCF] shadow-md shadow-[#1B3E9B]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#1B3E9B]/50"
            :title="uiStore.isSidebarCollapsed ? 'Expandir barra lateral' : 'Plegar barra lateral'"
            @click="uiStore.toggleSidebar"
          >
            <UIcon
              name="i-heroicons-sparkles"
              class="h-6 w-6 transition-transform group-hover:rotate-12"
            />
          </button>
          <div v-if="!uiStore.isSidebarCollapsed" class="min-w-0">
            <h1
              class="text-xl font-black tracking-tight text-[#2B4162] dark:text-[#FAF7F2] truncate"
            >
              Tique
            </h1>
            <p class="text-[11px] font-medium text-slate-500 dark:text-[#4D7EA8] truncate">
              Finanzas & Patrimonio
            </p>
          </div>
        </div>
      </div>

      <!-- Navigation Links (Scrollable if height is small) -->
      <nav class="space-y-1 overflow-y-auto flex-1 pr-1">
        <RouterLink
          v-for="item in displayedNavItems"
          :key="item.path"
          :to="item.path"
          :title="uiStore.isSidebarCollapsed ? item.label : undefined"
          class="flex items-center rounded-xl text-sm font-semibold transition-all group min-h-[40px]"
          :class="[
            uiStore.isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
            currentPath === item.path
              ? 'bg-[#1B3E9B]/10 dark:bg-[#1B3E9B]/25 text-[#1B3E9B] dark:text-sky-300 shadow-sm border border-[#1B3E9B]/20 dark:border-[#1B3E9B]/40'
              : 'text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#162032] hover:text-slate-900 dark:hover:text-white',
          ]"
        >
          <UIcon
            :name="item.icon"
            class="h-5 w-5 shrink-0 transition-transform group-hover:scale-110"
            :class="
              currentPath === item.path
                ? 'text-[#1B3E9B] dark:text-sky-300'
                : 'text-slate-400 dark:text-slate-500'
            "
          />
          <span v-if="!uiStore.isSidebarCollapsed" class="truncate">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </div>

    <!-- User & Logout Footer (Pinned at Bottom) -->
    <div
      class="pt-3 border-t border-slate-200 dark:border-[#283a59]/60 shrink-0"
      :class="uiStore.isSidebarCollapsed ? 'flex flex-col items-center space-y-2' : 'space-y-3 px-1'"
    >
      <div
        class="flex items-center"
        :class="uiStore.isSidebarCollapsed ? 'justify-center' : 'gap-2.5'"
        :title="uiStore.isSidebarCollapsed ? `${authStore.user?.name || 'Usuario'} (${authStore.user?.email || ''})` : undefined"
      >
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-[#162032] border border-slate-200 dark:border-[#283a59] text-[#1B3E9B] dark:text-sky-400 font-bold text-xs"
        >
          {{
            authStore.user?.name
              ? authStore.user.name.charAt(0).toUpperCase()
              : 'U'
          }}
        </div>
        <div v-if="!uiStore.isSidebarCollapsed" class="flex-1 min-w-0">
          <p
            class="text-xs font-bold text-slate-900 dark:text-slate-200 truncate"
          >
            {{ authStore.user?.name || 'Usuario' }}
          </p>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {{ authStore.user?.email }}
          </p>
        </div>
      </div>

      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-heroicons-arrow-right-on-rectangle"
        class="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        :class="uiStore.isSidebarCollapsed ? 'w-9 h-9 p-0 justify-center' : 'w-full justify-start'"
        :title="uiStore.isSidebarCollapsed ? 'Cerrar Sesión' : undefined"
        @click="handleLogout"
      >
        <span v-if="!uiStore.isSidebarCollapsed">Cerrar Sesión</span>
      </UButton>
    </div>
  </aside>
</template>
