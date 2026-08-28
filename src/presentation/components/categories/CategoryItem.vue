<script setup lang="ts">
import type { Category } from '../../../core/entities/Category';

interface Props {
  category: Category;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'delete', id: string): void;
}>();

function handleDelete() {
  if (
    confirm(`¿Estás seguro de eliminar la categoría "${props.category.name}"?`)
  ) {
    emit('delete', props.category.id);
  }
}
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-800/80 px-3.5 py-2.5 transition-all hover:border-slate-600 hover:bg-slate-800"
  >
    <div class="flex items-center gap-3">
      <div
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900"
        :style="{ color: category.color || '#3b82f6' }"
      >
        <UIcon
          :name="
            category.icon ||
            (category.type === 'INCOME'
              ? 'i-heroicons-arrow-up-right'
              : 'i-heroicons-shopping-bag')
          "
          class="h-4 w-4"
        />
      </div>

      <div>
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-white">{{
            category.name
          }}</span>
          <span
            class="inline-block h-2 w-2 rounded-full"
            :style="{ backgroundColor: category.color || '#3b82f6' }"
          />
        </div>
        <div v-if="category.taxDeductionType && category.taxDeductionType !== 'NONE'" class="mt-0.5">
          <span class="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded">
            <UIcon name="i-heroicons-scale" class="w-3 h-3" />
            SUNAT 3 UIT ({{ category.taxDeductionType === 'RENTAL' || category.taxDeductionType === 'PROFESSIONAL_SERVICE' ? '30%' : (category.taxDeductionType === 'DOMESTIC_WORKER' ? '100%' : '15%') }})
          </span>
        </div>
        <div v-else-if="category.taxCategory && category.taxCategory === 'FOURTH_CATEGORY_INCOME'" class="mt-0.5">
          <span class="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.2 rounded">
            <UIcon name="i-heroicons-scale" class="w-3 h-3" />
            SUNAT 4ta (RxH - 8%)
          </span>
        </div>
      </div>
    </div>

    <UButton
      color="error"
      variant="ghost"
      size="xs"
      icon="i-heroicons-trash"
      aria-label="Eliminar categoría"
      @click="handleDelete"
    />
  </div>
</template>
