<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { Account } from '../../../core/entities/Account';
import type { Category } from '../../../core/entities/Category';
import type { Transaction, TransactionType } from '../../../core/entities/Transaction';
import { BankStatementParser, type ParsedStatementRow, type StatementMappingConfig } from '../../../core/services/BankStatementParser';
import { CurrencyFormatter } from '../../../core/services/CurrencyFormatter';

interface Props {
  accounts: Account[];
  categories: Category[];
  existingTransactions: Transaction[];
}

const props = defineProps<Props>();

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  (
    e: 'imported',
    transactions: {
      accountId: string;
      categoryId?: string;
      amount: number;
      type: TransactionType;
      date: string;
      note?: string;
    }[],
  ): void;
}>();

const currentStep = ref<'UPLOAD' | 'MAP' | 'PREVIEW'>('UPLOAD');
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const selectedAccountId = ref<string>('');
const fileContent = ref<string>('');
const fileName = ref<string>('');
const parsedMatrix = ref<string[][]>([]);

const mapping = reactive<StatementMappingConfig>({
  dateColumnIndex: 0,
  descriptionColumnIndex: 1,
  amountColumnIndex: 2,
  dateFormat: 'YYYY-MM-DD',
  hasHeader: true,
});

const defaultCategoryId = ref<string>('');
const parsedRows = ref<ParsedStatementRow[]>([]);
const selectedRowIndexes = ref<Set<number>>(new Set());

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      currentStep.value = 'UPLOAD';
      errorMessage.value = null;
      fileContent.value = '';
      fileName.value = '';
      parsedMatrix.value = [];
      parsedRows.value = [];
      selectedRowIndexes.value = new Set();
      if (props.accounts.length > 0 && !selectedAccountId.value) {
        selectedAccountId.value = props.accounts[0].id;
      }
    }
  },
  { immediate: true },
);

const selectedAccount = computed(() =>
  props.accounts.find((a) => a.id === selectedAccountId.value),
);

const accountOptions = computed(() =>
  props.accounts.map((acc) => ({
    label: `${acc.name} (${acc.currency})`,
    value: acc.id,
  })),
);

const dateFormatOptions = [
  { label: 'Año-Mes-Día (2026-08-26)', value: 'YYYY-MM-DD' },
  { label: 'Día/Mes/Año (26/08/2026)', value: 'DD/MM/YYYY' },
  { label: 'Mes/Día/Año (08/26/2026)', value: 'MM/DD/YYYY' },
];

const categoryOptions = computed(() =>
  props.categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  })),
);

const columnHeaders = computed(() => {
  if (parsedMatrix.value.length === 0) return [];
  const firstRow = parsedMatrix.value[0];
  return firstRow.map((col, idx) => ({
    label: `Columna ${idx + 1}: ${col.slice(0, 20)}`,
    value: idx,
  }));
});

const sampleRows = computed(() => {
  if (parsedMatrix.value.length <= 1) return [];
  return parsedMatrix.value.slice(1, 4);
});

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  fileName.value = file.name;
  errorMessage.value = null;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      fileContent.value = text;
      const matrix = BankStatementParser.parseCsvToMatrix(text);
      if (matrix.length < 2) {
        errorMessage.value = 'El archivo no contiene suficientes filas de datos.';
        return;
      }
      parsedMatrix.value = matrix;

      // Auto-detect columns if headers look standard
      const header = matrix[0].map((h) => h.toLowerCase());
      header.forEach((h, idx) => {
        if (h.includes('fech') || h.includes('date')) mapping.dateColumnIndex = idx;
        if (h.includes('desc') || h.includes('conc') || h.includes('deta') || h.includes('memo'))
          mapping.descriptionColumnIndex = idx;
        if (h.includes('monto') || h.includes('amount') || h.includes('impor') || h.includes('valor'))
          mapping.amountColumnIndex = idx;
      });

      currentStep.value = 'MAP';
    } catch (err) {
      errorMessage.value = 'Error al leer el archivo CSV.';
    }
  };
  reader.readAsText(file);
}

