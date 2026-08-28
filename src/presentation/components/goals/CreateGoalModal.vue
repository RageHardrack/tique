<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { CreateGoalInput, SavingsGoal, UpdateGoalInput } from '../../../core/entities/Goal';

interface Props {
  open: boolean;
  goal?: SavingsGoal | null;
  baseCurrency?: string;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  goal: null,
  baseCurrency: 'USD',
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'created', payload: CreateGoalInput): void;
  (e: 'updated', id: string, payload: UpdateGoalInput): void;
}>();

const isEditing = computed(() => !!props.goal);
const title = computed(() => (isEditing.value ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'));

const form = reactive({
  name: '',
  targetAmount: 1000,
  currentAmount: 0,
  currency: 'USD',
  targetDate: '',
  color: '#10B981',
  icon: 'i-heroicons-shield-check',
});

const errorMessage = ref<string | null>(null);

const colorOptions = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EF4444', // Red
];

const iconOptions = [
  { label: 'Escudo / Emergencia', value: 'i-heroicons-shield-check' },
  { label: 'Avión / Viaje', value: 'i-heroicons-paper-airplane' },
  { label: 'Hogar / Inmueble', value: 'i-heroicons-home' },
  { label: 'Auto / Transporte', value: 'i-heroicons-truck' },
  { label: 'Tecnología / Laptop', value: 'i-heroicons-computer-desktop' },
  { label: 'Estudio / Educación', value: 'i-heroicons-academic-cap' },
  { label: 'Regalo / Ocio', value: 'i-heroicons-gift' },
];

const currencyOptions = [
  { label: 'USD (US$)', value: 'USD' },
  { label: 'PEN (S/)', value: 'PEN' },
  { label: 'VES (Bs.)', value: 'VES' },
];

function resetForm() {
  form.name = '';
  form.targetAmount = 1000;
  form.currentAmount = 0;
  form.currency = props.baseCurrency || 'USD';
  form.targetDate = '';
  form.color = '#10B981';
  form.icon = 'i-heroicons-shield-check';
  errorMessage.value = null;
}

watch(
  () => [props.open, props.goal],
  ([isOpen]) => {
    if (isOpen) {
      if (props.goal) {
        form.name = props.goal.name;
        form.targetAmount = props.goal.targetAmount;
        form.currentAmount = props.goal.currentAmount;
        form.currency = props.goal.currency;
        form.targetDate = props.goal.targetDate ? props.goal.targetDate.slice(0, 10) : '';
        form.color = props.goal.color || '#10B981';
        form.icon = props.goal.icon || 'i-heroicons-shield-check';
      } else {
        resetForm();
      }
    }
  },
  { immediate: true },
);

function handleClose() {
  resetForm();
  emit('update:open', false);
}

function handleSubmit() {
  if (!form.name.trim()) {
    errorMessage.value = 'El nombre de la meta es obligatorio.';
    return;
  }
  if (form.targetAmount <= 0) {
    errorMessage.value = 'El monto objetivo debe ser mayor a 0.';
    return;
  }

  if (isEditing.value && props.goal) {
    emit('updated', props.goal.id, {
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount),
      currency: form.currency,
      targetDate: form.targetDate ? form.targetDate : null,
      color: form.color,
      icon: form.icon,
    });
  } else {
    emit('created', {
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount),
      currency: form.currency,
      targetDate: form.targetDate ? form.targetDate : null,
      color: form.color,
      icon: form.icon,
    });
  }

  handleClose();
}
</script>

<template>
  <UModal :open="open" :dismissible="false" @update:open="emit('update:open', $event)">
    <template #content>
      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            {{ title }}
          </h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-x-mark"
            aria-label="Cerrar"
            @click="handleClose"
          />
        </div>

        <div v-if="errorMessage" class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 font-medium">
          {{ errorMessage }}
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre de la Meta</label>
            <UInput
              v-model="form.name"
              placeholder="Ej: Fondo de Emergencia, Vacaciones, Laptop"
              required
              class="w-full"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monto Objetivo</label>
              <UInput
                v-model.number="form.targetAmount"
                type="number"
                step="0.01"
                min="1"
                required
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Moneda</label>
              <USelect
                v-model="form.currency"
                :items="currencyOptions"
                class="w-full"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monto Inicial Ahorrado</label>
              <UInput
                v-model.number="form.currentAmount"
                type="number"
                step="0.01"
                min="0"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Límite (Opcional)</label>
              <UInput
                v-model="form.targetDate"
                type="date"
                class="w-full"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Icono</label>
            <USelect
              v-model="form.icon"
              :items="iconOptions"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Color Distintivo</label>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-for="c in colorOptions"
                :key="c"
                type="button"
                class="w-8 h-8 rounded-full border-2 transition-transform cursor-pointer"
                :class="[form.color === c ? 'scale-110 border-slate-900 dark:border-white ring-2 ring-blue-500/50' : 'border-transparent']"
                :style="{ backgroundColor: c }"
                @click="form.color = c"
              />
            </div>
          </div>

          <div class="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <UButton color="neutral" variant="ghost" @click="handleClose">
              Cancelar
            </UButton>
            <UButton color="primary" type="submit">
              {{ isEditing ? 'Guardar Cambios' : 'Crear Meta' }}
            </UButton>
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>
