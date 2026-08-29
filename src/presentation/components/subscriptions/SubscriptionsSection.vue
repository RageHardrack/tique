<script setup lang="ts">
import { computed, ref } from 'vue';

import type { Category } from '../../../core/entities/Category';
import CreateSubscriptionModal from './CreateSubscriptionModal.vue';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';
import { DateFormatter } from '../../../core/services/DateFormatter';
import type {
  Account,
  SupportedCurrency,
} from '../../../core/entities/Account';
import type {
  RecurrenceFrequency,
  Subscription,
  SubscriptionDisplayItem,
} from '../../../core/entities/Subscription';

interface Props {
  subscriptions: Subscription[];
  accounts: Account[];
  categories: Category[];
  baseCurrency: SupportedCurrency;
  isLoading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (
    e: 'create',
    payload: {
      name: string;
      accountId: string;
      categoryId?: string;
      amount: number;
      currency: string;
      frequency: RecurrenceFrequency;
      customIntervalDays?: number | null;
      nextDueDate: string;
    },
  ): void;
  (
    e: 'update',
    id: string,
    payload: {
      name: string;
      accountId: string;
      categoryId?: string | null;
      amount: number;
      currency: string;
      frequency: RecurrenceFrequency;
      customIntervalDays?: number | null;
      nextDueDate: string;
    },
  ): void;
  (e: 'pay', id: string): void;
  (e: 'delete', id: string): void;
}>();

function getFrequencyLabel(
  freq: RecurrenceFrequency,
  customDays?: number | null,
): string {
  switch (freq) {
    case 'WEEKLY':
      return '/ semana';
    case 'BIWEEKLY':
      return '/ quincena';
    case 'MONTHLY':
      return '/ mes';
    case 'BIMONTHLY':
      return '/ 2 meses';
    case 'QUARTERLY':
      return '/ 3 meses';
    case 'SEMIANNUAL':
      return '/ 6 meses';
    case 'YEARLY':
      return '/ año';
    case 'CUSTOM':
      return customDays ? `/ ${customDays} días` : '/ personalizado';
    default:
      return '/ mes';
  }
}

const isCreateModalOpen = ref(false);
const editingSubscription = ref<Subscription | null>(null);

function handleOpenCreate() {
  editingSubscription.value = null;
  isCreateModalOpen.value = true;
}

function handleEdit(sub: Subscription) {
  editingSubscription.value = sub;
  isCreateModalOpen.value = true;
}

const accountsMap = computed(() => {
  const map: Record<string, string> = {};
  props.accounts.forEach((acc) => {
    map[acc.id] = acc.name;
  });
  return map;
});

const categoriesMap = computed(() => {
  const map: Record<string, Category> = {};
  props.categories.forEach((cat) => {
    map[cat.id] = cat;
  });
  return map;
});