function handleAnalyzeRows() {
  if (!selectedAccountId.value) {
    errorMessage.value = 'Debes seleccionar una cuenta de destino.';
    return;
  }

  const rows = BankStatementParser.parseStatement({
    matrix: parsedMatrix.value,
    mapping,
    existingTransactions: props.existingTransactions,
    accountId: selectedAccountId.value,
  });

  if (rows.length === 0) {
    errorMessage.value = 'No se pudieron extraer movimientos con la configuración actual.';
    return;
  }

  parsedRows.value = rows;
  // Pre-select all valid, non-duplicate rows
  const newSet = new Set<number>();
  rows.forEach((r, idx) => {
    if (r.isValid && !r.isDuplicate) {
      newSet.add(idx);
    }
  });
  selectedRowIndexes.value = newSet;
  currentStep.value = 'PREVIEW';
}

function toggleRow(index: number) {
  if (selectedRowIndexes.value.has(index)) {
    selectedRowIndexes.value.delete(index);
  } else {
    selectedRowIndexes.value.add(index);
  }
}

function toggleAll() {
  if (selectedRowIndexes.value.size === validRowsCount.value) {
    selectedRowIndexes.value.clear();
  } else {
    parsedRows.value.forEach((r, idx) => {
      if (r.isValid) selectedRowIndexes.value.add(idx);
    });
  }
}

const validRowsCount = computed(
  () => parsedRows.value.filter((r) => r.isValid).length,
);
const duplicatesCount = computed(
  () => parsedRows.value.filter((r) => r.isDuplicate).length,
);

