<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useAuthStore } from '../store/auth';
import AppLayout from '../layouts/AppLayout.vue';
import {
  AdminUserService,
  type AdminUserSummary,
  type CreateAdminUserPayload,
} from '../../core/services/AdminUserService';

const authStore = useAuthStore();

const users = ref<AdminUserSummary[]>([]);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const searchQuery = ref('');
const selectedRoleFilter = ref<'ALL' | 'ADMIN' | 'USER'>('ALL');
const selectedStatusFilter = ref<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

// Modals state
const isCreateModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isResetPasswordModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const selectedUser = ref<AdminUserSummary | null>(null);

// Forms
const createForm = ref<CreateAdminUserPayload>({
  email: '',
  password: '',
  name: '',
  role: 'USER',
  isActive: true,
  taxProfileEnabled: false,
  taxCountry: 'PE',
  taxRuc: '',
});

const editForm = ref({
  name: '',
  role: 'USER' as 'ADMIN' | 'USER',
  isActive: true,
  taxProfileEnabled: false,
  taxCountry: 'PE',
  taxRuc: '',
});

const resetPasswordForm = ref({
  password: '',
});

const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (u.taxRuc && u.taxRuc.includes(searchQuery.value));

    const matchesRole =
      selectedRoleFilter.value === 'ALL' || u.role === selectedRoleFilter.value;

    const matchesStatus =
      selectedStatusFilter.value === 'ALL' ||
      (selectedStatusFilter.value === 'ACTIVE' && u.isActive) ||
      (selectedStatusFilter.value === 'INACTIVE' && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });
});

const roleOptions = [
  { label: 'USER (Estándar)', value: 'USER' },
  { label: 'ADMIN (Administrador)', value: 'ADMIN' },
];

const statusOptions = [
  { label: 'Activo', value: true },
  { label: 'Inactivo', value: false },
];

const stats = computed(() => {
  const total = users.value.length;
  const active = users.value.filter((u) => u.isActive).length;
  const inactive = users.value.filter((u) => !u.isActive).length;
  const withTax = users.value.filter((u) => u.taxProfileEnabled).length;
  return { total, active, inactive, withTax };
});

async function loadUsers() {
  if (!authStore.accessToken) return;
  isLoading.value = true;
  errorMessage.value = null;
  try {
    users.value = await AdminUserService.getUsers(authStore.accessToken);
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Error al cargar usuarios.';
  } finally {
    isLoading.value = false;
  }
}

function openCreateModal() {
  createForm.value = {
    email: '',
    password: '',
    name: '',
    role: 'USER',
    isActive: true,
    taxProfileEnabled: false,
    taxCountry: 'PE',
    taxRuc: '',
  };
  errorMessage.value = null;
  isCreateModalOpen.value = true;
}

