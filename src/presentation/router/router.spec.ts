import { describe, expect, it, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import AccountsView from '../views/AccountsView.vue';
import TransactionsView from '../views/TransactionsView.vue';
import BudgetsView from '../views/BudgetsView.vue';
import SubscriptionsView from '../views/SubscriptionsView.vue';
import CategoriesView from '../views/CategoriesView.vue';

function createTestRouter() {
  const routes = [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', redirect: '/login' },
    { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/cuentas', name: 'accounts', component: AccountsView, meta: { requiresAuth: true } },
    { path: '/movimientos', name: 'transactions', component: TransactionsView, meta: { requiresAuth: true } },
    { path: '/presupuestos', name: 'budgets', component: BudgetsView, meta: { requiresAuth: true } },
    { path: '/metas', name: 'goals', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/suscripciones', name: 'subscriptions', component: SubscriptionsView, meta: { requiresAuth: true } },
    { path: '/categorias', name: 'categories', component: CategoriesView, meta: { requiresAuth: true } },
    { path: '/reportes', name: 'reports', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/admin/users', name: 'admin-users', component: DashboardView, meta: { requiresAuth: true, requiresAdmin: true } },
  ];

  const r = createRouter({
    history: createWebHistory(),
    routes,
  });

  r.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore();
    if (authStore.accessToken && !authStore.user) {
      await authStore.fetchMe();
    }
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next('/login');
    } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
      next('/dashboard');
    } else if (to.name === 'login' && authStore.isAuthenticated) {
      next('/dashboard');
    } else {
      next();
    }
  });

  return r;
}

describe('Vue Router - Route Protection and Navigation Guards', () => {
  let testRouter: ReturnType<typeof createTestRouter>;

  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    testRouter = createTestRouter();
  });

  const protectedRoutes = [
    { path: '/dashboard', name: 'dashboard' },
    { path: '/cuentas', name: 'accounts' },
    { path: '/movimientos', name: 'transactions' },
    { path: '/presupuestos', name: 'budgets' },
    { path: '/metas', name: 'goals' },
    { path: '/suscripciones', name: 'subscriptions' },
    { path: '/categorias', name: 'categories' },
    { path: '/reportes', name: 'reports' },
    { path: '/admin/users', name: 'admin-users' },
  ];

  protectedRoutes.forEach(({ path }) => {
    it(`should block unauthenticated access to ${path} and redirect to /login`, async () => {
      const authStore = useAuthStore();
      authStore.logout();

      await testRouter.push(path);
      await testRouter.isReady();

      expect(testRouter.currentRoute.value.path).toBe('/login');
    });
  });

  it('should redirect /register to /login', async () => {
    await testRouter.push('/register');
    await testRouter.isReady();
    expect(testRouter.currentRoute.value.path).toBe('/login');
  });

  it('should allow access to protected routes when authenticated', async () => {
    const authStore = useAuthStore();
    authStore.accessToken = 'valid-token';
    authStore.user = {
      id: 'u-1',
      email: 'daniel@lascar.dev',
      name: 'Daniel',
      role: 'USER',
      createdAt: '',
    };

    await testRouter.push('/cuentas');
    await testRouter.isReady();
    expect(testRouter.currentRoute.value.path).toBe('/cuentas');

    await testRouter.push('/dashboard');
    await testRouter.isReady();
    expect(testRouter.currentRoute.value.path).toBe('/dashboard');
  });

  it('should block non-admin user from accessing /admin/users and redirect to /dashboard', async () => {
    const authStore = useAuthStore();
    authStore.accessToken = 'valid-token';
    authStore.user = {
      id: 'u-1',
      email: 'user@lascar.dev',
      name: 'Regular User',
      role: 'USER',
      createdAt: '',
    };

    await testRouter.push('/admin/users');
    await testRouter.isReady();
    expect(testRouter.currentRoute.value.path).toBe('/dashboard');
  });

  it('should allow admin user to access /admin/users', async () => {
    const authStore = useAuthStore();
    authStore.accessToken = 'valid-token';
    authStore.user = {
      id: 'u-1',
      email: 'admin@lascar.dev',
      name: 'Admin User',
      role: 'ADMIN',
      createdAt: '',
    };

    await testRouter.push('/admin/users');
    await testRouter.isReady();
    expect(testRouter.currentRoute.value.path).toBe('/admin/users');
  });

  it('should redirect authenticated user from /login to /dashboard', async () => {
    const authStore = useAuthStore();
    authStore.accessToken = 'valid-token';
    authStore.user = {
      id: 'u-1',
      email: 'daniel@lascar.dev',
      name: 'Daniel',
      role: 'USER',
      createdAt: '',
    };

    await testRouter.push('/login');
    await testRouter.isReady();
    expect(testRouter.currentRoute.value.path).toBe('/dashboard');
  });
});
