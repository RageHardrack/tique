<script setup lang="ts">
import { computed } from 'vue';

import type { Account } from '../../../core/entities/Account';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import type { TransactionTemplate } from '../../../core/entities/TransactionTemplate';

interface Props {
  templates: TransactionTemplate[];
  accounts: Account[];
  activeTemplateId?: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'select', template: TransactionTemplate): void;
}>();

const TYPE_ICONS = {
  EXPENSE: { icon: 'i-heroicons-arrow-up-right', color: 'text-rose-500' },
  INCOME: { icon: 'i-heroicons-arrow-down-left', color: 'text-emerald-500' },
  TRANSFER: { icon: 'i-heroicons-arrows-right-left', color: 'text-sky-500' },
} as const;

/** Never let an unexpected payload break the chip row. */
function typeBadge(type: TransactionTemplate['type']) {
  return TYPE_ICONS[type] ?? TYPE_ICONS.EXPENSE;
}

/** Display-only projection: the stored amount is worth the source account currency. */
const chips = computed(() =>
  props.templates.map((template) => {
    const source = props.accounts.find((acc) => acc.id === template.accountId);
    const amount = template.defaultAmount;

    return {
      template,
      amountLabel:
        amount !== null && amount !== undefined
          ? CurrencyFormatter.format(amount, source?.currency || 'USD')
          : null,
    };
  }),
);
</script>

<template>
  <div v-if="chips.length > 0" class="space-y-1.5">
    <span
      class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
    >
      Plantillas
    </span>
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      <button
        v-for="chip in chips"
        :key="chip.template.id"
        :data-testid="`quick-add-template-${chip.template.id}`"
        type="button"
        :aria-pressed="activeTemplateId === chip.template.id"
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer min-h-[36px]"
        :class="[
          activeTemplateId === chip.template.id
            ? 'border-primary-500 ring-1 ring-primary-500 text-primary-700 dark:text-sky-300'
            : '',
        ]"
        @click="emit('select', chip.template)"
      >
        <UIcon
          :name="typeBadge(chip.template.type).icon"
          class="w-3.5 h-3.5"
          :class="typeBadge(chip.template.type).color"
        />
        <span>{{ chip.template.name }}</span>
        <span
          v-if="chip.amountLabel"
          class="text-slate-400 font-mono text-[10px]"
        >
          {{ chip.amountLabel }}
        </span>
      </button>
    </div>
  </div>
</template>