async function handleCreateUser() {
  if (!authStore.accessToken) return;
  if (!createForm.value.email || !createForm.value.password) {
    errorMessage.value = 'El correo electrónico y la contraseña son obligatorios.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;
  try {
    await AdminUserService.createUser(authStore.accessToken, createForm.value);
    isCreateModalOpen.value = false;
    successMessage.value = 'Usuario registrado exitosamente.';
    await loadUsers();
    setTimeout(() => {
      successMessage.value = null;
    }, 4000);
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Error al crear usuario.';
  } finally {
    isLoading.value = false;
  }
}

function openEditModal(user: AdminUserSummary) {
  selectedUser.value = user;
  editForm.value = {
    name: user.name || '',
    role: user.role,
    isActive: user.isActive,
    taxProfileEnabled: user.taxProfileEnabled ?? false,
    taxCountry: user.taxCountry || 'PE',
    taxRuc: user.taxRuc || '',
  };
  errorMessage.value = null;
  isEditModalOpen.value = true;
}

async function handleUpdateUser() {
  if (!authStore.accessToken || !selectedUser.value) return;
  isLoading.value = true;
  errorMessage.value = null;
  try {
    await AdminUserService.updateUser(
      authStore.accessToken,
      selectedUser.value.id,
      editForm.value,
    );
    isEditModalOpen.value = false;
    successMessage.value = 'Usuario actualizado exitosamente.';
    await loadUsers();
    setTimeout(() => {
      successMessage.value = null;
    }, 4000);
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Error al actualizar usuario.';
  } finally {
    isLoading.value = false;
  }
}

async function handleToggleStatus(user: AdminUserSummary) {
  if (!authStore.accessToken) return;
  if (user.id === authStore.user?.id) {
    errorMessage.value = 'No puedes desactivar tu propia cuenta de administrador.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;
  try {
    const newStatus = !user.isActive;
    await AdminUserService.updateUser(authStore.accessToken, user.id, {
      isActive: newStatus,
    });
    user.isActive = newStatus;
    successMessage.value = `Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente.`;
    setTimeout(() => {
      successMessage.value = null;
    }, 4000);
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Error al cambiar estado del usuario.';
  } finally {
    isLoading.value = false;
  }
}

function openResetPasswordModal(user: AdminUserSummary) {
  selectedUser.value = user;
  resetPasswordForm.value = { password: '' };
  errorMessage.value = null;
  isResetPasswordModalOpen.value = true;
}

async function handleResetPassword() {
  if (!authStore.accessToken || !selectedUser.value) return;
  if (!resetPasswordForm.value.password) {
    errorMessage.value = 'Debes ingresar una nueva contraseña.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;
  try {
    await AdminUserService.resetPassword(
      authStore.accessToken,
      selectedUser.value.id,
      resetPasswordForm.value,
    );
    isResetPasswordModalOpen.value = false;
    successMessage.value = 'Contraseña restablecida exitosamente.';
    setTimeout(() => {
      successMessage.value = null;
    }, 4000);
  } catch (err) {
    errorMessage.value =
      (err as Error).message || 'Error al restablecer contraseña.';
  } finally {
    isLoading.value = false;
  }
}

function openDeleteModal(user: AdminUserSummary) {
  selectedUser.value = user;
  errorMessage.value = null;
  isDeleteModalOpen.value = true;
}

async function handleDeleteUser() {
  if (!authStore.accessToken || !selectedUser.value) return;
  isLoading.value = true;
  errorMessage.value = null;
  try {
    await AdminUserService.deleteUser(
      authStore.accessToken,
      selectedUser.value.id,
    );
    isDeleteModalOpen.value = false;
    successMessage.value = 'Usuario eliminado del sistema.';
    await loadUsers();
    setTimeout(() => {
      successMessage.value = null;
    }, 4000);
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Error al eliminar usuario.';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadUsers();
});
</script>

<template>
  <AppLayout
    title="Administración de Usuarios"
    subtitle="Control de accesos, estados y perfiles tributarios"
  >
    <div class="space-y-6">
      <!-- Success Alert Banner -->
      <div
        v-if="successMessage"
        class="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm font-semibold"
      >
        <UIcon name="i-heroicons-check-circle" class="h-5 w-5 shrink-0" />
        <span>{{ successMessage }}</span>
      </div>

      <!-- Error Alert Banner -->
      <div
        v-if="errorMessage"
        class="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-2xl text-sm font-semibold"
      >
        <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Header & Action Row -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2
            class="text-2xl font-black text-slate-900 dark:text-[#FAF7F2] tracking-tight"
          >
            Usuarios Registrados
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Administra credenciales, estados, roles y régimen tributario SUNAT.
          </p>
        </div>

        <UButton
          color="primary"
          icon="i-heroicons-user-plus"
          size="md"
          class="font-bold shadow-md shadow-primary-500/20"
          @click="openCreateModal"
        >
          Crear Usuario
        </UButton>
      </div>

      <!-- Summary KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59]/60 shadow-sm flex items-center gap-3 sm:gap-4"
        >
          <div
            class="h-11 w-11 shrink-0 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold"
          >
            <UIcon name="i-heroicons-users" class="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              Total Usuarios
            </p>
            <p
              class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              {{ stats.total }}
            </p>
          </div>
        </div>

        <div
          class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59]/60 shadow-sm flex items-center gap-3 sm:gap-4"
        >
          <div
            class="h-11 w-11 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold"
          >
            <UIcon name="i-heroicons-check-circle" class="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              Cuentas Activas
            </p>
            <p
              class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              {{ stats.active }}
            </p>
          </div>
        </div>

        <div
          class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59]/60 shadow-sm flex items-center gap-3 sm:gap-4"
        >
          <div
            class="h-11 w-11 shrink-0 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold"
          >
            <UIcon name="i-heroicons-no-symbol" class="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              Inactivos / Pausados
            </p>
            <p
              class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              {{ stats.inactive }}
            </p>
          </div>
        </div>

        <div
          class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-[#283a59]/60 shadow-sm flex items-center gap-3 sm:gap-4"
        >
          <div
            class="h-11 w-11 shrink-0 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold"
          >
            <UIcon name="i-heroicons-scale" class="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              Con SUNAT Perú
            </p>
            <p
              class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              {{ stats.withTax }}
            </p>
          </div>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div
        class="flex flex-col md:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-[#162032] rounded-2xl border border-slate-200 dark:border-[#283a59]/60 shadow-sm"
      >
        <div class="w-full md:w-80">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Buscar por nombre, correo o RUC..."
            class="w-full"
          />
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <!-- Status filter -->
          <div class="flex items-center bg-slate-100 dark:bg-[#0f1523] p-1 rounded-xl border border-slate-200 dark:border-[#283a59]">
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              :class="selectedStatusFilter === 'ALL' ? 'bg-[#1B3E9B] text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
              @click="selectedStatusFilter = 'ALL'"
            >
              Todos
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              :class="selectedStatusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
              @click="selectedStatusFilter = 'ACTIVE'"
            >
              Activos ({{ stats.active }})
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              :class="selectedStatusFilter === 'INACTIVE' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
              @click="selectedStatusFilter = 'INACTIVE'"
            >
              Inactivos ({{ stats.inactive }})
            </button>
          </div>

          <!-- Role filter -->
          <div class="flex items-center bg-slate-100 dark:bg-[#0f1523] p-1 rounded-xl border border-slate-200 dark:border-[#283a59]">
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              :class="selectedRoleFilter === 'ALL' ? 'bg-[#1B3E9B] text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
              @click="selectedRoleFilter = 'ALL'"
            >
              Roles
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              :class="selectedRoleFilter === 'ADMIN' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
              @click="selectedRoleFilter = 'ADMIN'"
            >
              Admins
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              :class="selectedRoleFilter === 'USER' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
              @click="selectedRoleFilter = 'USER'"
            >
              Usuarios
            </button>
          </div>
        </div>
      </div>

      <!-- Users List -->
      <div
        class="bg-white dark:bg-[#162032] rounded-2xl border border-slate-200 dark:border-[#283a59]/60 shadow-sm overflow-hidden"
      >
        <div v-if="isLoading && users.length === 0" class="p-12 text-center">
          <UIcon
            name="i-heroicons-arrow-path"
            class="h-8 w-8 animate-spin mx-auto text-primary-500 mb-2"
          />
          <p class="text-sm font-semibold text-slate-500">Cargando usuarios...</p>
        </div>

        <div
          v-else-if="filteredUsers.length === 0"
          class="p-12 text-center space-y-2"
        >
          <UIcon
            name="i-heroicons-user-group"
            class="h-10 w-10 mx-auto text-slate-400"
          />
          <p class="text-base font-bold text-slate-800 dark:text-slate-200">
            No se encontraron usuarios
          </p>
          <p class="text-xs text-slate-500">
            Intenta con otro término de búsqueda o filtro.
          </p>
        </div>

        <div v-else class="divide-y divide-slate-100 dark:divide-[#283a59]/40">
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-[#1b263b]/30 transition-colors"
            :class="!user.isActive ? 'opacity-70 bg-slate-50/30 dark:bg-slate-900/40' : ''"
          >
            <!-- User Info -->
            <div class="flex items-center gap-3.5 min-w-0">
              <div
                class="h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm"
                :class="
                  !user.isActive
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                    : user.role === 'ADMIN'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                "
              >
                {{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}
              </div>

              <div class="min-w-0 space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3
                    class="text-sm font-bold text-slate-900 dark:text-slate-100 truncate"
                  >
                    {{ user.name || 'Sin nombre' }}
                  </h3>

                  <!-- Role Badge -->
                  <span
                    class="px-2 py-0.5 text-[10px] font-black rounded-lg uppercase tracking-wider"
                    :class="
                      user.role === 'ADMIN'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-500/30'
                    "
                  >
                    {{ user.role }}
                  </span>

                  <!-- Status Badge -->
                  <span
                    class="px-2 py-0.5 text-[10px] font-bold rounded-lg"
                    :class="
                      user.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-500/30'
                    "
                  >
                    {{ user.isActive ? 'Activo' : 'Inactivo' }}
                  </span>

                  <!-- SUNAT Tax Badge -->
                  <span
                    v-if="user.taxProfileEnabled"
                    class="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center gap-1"
                    :title="user.taxRuc ? `RUC: ${user.taxRuc}` : 'SUNAT Activado'"
                  >
                    <UIcon name="i-heroicons-scale" class="h-3 w-3" />
                    SUNAT {{ user.taxRuc ? `(${user.taxRuc})` : 'Perú' }}
                  </span>

                  <span
                    v-if="user.id === authStore.user?.id"
                    class="px-2 py-0.5 text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                  >
                    Tú
                  </span>
                </div>

                <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {{ user.email }}
                </p>

                <!-- Counts -->
                <div
                  class="flex items-center gap-3 text-[11px] text-slate-400 font-medium"
                >
                  <span class="flex items-center gap-1">
                    <UIcon name="i-heroicons-credit-card" class="h-3.5 w-3.5" />
                    {{ user._count?.accounts || 0 }} cuentas
                  </span>
                  <span class="flex items-center gap-1">
                    <UIcon
                      name="i-heroicons-arrows-right-left"
                      class="h-3.5 w-3.5"
                    />
                    {{ user._count?.transactions || 0 }} movimientos
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
              <!-- Quick Toggle Status -->
              <UButton
                v-if="user.id !== authStore.user?.id"
                color="neutral"
                variant="ghost"
                size="xs"
                :icon="user.isActive ? 'i-heroicons-pause-circle' : 'i-heroicons-play-circle'"
                :class="user.isActive ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'"
                :title="user.isActive ? 'Suspender acceso' : 'Habilitar acceso'"
                @click="handleToggleStatus(user)"
              >
                {{ user.isActive ? 'Desactivar' : 'Activar' }}
              </UButton>

              <UButton
                color="neutral"
                variant="soft"
                size="xs"
                icon="i-heroicons-pencil-square"
                title="Editar usuario"
                @click="openEditModal(user)"
              >
                Editar
              </UButton>

              <UButton
                color="neutral"
                variant="soft"
                size="xs"
                icon="i-heroicons-key"
                title="Restablecer contraseña"
                @click="openResetPasswordModal(user)"
              >
                Clave
              </UButton>

              <UButton
                v-if="user.id !== authStore.user?.id"
                color="error"
                variant="ghost"
                size="xs"
                icon="i-heroicons-trash"
                title="Eliminar usuario"
                @click="openDeleteModal(user)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create User Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <div class="p-6 space-y-5 bg-white dark:bg-[#162032]">
          <div class="flex items-center justify-between border-b pb-3 dark:border-slate-700">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              Crear Nuevo Usuario
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="xs"
              @click="isCreateModalOpen = false"
            />
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Completo (Opcional)
              </label>
              <UInput
                v-model="createForm.name"
                type="text"
                placeholder="Ej. Carlos Colmenares"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico *
              </label>
              <UInput
                v-model="createForm.email"
                type="email"
                placeholder="familiar@lascar.dev"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contraseña Inicial *
              </label>
              <UInput
                v-model="createForm.password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                class="w-full"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rol
                </label>
                <USelect
                  v-model="createForm.role"
                  :items="roleOptions"
                  value-key="value"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Estado
                </label>
                <USelect
                  v-model="createForm.isActive"
                  :items="statusOptions"
                  value-key="value"
                  class="w-full"
                />
              </div>
            </div>

            <!-- SUNAT Module Section -->
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0f1523]/60 border border-slate-200 dark:border-[#283a59] space-y-3">
              <UCheckbox
                v-model="createForm.taxProfileEnabled"
                label="Habilitar Módulo Tributario SUNAT (Perú)"
              />

              <div v-if="createForm.taxProfileEnabled" class="pt-1">
                <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Número de RUC (Opcional)
                </label>
                <UInput
                  v-model="createForm.taxRuc"
                  type="text"
                  placeholder="Ej. 10456789012"
                  maxlength="11"
                  class="w-full font-mono"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t dark:border-slate-700">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="isCreateModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              size="sm"
              :loading="isLoading"
              @click="handleCreateUser"
            >
              Guardar Usuario
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit User Modal -->
    <UModal v-model:open="isEditModalOpen">
      <template #content>
        <div class="p-6 space-y-5 bg-white dark:bg-[#162032]">
          <div class="flex items-center justify-between border-b pb-3 dark:border-slate-700">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white truncate">
              Editar: {{ selectedUser?.email }}
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="xs"
              @click="isEditModalOpen = false"
            />
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Completo
              </label>
              <UInput
                v-model="editForm.name"
                type="text"
                class="w-full"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rol
                </label>
                <USelect
                  v-model="editForm.role"
                  :items="roleOptions"
                  value-key="value"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Estado
                </label>
                <USelect
                  v-model="editForm.isActive"
                  :items="statusOptions"
                  value-key="value"
                  :disabled="selectedUser?.id === authStore.user?.id"
                  class="w-full"
                />
              </div>
            </div>

            <!-- SUNAT Module Section -->
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0f1523]/60 border border-slate-200 dark:border-[#283a59] space-y-3">
              <UCheckbox
                v-model="editForm.taxProfileEnabled"
                label="Habilitar Módulo Tributario SUNAT (Perú)"
              />

              <div v-if="editForm.taxProfileEnabled" class="pt-1">
                <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Número de RUC (Opcional)
                </label>
                <UInput
                  v-model="editForm.taxRuc"
                  type="text"
                  placeholder="Ej. 10456789012"
                  maxlength="11"
                  class="w-full font-mono"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t dark:border-slate-700">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="isEditModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              size="sm"
              :loading="isLoading"
              @click="handleUpdateUser"
            >
              Guardar Cambios
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Reset Password Modal -->
    <UModal v-model:open="isResetPasswordModalOpen">
      <template #content>
        <div class="p-6 space-y-5 bg-white dark:bg-[#162032]">
          <div class="flex items-center justify-between border-b pb-3 dark:border-slate-700">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              Restablecer Contraseña
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="xs"
              @click="isResetPasswordModalOpen = false"
            />
          </div>

          <div class="space-y-4">
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Introduce una nueva contraseña para <strong>{{ selectedUser?.email }}</strong>.
            </p>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nueva Contraseña *
              </label>
              <input
                v-model="resetPasswordForm.password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                class="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-[#283a59] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t dark:border-slate-700">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="isResetPasswordModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              size="sm"
              :loading="isLoading"
              @click="handleResetPassword"
            >
              Guardar Contraseña
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <div class="p-6 space-y-5 bg-white dark:bg-[#162032]">
          <div class="flex items-center gap-3 text-rose-600">
            <UIcon name="i-heroicons-exclamation-triangle" class="h-6 w-6" />
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              Eliminar Usuario
            </h3>
          </div>

          <p class="text-sm text-slate-600 dark:text-slate-300">
            ¿Estás seguro de que deseas eliminar permanentemente al usuario
            <strong>{{ selectedUser?.email }}</strong>? Esta acción borrará todas sus cuentas, movimientos y configuraciones en cascada.
          </p>

          <div class="flex justify-end gap-3 pt-3 border-t dark:border-slate-700">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="isDeleteModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="error"
              size="sm"
              :loading="isLoading"
              @click="handleDeleteUser"
            >
              Sí, Eliminar
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </AppLayout>
</template>
