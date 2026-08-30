<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

import type { BudgetGroup, Category, CategoryType } from '../../../core/entities/Category';
import type { TaxCategory, TaxDeductionType } from '../../../core/entities/Tax';
import { useTaxStore } from '../../store/tax.store';
import { useAuthStore } from '../../store/auth';

interface Props {
  category?: Category | null;
  parentCategories?: Category[];
}

const props = defineProps<Props>();
const taxStore = useTaxStore();
const authStore = useAuthStore();

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  (
    e: 'created',
    category: {
      name: string;
      type: CategoryType;
      icon: string;
      color: string;
      taxCategory?: TaxCategory;
      taxDeductionType?: TaxDeductionType;
      budgetGroup?: BudgetGroup;
    },
  ): void;
  (
    e: 'updated',
    id: string,
    category: {
      name: string;
      type: CategoryType;
      icon: string;
      color: string;
      taxCategory?: TaxCategory;
      taxDeductionType?: TaxDeductionType;
      budgetGroup?: BudgetGroup;
    },
  ): void;
}>();

const colorPresets = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#64748b', // slate
];

const iconPresets = [
  { icon: 'i-heroicons-shopping-cart', label: 'Supermercado' },
  { icon: 'i-heroicons-shopping-bag', label: 'Compras' },
  { icon: 'i-heroicons-home', label: 'Hogar' },
  { icon: 'i-heroicons-truck', label: 'Transporte' },
  { icon: 'i-heroicons-heart', label: 'Salud' },
  { icon: 'i-heroicons-film', label: 'Entretenimiento' },
  { icon: 'i-heroicons-academic-cap', label: 'Educación' },
  { icon: 'i-heroicons-bolt', label: 'Servicios' },
  { icon: 'i-heroicons-banknotes', label: 'Salario / Efectivo' },
  { icon: 'i-heroicons-arrow-trending-up', label: 'Inversiones' },
  { icon: 'i-heroicons-briefcase', label: 'Negocio' },
  { icon: 'i-heroicons-gift', label: 'Regalos' },
];

const budgetGroupOptions = [
  { label: '50% Necesidad / Gasto Fijo (Needs)', value: 'NEEDS' },
  { label: '30% Deseo / Estilo de Vida (Wants)', value: 'WANTS' },
  { label: '20% Ahorro / Inversión (Savings)', value: 'SAVINGS' },
  { label: 'Sin clasificar en la regla 50/30/20', value: 'UNASSIGNED' },
];

const taxDeductionOptions = [
  { label: 'Sin deducción tributaria (Normal)', value: 'NONE' },
  { label: 'Restaurante / Bar (15% deducible)', value: 'RESTAURANT_BAR' },
  { label: 'Hotel / Hospedaje (15% deducible)', value: 'HOTEL' },
  { label: 'Alquiler de Inmueble (30% deducible)', value: 'RENTAL' },
  { label: 'Servicio Profesional 4ta (30% deducible)', value: 'PROFESSIONAL_SERVICE' },
  { label: 'Trabajadora del Hogar (100% deducible)', value: 'DOMESTIC_WORKER' },
];

const taxCategoryOptions = [
  { label: 'Sin régimen tributario especial', value: 'NONE' },
  { label: '4ta Categoría (Recibos por Honorarios - 8% retención)', value: 'FOURTH_CATEGORY_INCOME' },
  { label: '5ta Categoría (Planilla)', value: 'FIFTH_CATEGORY_INCOME' },
];

const form = reactive<{
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  taxCategory: TaxCategory;
  taxDeductionType: TaxDeductionType;
  budgetGroup: BudgetGroup;
}>({
  name: '',
  type: 'EXPENSE',
  icon: 'i-heroicons-shopping-bag',
  color: '#3b82f6',
  taxCategory: 'NONE',
  taxDeductionType: 'NONE',
  budgetGroup: 'UNASSIGNED',
});

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

function handleDeductionChange() {
  if (form.taxDeductionType !== 'NONE') {
    form.taxCategory = 'DEDUCTIBLE_EXPENSE_3UIT';
  } else {
    form.taxCategory = 'NONE';
  }
}

function resetForm() {
  form.name = '';
  form.type = 'EXPENSE';
  form.icon = 'i-heroicons-shopping-bag';
  form.color = '#3b82f6';
  form.taxCategory = 'NONE';
  form.taxDeductionType = 'NONE';
  form.budgetGroup = 'UNASSIGNED';
  errorMessage.value = null;
}

watch(
  () => [open.value, props.category],
  async ([isOpen]) => {
    if (isOpen) {
      if (authStore.user?.id && !taxStore.profile.taxProfileEnabled) {
        await taxStore.fetchProfile(authStore.user.id);
      }
      if (props.category) {
        form.name = props.category.name;
        form.type = props.category.type;
        form.icon = props.category.icon || 'i-heroicons-tag';
        form.color = props.category.color || '#3b82f6';
        form.taxCategory = props.category.taxCategory || 'NONE';
        form.taxDeductionType = props.category.taxDeductionType || 'NONE';
        form.budgetGroup = props.category.budgetGroup || 'UNASSIGNED';
      } else {
        resetForm();
      }
    }
  },
  { immediate: true },
);

function handleClose() {
  resetForm();
  open.value = false;
}