function calculateDaysDifference(dueDateString: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const due = new Date(dueDateString);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - now.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

const displayItems = computed<SubscriptionDisplayItem[]>(() => {
  return props.subscriptions.map((s) => {
    const accountName = accountsMap.value[s.accountId] || 'Cuenta';
    const category = s.categoryId
      ? categoriesMap.value[s.categoryId]
      : undefined;

    const days = calculateDaysDifference(s.nextDueDate);
    let urgencyStatus: 'DUE_TODAY' | 'DUE_SOON' | 'OVERDUE' | 'NORMAL' =
      'NORMAL';
    let urgencyBadgeText = `Vence en ${days} días`;

    if (days === 0) {
      urgencyStatus = 'DUE_TODAY';
      urgencyBadgeText = 'Vence hoy';
    } else if (days < 0) {
      urgencyStatus = 'OVERDUE';
      urgencyBadgeText = `Venció hace ${Math.abs(days)} días`;
    } else if (days <= 3) {
      urgencyStatus = 'DUE_SOON';
      urgencyBadgeText = `Vence en ${days} días`;
    }

    const formattedDueDate = DateFormatter.format(s.nextDueDate, 'D MMM');

    return {
      subscription: s,
      accountName,
      categoryName: category?.name,
      categoryIcon: category?.icon || 'i-heroicons-arrow-path',
      categoryColor: category?.color || '#3B82F6',
      formattedAmount: CurrencyFormatter.format(s.amount, s.currency),
      formattedDueDate,
      daysRemaining: days,
      urgencyStatus,
      urgencyBadgeText,
    };
  });
});

function handlePay(item: SubscriptionDisplayItem) {
  emit('pay', item.subscription.id);
}

function handleDelete(id: string) {
  emit('delete', id);
}
</script>

<template>
  <section class="space-y-4">
    <header
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div>
        <h2
          class="text-xl font-black text-[#2B4162] dark:text-[#E0DDCF] tracking-tight"
        >
          Suscripciones y Pagos Fijos
        </h2>
        <p class="text-sm text-slate-500 dark:text-[#4D7EA8]">
          Gestiona tus cobros recurrentes y fechas límite para nunca pagar de
          más.
        </p>
      </div>

      <UButton
        color="primary"
        icon="i-heroicons-plus-circle"
        :disabled="accounts.length === 0"
        @click="handleOpenCreate"
      >
        Nueva Suscripción
      </UButton>
    </header>

    <!-- Empty State -->
    <div
      v-if="displayItems.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/50 p-10 text-center space-y-3 shadow-sm"
    >
      <div
        class="rounded-full bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-[#283a59] p-3 text-[#1B3E9B] dark:text-sky-400"
      >
        <UIcon name="i-heroicons-arrow-path" class="h-8 w-8" />
      </div>
      <div class="space-y-1">
        <h3 class="text-base font-bold text-slate-900 dark:text-[#f1f5f9]">
          No tienes suscripciones registradas
        </h3>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8] max-w-sm">
          Registra tus pagos mensuales (Netflix, Spotify, alquiler, internet)
          para anticipar vencimientos.
        </p>
      </div>
      <UButton
        v-if="accounts.length > 0"
        color="primary"
        variant="subtle"
        icon="i-heroicons-plus"
        @click="isCreateModalOpen = true"
      >
        Registrar primera suscripción
      </UButton>
    </div>

    <!-- Subscriptions Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in displayItems"
        :key="item.subscription.id"
        class="rounded-2xl border border-slate-200 dark:border-[#283a59] bg-white dark:bg-[#162032]/95 p-5 shadow-sm dark:shadow-lg dark:shadow-black/20 flex flex-col justify-between space-y-4"
      >
        <div>
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-[#283a59] bg-slate-100 dark:bg-[#0f1523]"
              >
                <UIcon
                  :name="item.categoryIcon"
                  class="h-5 w-5"
                  :style="{ color: item.categoryColor }"
                />
              </div>
              <div>
                <h4
                  class="font-bold text-sm text-slate-900 dark:text-[#f1f5f9]"
                >
                  {{ item.subscription.name }}
                </h4>
                <p class="text-xs text-slate-500 dark:text-[#94a3b8]">
                  {{ item.accountName }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-pencil-square"
                class="text-slate-400 hover:text-primary-500"
                @click="handleEdit(item.subscription)"
              />
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-trash"
                class="text-slate-400 hover:text-rose-500"
                @click="handleDelete(item.subscription.id)"
              />
            </div>
          </div>

          <!-- Amount and Frequency Badge -->
          <div class="mt-3 flex items-center justify-between">
            <div class="flex items-baseline gap-1">
              <span class="text-lg font-black text-slate-900 dark:text-white">
                {{ item.formattedAmount }}
              </span>
              <span
                class="text-xs font-semibold text-slate-500 dark:text-slate-400"
              >
                {{
                  getFrequencyLabel(
                    item.subscription.frequency,
                    item.subscription.customIntervalDays,
                  )
                }}
              </span>
            </div>

            <UBadge
              :color="
                item.urgencyStatus === 'OVERDUE'
                  ? 'error'
                  : item.urgencyStatus === 'DUE_TODAY' ||
                      item.urgencyStatus === 'DUE_SOON'
                    ? 'warning'
                    : 'neutral'
              "
              variant="subtle"
              size="xs"
              class="font-bold"
            >
              {{ item.urgencyBadgeText }}
            </UBadge>
          </div>
        </div>

        <!-- Action Footer -->
        <div
          class="pt-3 border-t border-slate-100 dark:border-[#283a59]/60 flex items-center justify-between"
        >
          <div class="text-xs text-slate-500 dark:text-[#94a3b8]">
            Próximo:
            <strong class="text-slate-900 dark:text-[#cbd5e1]">{{
              item.formattedDueDate
            }}</strong>
          </div>

          <UButton
            color="primary"
            variant="soft"
            size="xs"
            icon="i-heroicons-check-circle"
            @click="handlePay(item)"
          >
            Registrar Pago
          </UButton>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <CreateSubscriptionModal
      v-model:open="isCreateModalOpen"
      :subscription="editingSubscription"
      :accounts="accounts"
      :categories="categories"
      :base-currency="baseCurrency"
      @create="emit('create', $event)"
      @update="(id, payload) => emit('update', id, payload)"
    />
  </section>
</template>
