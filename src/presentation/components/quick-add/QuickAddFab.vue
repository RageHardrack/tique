<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import QuickAddBottomSheet from './QuickAddBottomSheet.vue';
import type { TransactionType } from '../../../core/entities/Transaction';

const route = useRoute();

const isOpen = ref(false);
const initialType = ref<TransactionType>('EXPENSE');

const QUICK_TYPES: Record<string, TransactionType> = {
  expense: 'EXPENSE',
  income: 'INCOME',
  transfer: 'TRANSFER',
};

onMounted(() => {
  if (route.query.quick) {
    initialType.value = QUICK_TYPES[String(route.query.quick)] || 'EXPENSE';
    isOpen.value = true;
  }
});

function openQuickExpense() {
  initialType.value = 'EXPENSE';
  isOpen.value = true;
}
</script>

<template>
  <div>
    <!-- Floating Action Button (FAB) for Mobile (< md) and Quick Desktop access -->
    <div class="fixed bottom-20 md:bottom-8 right-5 z-40">
      <UButton
        color="primary"
        size="xl"
        icon="i-heroicons-plus"
        class="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 ring-4 ring-white dark:ring-[#0f1523] justify-center p-0 cursor-pointer"
        aria-label="Registro Rápido"
        @click="openQuickExpense"
      />
    </div>

    <!-- Quick Add Bottom Sheet / Modal -->
    <QuickAddBottomSheet
      v-model:open="isOpen"
      :initial-type="initialType"
    />
  </div>
</template>