function handleSubmit() {
  if (!form.name.trim()) {
    errorMessage.value = 'El nombre de la categoría es obligatorio.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    if (props.category?.id) {
      emit('updated', props.category.id, {
        name: form.name.trim(),
        type: form.type,
        icon: form.icon,
        color: form.color,
        taxCategory: form.taxCategory,
        taxDeductionType: form.taxDeductionType,
        budgetGroup: form.type === 'EXPENSE' ? form.budgetGroup : 'UNASSIGNED',
      });
    } else {
      emit('created', {
        name: form.name.trim(),
        type: form.type,
        icon: form.icon,
        color: form.color,
        taxCategory: form.taxCategory,
        taxDeductionType: form.taxDeductionType,
        budgetGroup: form.type === 'EXPENSE' ? form.budgetGroup : 'UNASSIGNED',
      });
    }
    resetForm();
    open.value = false;
  } catch (err) {
    errorMessage.value =
      (err as Error).message || 'Error al guardar la categoría.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="category ? 'Editar Categoría' : 'Nueva Categoría'"
    :dismissible="false"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div
          v-if="errorMessage"
          class="rounded-lg bg-red-950/50 p-3 text-sm text-red-400 border border-red-800"
        >
          {{ errorMessage }}
        </div>

        <!-- Type Selector -->
        <div
          class="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-lg border border-slate-800"
        >
          <button
            type="button"
            class="py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5"
            :class="
              form.type === 'EXPENSE'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            "
            @click="form.type = 'EXPENSE'"
          >
            <UIcon name="i-heroicons-arrow-down-left" class="h-3.5 w-3.5" />
            Gasto
          </button>
          <button
            type="button"
            class="py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5"
            :class="
              form.type === 'INCOME'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            "
            @click="form.type = 'INCOME'"
          >
            <UIcon name="i-heroicons-arrow-up-right" class="h-3.5 w-3.5" />
            Ingreso
          </button>
        </div>

        <!-- Name -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-200">
            Nombre de la categoría <span class="text-red-400">*</span>
          </label>
          <UInput
            v-model="form.name"
            placeholder="Ej: Supermercado, Salario, Gimnasio"
            class="w-full"
            required
            autofocus
          />
        </div>

        <!-- Icon Picker -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-200">Icono</label>
          <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
            <button
              v-for="item in iconPresets"
              :key="item.icon"
              type="button"
              class="flex h-10 w-full items-center justify-center rounded-lg border text-slate-300 transition-all hover:border-slate-500"
              :class="
                form.icon === item.icon
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-slate-700 bg-slate-800'
              "
              :title="item.label"
              @click="form.icon = item.icon"
            >
              <UIcon :name="item.icon" class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Color Picker -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-200"
            >Color distintivo</label
          >
          <div class="flex items-center gap-2 flex-wrap">
            <button
              v-for="col in colorPresets"
              :key="col"
              type="button"
              class="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
              :class="
                form.color === col
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-transparent opacity-80 hover:opacity-100'
              "
              :style="{ backgroundColor: col }"
              @click="form.color = col"
            />
          </div>
        </div>

        <!-- Clasificación Regla Presupuestaria 50/30/20 (Solo para gastos) -->
        <div
          v-if="form.type === 'EXPENSE'"
          class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f1523]/60 space-y-2"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-chart-pie" class="w-4 h-4 text-emerald-400" />
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
                Regla Presupuestaria 50/30/20
              </span>
            </div>
            <span class="text-[10px] text-slate-400 font-medium">Planificación</span>
          </div>
          <p class="text-[11px] text-slate-400">
            Clasifica este gasto para proyectar tu presupuesto mensual sobre el total de tus ingresos.
          </p>
          <USelect
            v-model="form.budgetGroup"
            :items="budgetGroupOptions"
            value-key="value"
            name="budgetGroup"
            class="w-full"
          />
        </div>

        <!-- Regla Tributaria SUNAT (Opcional - visible si el usuario tiene activo su perfil tributario) -->
        <div
          v-if="taxStore.profile.taxProfileEnabled"
          class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f1523]/60 space-y-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-scale" class="w-4 h-4 text-sky-400" />
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
                Regla Tributaria SUNAT por Defecto
              </span>
            </div>
            <span class="text-[10px] text-slate-400 font-medium">Opcional</span>
          </div>

          <!-- Si es gasto: Regla de 3 UIT -->
          <div v-if="form.type === 'EXPENSE'" class="space-y-2">
            <label class="text-xs font-semibold text-slate-300">
              Deducción Adicional 3 UIT
            </label>
            <USelect
              v-model="form.taxDeductionType"
              :items="taxDeductionOptions"
              value-key="value"
              class="w-full"
              @update:model-value="handleDeductionChange"
            />
          </div>

          <!-- Si es ingreso: 4ta o 5ta -->
          <div v-else class="space-y-2">
            <label class="text-xs font-semibold text-slate-300">
              Régimen de Renta de Trabajo
            </label>
            <USelect
              v-model="form.taxCategory"
              :items="taxCategoryOptions"
              value-key="value"
              class="w-full"
            />
          </div>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Cancelar
        </UButton>
        <UButton color="primary" :loading="isSubmitting" @click="handleSubmit">
          Guardar Categoría
        </UButton>
      </div>
    </template>
  </UModal>
</template>
