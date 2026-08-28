<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import CategoryItem from './CategoryItem.vue';
import type { Category, CategoryType } from '../../../core/entities/Category';
import type { TaxCategory, TaxDeductionType } from '../../../core/entities/Tax';
import { useTaxStore } from '../../store/tax.store';

interface Props {
  categories: Category[];
  isLoading: boolean;
}

const props = defineProps<Props>();
const taxStore = useTaxStore();

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  (
    e: 'create',
    category: {
      name: string;
      type: CategoryType;
      icon: string;
      color: string;
      taxCategory?: TaxCategory;
      taxDeductionType?: TaxDeductionType;
    },
  ): void;
  (e: 'delete', id: string): void;
}>();

const activeTab = ref<CategoryType>('EXPENSE');
const isCreating = ref(false);

const colorPresets = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
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

const taxDeductionOptions = [
  { label: 'Sin deducción (Normal)', value: 'NONE' },
  { label: 'Restaurante / Bar (15% deducible)', value: 'RESTAURANT_BAR' },
  { label: 'Hotel / Hospedaje (15% deducible)', value: 'HOTEL' },
  { label: 'Alquiler de Inmueble (30% deducible)', value: 'RENTAL' },
  { label: 'Servicio Profesional 4ta (30% deducible)', value: 'PROFESSIONAL_SERVICE' },
  { label: 'Trabajadora del Hogar (100% deducible)', value: 'DOMESTIC_WORKER' },
];

const taxCategoryOptions = [
  { label: 'Sin régimen especial', value: 'NONE' },
  { label: '4ta Cat (Honorarios - 8% retención)', value: 'FOURTH_CATEGORY_INCOME' },
  { label: '5ta Cat (Planilla)', value: 'FIFTH_CATEGORY_INCOME' },
];

const form = reactive<{
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  taxCategory: TaxCategory;
  taxDeductionType: TaxDeductionType;
}>({
  name: '',
  type: 'EXPENSE',
  icon: 'i-heroicons-shopping-bag',
  color: '#3b82f6',
  taxCategory: 'NONE',
  taxDeductionType: 'NONE',
});

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const filteredCategories = computed(() => {
  return props.categories.filter((cat) => cat.type === activeTab.value);
});

function handleOpenCreate() {
  form.name = '';
  form.type = activeTab.value;
  form.icon =
    activeTab.value === 'EXPENSE'
      ? 'i-heroicons-shopping-cart'
      : 'i-heroicons-banknotes';
  form.color = activeTab.value === 'EXPENSE' ? '#ef4444' : '#10b981';
  form.taxCategory = 'NONE';
  form.taxDeductionType = 'NONE';
  errorMessage.value = null;
  isCreating.value = true;
}

function handleDeductionChange() {
  if (form.taxDeductionType !== 'NONE') {
    form.taxCategory = 'DEDUCTIBLE_EXPENSE_3UIT';
  } else {
    form.taxCategory = 'NONE';
  }
}

function handleSaveCategory() {
  if (!form.name.trim()) {
    errorMessage.value = 'El nombre de la categoría es obligatorio.';
    return;
  }
  isSubmitting.value = true;
  errorMessage.value = null;
  try {
    emit('create', {
      name: form.name.trim(),
      type: form.type,
      icon: form.icon,
      color: form.color,
      taxCategory: form.taxCategory,
      taxDeductionType: form.taxDeductionType,
    });
    isCreating.value = false;
  } catch (err) {
    errorMessage.value =
      (err as Error).message || 'Error al crear la categoría.';
  } finally {
    isSubmitting.value = false;
  }
}

function handleDelete(id: string) {
  emit('delete', id);
}
</script>

