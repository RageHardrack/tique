<script setup lang="ts">
import { ref } from 'vue';

import { useRouter } from 'vue-router';

import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';

const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const email = ref('');
const password = ref('');
const isPasswordVisible = ref(false);
const errorMessage = ref('');

async function handleSubmit() {
  errorMessage.value = '';
  try {
    await authStore.login(email.value.trim(), password.value);
    router.push('/dashboard');
  } catch (e) {
    errorMessage.value = (e as Error).message || 'Error al iniciar sesión';
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f1523] px-4 relative transition-colors"
  >
    <!-- Floating Theme Switcher -->
    <div class="absolute top-6 right-6">
      <UButton
        color="neutral"
        variant="subtle"
        :icon="themeStore.isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
        :aria-label="
          themeStore.isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'
        "
        @click="themeStore.toggleTheme"
      />
    </div>

    <UCard
      class="w-full max-w-md p-6 bg-white dark:bg-[#162032]/95 text-slate-900 dark:text-[#f1f5f9] rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-[#283a59]"
    >
      <template #header>
        <div
          class="flex flex-col items-center justify-center text-center space-y-2"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37]/25 to-[#1B3E9B]/30 border border-[#D4AF37]/40 text-[#D4AF37] shadow-md shadow-black/10 dark:shadow-black/30"
          >
            <UIcon name="i-heroicons-sparkles" class="h-7 w-7 text-[#D4AF37]" />
          </div>
          <div>
            <h1
              class="text-2xl font-black text-[#2B4162] dark:text-[#E0DDCF] tracking-tight"
            >
              Tique
            </h1>
            <p class="text-xs text-[#4D7EA8] font-medium mt-0.5">
              Gestión patrimonial y finanzas personales
            </p>
          </div>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 flex items-start gap-3 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          <UIcon
            name="i-heroicons-exclamation-circle"
            class="h-5 w-5 shrink-0 mt-0.5 text-red-500"
          />
          <div class="flex-1 font-medium leading-snug">
            {{ errorMessage }}
          </div>
        </div>

        <div>
          <label
            for="email"
            class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
          >
            Correo Electrónico
          </label>
          <UInput
            id="email"
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            required
            class="w-full"
            autocomplete="email"
          />
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label
              for="password"
              class="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Contraseña
            </label>
          </div>
          <div class="relative">
            <UInput
              id="password"
              v-model="password"
              :type="isPasswordVisible ? 'text' : 'password'"
              placeholder="••••••••"
              required
              class="w-full pr-10"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              :aria-label="
                isPasswordVisible ? 'Ocultar contraseña' : 'Ver contraseña'
              "
              @click="isPasswordVisible = !isPasswordVisible"
            >
              <UIcon
                :name="
                  isPasswordVisible
                    ? 'i-heroicons-eye-slash'
                    : 'i-heroicons-eye'
                "
                class="h-4 w-4"
              />
            </button>
          </div>
        </div>

        <UButton
          type="submit"
          block
          color="primary"
          :loading="authStore.isLoading"
          class="mt-2"
        >
          Iniciar Sesión
        </UButton>
      </form>
    </UCard>
  </div>
</template>