async function handleImport() {
  if (selectedRowIndexes.value.size === 0) {
    errorMessage.value = 'Selecciona al menos un movimiento para importar.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    const transactionsToCreate = Array.from(selectedRowIndexes.value).map((idx) => {
      const row = parsedRows.value[idx];
      return {
        accountId: selectedAccountId.value,
        categoryId: defaultCategoryId.value || undefined,
        amount: row.amount,
        type: row.type,
        date: new Date(row.date).toISOString(),
        note: row.description,
      };
    });

    emit('imported', transactionsToCreate);
    open.value = false;
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Error al importar los movimientos.';
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  open.value = false;
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Importar Extracto Bancario (CSV)"
    description="Carga tus movimientos masivamente con mapeo inteligente y detección de duplicados."
    :dismissible="false"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="rounded-xl bg-red-950/50 p-3 text-xs text-red-400 border border-red-800"
        >
          {{ errorMessage }}
        </div>

        <!-- Step 1: Upload -->
        <div v-if="currentStep === 'UPLOAD'" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cuenta de Destino <span class="text-red-400">*</span>
            </label>
            <USelect
              v-model="selectedAccountId"
              :items="accountOptions"
              value-key="value"
              class="w-full"
            />
          </div>

          <div
            class="border-2 border-dashed border-slate-200 dark:border-[#283a59] rounded-2xl p-6 text-center hover:border-primary-500 transition-colors bg-slate-50/50 dark:bg-[#0f1523]/50"
          >
            <UIcon name="i-heroicons-document-arrow-up" class="h-10 w-10 mx-auto text-slate-400" />
            <p class="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
              Selecciona tu archivo CSV o extracto bancario
            </p>
            <p class="text-xs text-slate-500 mt-1">
              Formatos soportados: CSV con delimitador por coma o punto y coma
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              class="hidden"
              id="statement-upload-input"
              @change="handleFileUpload"
            />
            <label
              for="statement-upload-input"
              class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B3E9B] text-white text-xs font-bold cursor-pointer hover:bg-blue-700 shadow-sm"
            >
              Elegir Archivo CSV
            </label>
          </div>
        </div>

        <!-- Step 2: Mapping -->
        <div v-else-if="currentStep === 'MAP'" class="space-y-4">
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Archivo: {{ fileName }}</span>
            <span class="text-xs text-slate-500">{{ parsedMatrix.length }} filas encontradas</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Columna de Fecha <span class="text-red-400">*</span>
              </label>
              <USelect
                v-model.number="mapping.dateColumnIndex"
                :items="columnHeaders"
                value-key="value"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Columna Concepto / Nota <span class="text-red-400">*</span>
              </label>
              <USelect
                v-model.number="mapping.descriptionColumnIndex"
                :items="columnHeaders"
                value-key="value"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Columna de Monto <span class="text-red-400">*</span>
              </label>
              <USelect
                v-model.number="mapping.amountColumnIndex"
                :items="columnHeaders"
                value-key="value"
                class="w-full"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Formato de Fecha
              </label>
              <USelect
                v-model="mapping.dateFormat"
                :items="dateFormatOptions"
                value-key="value"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoría por Defecto (Opcional)
              </label>
              <USelect
                v-model="defaultCategoryId"
                :items="categoryOptions"
                placeholder="Sin categoría fija"
                value-key="value"
                class="w-full"
              />
            </div>
          </div>

          <!-- Sample Table -->
          <div v-if="sampleRows.length > 0" class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            <div class="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-bold text-slate-600 dark:text-slate-300">
              Vista Previa de Filas de Muestra
            </div>
            <div class="divide-y divide-slate-100 dark:divide-slate-800">
              <div v-for="(row, rIdx) in sampleRows" :key="rIdx" class="p-2.5 flex items-center gap-2 overflow-x-auto">
                <span class="text-[10px] font-bold text-slate-400">#{{ rIdx + 1 }}</span>
                <span v-for="(cell, cIdx) in row" :key="cIdx" class="px-2 py-0.5 rounded bg-slate-50 dark:bg-[#0f1523] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {{ cell }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Preview & Confirm -->
        <div v-else-if="currentStep === 'PREVIEW'" class="space-y-4">
          <!-- Summary chips -->
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2 text-xs">
              <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                {{ selectedRowIndexes.size }} seleccionados
              </span>
              <span v-if="duplicatesCount > 0" class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                {{ duplicatesCount }} duplicados detectados
              </span>
            </div>
            <button
              type="button"
              class="text-xs font-bold text-primary-500 hover:underline"
              @click="toggleAll"
            >
              {{ selectedRowIndexes.size === validRowsCount ? 'Deseleccionar todos' : 'Seleccionar todos los válidos' }}
            </button>
          </div>

          <!-- Table list -->
          <div class="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div
              v-for="(row, idx) in parsedRows"
              :key="idx"
              class="p-2.5 flex items-center justify-between gap-3 transition-colors"
              :class="[
                !row.isValid
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 opacity-60'
                  : row.isDuplicate
                    ? 'bg-amber-50/30 dark:bg-amber-950/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40',
              ]"
            >
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  :checked="selectedRowIndexes.has(idx)"
                  :disabled="!row.isValid"
                  class="rounded text-primary-500 focus:ring-primary-500"
                  @change="toggleRow(idx)"
                />
                <div>
                  <div class="font-bold text-slate-800 dark:text-slate-200">
                    {{ row.description }}
                  </div>
                  <div class="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{{ row.date }}</span>
                    <span v-if="row.isDuplicate" class="text-amber-500 font-bold">⚠️ Posible duplicado</span>
                    <span v-if="!row.isValid" class="text-rose-500 font-bold">{{ row.errorMessage }}</span>
                  </div>
                </div>
              </div>

              <div class="text-right">
                <span
                  class="font-black"
                  :class="row.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'"
                >
                  {{ row.type === 'INCOME' ? '+' : '-' }}
                  {{ selectedAccount ? CurrencyFormatter.format(row.amount, selectedAccount.currency) : row.amount }}
                </span>
                <div class="text-[10px] uppercase font-bold text-slate-400">
                  {{ row.type === 'INCOME' ? 'Ingreso' : 'Gasto' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <UButton
          v-if="currentStep !== 'UPLOAD'"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="currentStep = currentStep === 'PREVIEW' ? 'MAP' : 'UPLOAD'"
        >
          ← Atrás
        </UButton>
        <div v-else />

        <div class="flex items-center gap-2">
          <UButton color="neutral" variant="ghost" @click="handleClose">
            Cancelar
          </UButton>

          <UButton
            v-if="currentStep === 'MAP'"
            color="primary"
            class="font-bold"
            @click="handleAnalyzeRows"
          >
            Previsualizar Movimientos →
          </UButton>

          <UButton
            v-else-if="currentStep === 'PREVIEW'"
            color="primary"
            class="font-bold"
            :loading="isSubmitting"
            :disabled="selectedRowIndexes.size === 0"
            @click="handleImport"
          >
            Importar {{ selectedRowIndexes.size }} Movimientos
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
