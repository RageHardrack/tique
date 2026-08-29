<script setup lang="ts">
import { computed } from 'vue';
import { useConfirm } from '../../composables/useConfirm';

const { state } = useConfirm();

const iconConfig = computed(() => {
  switch (state.variant) {
    case 'danger':
      return {
        name: 'i-heroicons-exclamation-triangle',
        colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        btnColor: 'red' as const,
      };
    case 'warning':
      return {
        name: 'i-heroicons-exclamation-circle',
        colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        btnColor: 'amber' as const,
      };
    case 'info':
    default:
      return {
        name: 'i-heroicons-information-circle',
        colorClass: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
        btnColor: 'blue' as const,
      };
  }
});
</script>

<template>
  <UModal v-model:open="state.isOpen" :ui="{ width: 'sm:max-w-md' }">
    <template #body>
      <div class="space-y-4 text-slate-100">
        <div class="flex items-start gap-4">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
            :class="iconConfig.colorClass"
          >
            <UIcon :name="iconConfig.name" class="w-6 h-6" />
          </div>
          <div class="space-y-1.5 flex-1 min-w-0">
            <h3 class="text-base font-bold text-white leading-tight">
              {{ state.title }}
            </h3>
            <p class="text-sm text-slate-400 leading-relaxed">
              {{ state.message }}
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <UButton
            color="neutral"
            variant="ghost"
            class="font-medium cursor-pointer"
            @click="state.onCancel"
          >
            {{ state.cancelText }}
          </UButton>
          <UButton
            :color="iconConfig.btnColor"
            class="font-semibold shadow-lg cursor-pointer"
            @click="state.onConfirm"
          >
            {{ state.confirmText }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