<template>
  <UModal v-model:open="open" title="Administrar Categorías" :dismissible="false">
    <template #body>
      <div class="space-y-4">
        <!-- Header Actions & Tabs -->
        <div class="flex items-center justify-between gap-3">
          <div
            class="flex p-1 bg-slate-900/90 rounded-lg border border-slate-800 text-xs"
          >
            <button
              class="px-3 py-1.5 rounded-md font-semibold transition-all"
              :class="
                activeTab === 'EXPENSE'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white'
              "
              @click="
                activeTab = 'EXPENSE';
                isCreating = false;
              "
            >
              Gastos ({{
                categories.filter((c) => c.type === 'EXPENSE').length
              }})
            </button>
            <button
              class="px-3 py-1.5 rounded-md font-semibold transition-all"
              :class="
                activeTab === 'INCOME'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              "
              @click="
                activeTab = 'INCOME';
                isCreating = false;
              "
            >
              Ingresos ({{
                categories.filter((c) => c.type === 'INCOME').length
              }})
            </button>
          </div>

          <UButton
            v-if="!isCreating"
            color="primary"
            size="xs"
            icon="i-heroicons-plus"
            @click="handleOpenCreate"
          >
            Nueva Categoría
          </UButton>
        </div>

        <!-- Inline Creation Form -->
        <div
          v-if="isCreating"
          class="rounded-xl border border-slate-700 bg-slate-800/90 p-4 space-y-3"
        >
          <div
            class="flex items-center justify-between border-b border-slate-700/60 pb-2"
          >
            <h4
              class="text-xs font-bold text-slate-200 uppercase tracking-wider"
            >
              Nueva Categoría de
              {{ form.type === 'EXPENSE' ? 'Gasto' : 'Ingreso' }}
            </h4>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-heroicons-x-mark"
              @click="isCreating = false"
            />
          </div>

          <div
            v-if="errorMessage"
            class="text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-800"
          >
            {{ errorMessage }}
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-slate-300">Nombre</label>
            <UInput
              v-model="form.name"
              placeholder="Ej: Supermercado, Alquiler, Salario"
              class="w-full"
              required
              autofocus
            />
          </div>

          <!-- Icon selector -->
          <div class="space-y-1">
            <label class="text-xs font-medium text-slate-300">Icono</label>
            <div class="grid grid-cols-6 gap-1.5">
              <button
                v-for="item in iconPresets"
                :key="item.icon"
                type="button"
                class="flex h-8 items-center justify-center rounded-lg border transition-all"
                :class="
                  form.icon === item.icon
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                "
                :title="item.label"
                @click="form.icon = item.icon"
              >
                <UIcon :name="item.icon" class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Color selector -->
          <div class="space-y-1">
            <label class="text-xs font-medium text-slate-300">Color</label>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                v-for="col in colorPresets"
                :key="col"
                type="button"
                class="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                :class="
                  form.color === col
                    ? 'border-white scale-110 shadow-md'
                    : 'border-transparent opacity-80'
                "
                :style="{ backgroundColor: col }"
                @click="form.color = col"
              />
            </div>
          </div>

          <!-- Regla Tributaria SUNAT (Opcional) -->
          <div
            v-if="taxStore.profile.taxProfileEnabled"
            class="p-2.5 rounded-lg border border-slate-700 bg-slate-900/80 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                <UIcon name="i-heroicons-scale" class="w-3.5 h-3.5" />
                Regla SUNAT por Defecto
              </span>
              <span class="text-[9px] text-slate-400">Opcional</span>
            </div>

            <div v-if="form.type === 'EXPENSE'">
              <USelect
                v-model="form.taxDeductionType"
                :items="taxDeductionOptions"
                value-key="value"
                class="w-full"
                @update:model-value="handleDeductionChange"
              />
            </div>
            <div v-else>
              <USelect
                v-model="form.taxCategory"
                :items="taxCategoryOptions"
                value-key="value"
                class="w-full"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-700/60">
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              @click="isCreating = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              size="xs"
              :loading="isSubmitting"
              @click="handleSaveCategory"
            >
              Guardar
            </UButton>
          </div>
        </div>

        <!-- Categories List -->
        <div
          v-if="filteredCategories.length === 0 && !isCreating"
          class="rounded-lg border border-dashed border-slate-800 bg-slate-850/40 p-6 text-center text-slate-400 text-sm"
        >
          No tenés categorías de
          {{ activeTab === 'EXPENSE' ? 'gasto' : 'ingreso' }} registradas.
        </div>

        <div
          v-else-if="!isCreating"
          class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1"
        >
          <CategoryItem
            v-for="cat in filteredCategories"
            :key="cat.id"
            :category="cat"
            @delete="handleDelete"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end w-full">
        <UButton color="neutral" variant="ghost" @click="open = false">
          Cerrar
        </UButton>
      </div>
    </template>
  </UModal>
</template>
