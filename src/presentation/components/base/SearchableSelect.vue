<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

export interface SearchableOption {
  label: string;
  value: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
}

interface Props {
  items: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccionar...',
  searchPlaceholder: 'Buscar categoría...',
  disabled: false,
});

const modelValue = defineModel<string>({ default: '' });

const isOpen = ref(false);
const searchQuery = ref('');
const rootRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const selectedItem = computed(() => {
  return props.items.find((item) => item.value === modelValue.value);
});

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return props.items;
  const q = searchQuery.value.trim().toLowerCase();
  return props.items.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)),
  );
});

function toggleOpen() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
}

function selectItem(item: SearchableOption) {
  modelValue.value = item.value;
  isOpen.value = false;
  searchQuery.value = '';
}

function handleClickOutside(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (!isOpen.value) return;
  if (event.key === 'Escape') {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
});

watch(
  () => modelValue.value,
  () => {
    // Keep internal consistency
  },
);
</script>

<template>
  <div ref="rootRef" class="relative w-full">
    <!-- Trigger Button -->
    <button
      type="button"
      :disabled="disabled"
      class="w-full flex items-center justify-between gap-2 px-3 py-2 text-left rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[38px]"
      :class="[
        disabled
          ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          : isOpen
            ? 'border-blue-500 ring-1 ring-blue-500 bg-white dark:bg-[#162032]'
            : 'border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#0f1523] hover:border-slate-300 dark:hover:border-[#4D7EA8]',
      ]"
      @click="toggleOpen"
    >
      <div class="flex items-center gap-2 truncate">
        <!-- Optional Color Dot or Icon -->
        <span
          v-if="selectedItem?.color"
          class="w-2.5 h-2.5 rounded-full shrink-0"
          :style="{ backgroundColor: selectedItem.color }"
        />
        <UIcon
          v-else-if="selectedItem?.icon"
          :name="selectedItem.icon"
          class="w-4 h-4 text-slate-400 shrink-0"
        />

        <span
          class="truncate font-medium text-xs sm:text-sm"
          :class="
            selectedItem
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-400 dark:text-slate-500'
          "
        >
          {{ selectedItem ? selectedItem.label : placeholder }}
        </span>
      </div>

      <UIcon
        name="i-heroicons-chevron-down"
        class="w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#0f1523] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      <!-- Search Input Header -->
      <div class="p-2 border-b border-slate-100 dark:border-[#283a59]/60">
        <div class="relative flex items-center">
          <UIcon
            name="i-heroicons-magnifying-glass"
            class="absolute left-2.5 w-4 h-4 text-slate-400"
          />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#162032] border border-slate-200 dark:border-[#283a59] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            @click.stop
          />
        </div>
      </div>

      <!-- Items List -->
      <div class="max-h-56 overflow-y-auto p-1 space-y-0.5">
        <div
          v-if="filteredItems.length === 0"
          class="p-3 text-center text-xs text-slate-400"
        >
          No se encontraron categorías
        </div>

        <button
          v-for="item in filteredItems"
          :key="item.value"
          type="button"
          class="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer"
          :class="[
            item.value === modelValue
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70',
          ]"
          @click="selectItem(item)"
        >
          <div class="flex items-center gap-2 truncate">
            <span
              v-if="item.color"
              class="w-2 h-2 rounded-full shrink-0"
              :style="{ backgroundColor: item.color }"
            />
            <UIcon
              v-else-if="item.icon"
              :name="item.icon"
              class="w-3.5 h-3.5 text-slate-400 shrink-0"
            />
            <span class="truncate">{{ item.label }}</span>
          </div>

          <UIcon
            v-if="item.value === modelValue"
            name="i-heroicons-check"
            class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0"
          />
        </button>
      </div>
    </div>
  </div>
</template>
