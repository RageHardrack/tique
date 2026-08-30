import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from '../store/auth';
import LoginView from '../views/LoginView.vue';
import BudgetsView from '../views/BudgetsView.vue';
import AccountsView from '../views/AccountsView.vue';
import DashboardView from '../views/DashboardView.vue';
import CategoriesView from '../views/CategoriesView.vue';
import TransactionsView from '../views/TransactionsView.vue';
import SubscriptionsView from '../views/SubscriptionsView.vue';
import ReportsView from '../views/ReportsView.vue';
import GoalsView from '../views/GoalsView.vue';
import LoansView from '../views/LoansView.vue';
import TaxView from '../views/TaxView.vue';
import AdminUsersView from '../views/AdminUsersView.vue';

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/register',
    redirect: '/login',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/cuentas',
    name: 'accounts',
    component: AccountsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/movimientos',
    name: 'transactions',
    component: TransactionsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/presupuestos',
    name: 'budgets',
    component: BudgetsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/metas',
    name: 'goals',
    component: GoalsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/suscripciones',
    name: 'subscriptions',
    component: SubscriptionsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/prestamos',
    name: 'loans',
    component: LoansView,
    meta: { requiresAuth: true },
  },
  {
    path: '/impuestos',
    name: 'tax',
    component: TaxView,
    meta: { requiresAuth: true },
  },
  {
    path: '/categorias',
    name: 'categories',
    component: CategoriesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/reportes',
    name: 'reports',
    component: ReportsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: AdminUsersView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  if (authStore.accessToken && !authStore.user) {
    await authStore.fetchMe();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/dashboard');
  } else if (to.name === 'tax' && (!authStore.user?.taxProfileEnabled || authStore.user?.taxCountry !== 'PE')) {
    next('/dashboard');
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});
