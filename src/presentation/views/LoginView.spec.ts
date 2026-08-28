import { describe, expect, it, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import LoginView from './LoginView.vue';
import { useAuthStore } from '../store/auth';

const pushMock = vi.fn();

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({
      push: pushMock,
    }),
    useRoute: () => ({
      path: '/login',
      name: 'login',
      params: {},
      query: {},
    }),
  };
});

describe('LoginView.vue - UX and Authentication Handling', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    pushMock.mockClear();
    vi.restoreAllMocks();
  });

  it('should render login form with email, password inputs, submit button and without register link', () => {
    const wrapper = mount(LoginView);

    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('#password').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Registrate');
    expect(wrapper.text()).not.toContain('¿No tenés una cuenta?');
  });

  it('should toggle password visibility on eye button click', async () => {
    const wrapper = mount(LoginView);
    const passwordInput = wrapper.find('#password');
    const toggleButton = wrapper.find('button[aria-label="Ver contraseña"]');

    expect(passwordInput.attributes('type')).toBe('password');
    expect(toggleButton.exists()).toBe(true);

    await toggleButton.trigger('click');
    expect(wrapper.find('#password').attributes('type')).toBe('text');

    const hideButton = wrapper.find('button[aria-label="Ocultar contraseña"]');
    await hideButton.trigger('click');
    expect(wrapper.find('#password').attributes('type')).toBe('password');
  });

  it('should display modern error alert when login fails with invalid credentials', async () => {
    const wrapper = mount(LoginView);
    const authStore = useAuthStore();

    vi.spyOn(authStore, 'login').mockRejectedValueOnce(
      new Error('Credenciales inválidas.')
    );

    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('#password');

    await emailInput.setValue('wrong@lascar.dev');
    await passwordInput.setValue('wrongpass');

    await wrapper.find('form').trigger('submit.prevent');

    expect(authStore.login).toHaveBeenCalledWith('wrong@lascar.dev', 'wrongpass');
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.find('[role="alert"]').text()).toContain('Credenciales inválidas.');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('should redirect to /dashboard when login succeeds', async () => {
    const wrapper = mount(LoginView);
    const authStore = useAuthStore();

    vi.spyOn(authStore, 'login').mockResolvedValueOnce({
      id: 'user-1',
      email: 'daniel@lascar.dev',
      name: 'Daniel Colmenares',
      role: 'ADMIN' as const,
      createdAt: '',
    });

    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('#password');

    await emailInput.setValue('daniel@lascar.dev');
    await passwordInput.setValue('admin123456');

    await wrapper.find('form').trigger('submit.prevent');

    expect(authStore.login).toHaveBeenCalledWith('daniel@lascar.dev', 'admin123456');
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
});
