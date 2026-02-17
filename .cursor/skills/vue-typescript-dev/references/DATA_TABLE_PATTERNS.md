# Data Table & List Patterns

Reusable table components, filtering, sorting, pagination, status badges, file upload, and export patterns.

> **Use case:** Lista płatności, lista delegacji, tabela lokalizacji, wnioski o zaliczki, zestawienia.

## Reusable DataTable Component

```vue
<!-- src/components/common/DataTable.vue -->
<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'

export interface Column<T> {
  key: keyof T & string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  format?: (value: unknown, row: T) => string
}

interface Props {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyText?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: 'Brak danych',
  sortOrder: 'asc',
})

const emit = defineEmits<{
  sort: [column: string, order: 'asc' | 'desc']
  'row-click': [row: T]
}>()

function handleSort(column: Column<T>) {
  if (!column.sortable) return

  const newOrder =
    props.sortBy === column.key && props.sortOrder === 'asc' ? 'desc' : 'asc'
  emit('sort', column.key, newOrder)
}

function formatCell(column: Column<T>, row: T): string {
  const value = row[column.key]
  if (column.format) return column.format(value, row)
  if (value === null || value === undefined) return '—'
  return String(value)
}
</script>

<template>
  <div class="data-table-wrapper">
    <div v-if="loading" class="data-table-loading">
      <span class="spinner" /> Ładowanie...
    </div>

    <table v-else-if="data.length > 0" class="data-table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="{ width: col.width, textAlign: col.align ?? 'left' }"
            :class="{ sortable: col.sortable, active: sortBy === col.key }"
            @click="handleSort(col)"
          >
            {{ col.label }}
            <span v-if="col.sortable && sortBy === col.key" class="sort-icon">
              {{ sortOrder === 'asc' ? '▲' : '▼' }}
            </span>
          </th>
          <!-- Slot for action column header -->
          <th v-if="$slots.actions" style="width: 120px">Akcje</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in data"
          :key="index"
          @click="emit('row-click', row)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            :style="{ textAlign: col.align ?? 'left' }"
          >
            <!-- Named slot for custom cell rendering -->
            <slot :name="`cell-${col.key}`" :value="row[col.key]" :row="row">
              {{ formatCell(col, row) }}
            </slot>
          </td>
          <td v-if="$slots.actions">
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="data-table-empty">
      {{ emptyText }}
    </div>
  </div>
</template>
```

## Table Filters Composable

```typescript
// src/composables/useTableFilters.ts
import { ref, computed, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export interface FilterConfig {
  key: string
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number'
  label: string
  options?: { value: string; label: string }[] // for select type
  defaultValue?: unknown
}

export interface PaginationState {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export function useTableFilters<T extends Record<string, unknown>>(
  filterConfigs: FilterConfig[],
  fetchFn: (params: Record<string, unknown>) => Promise<{ data: T[]; total: number }>,
) {
  const router = useRouter()
  const route = useRoute()

  // Filter state
  const filters = ref<Record<string, unknown>>({}) as Ref<Record<string, unknown>>
  const sortBy = ref<string>('')
  const sortOrder = ref<'asc' | 'desc'>('asc')

  // Data state
  const data = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const pagination = ref<PaginationState>({
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 0,
  })

  // Initialize filters from URL query params
  function initFromUrl() {
    const query = route.query
    for (const config of filterConfigs) {
      filters.value[config.key] = query[config.key] ?? config.defaultValue ?? ''
    }
    if (query.sort) sortBy.value = query.sort as string
    if (query.order) sortOrder.value = query.order as 'asc' | 'desc'
    if (query.page) pagination.value.page = Number(query.page)
  }

  // Sync filters to URL
  function syncToUrl() {
    const query: Record<string, string> = {}
    for (const [key, value] of Object.entries(filters.value)) {
      if (value !== '' && value !== null && value !== undefined) {
        query[key] = String(value)
      }
    }
    if (sortBy.value) query.sort = sortBy.value
    if (sortOrder.value !== 'asc') query.order = sortOrder.value
    if (pagination.value.page > 1) query.page = String(pagination.value.page)

    router.replace({ query })
  }

  // Fetch data
  async function fetchData() {
    loading.value = true
    error.value = null

    try {
      const params: Record<string, unknown> = {
        ...filters.value,
        page: pagination.value.page,
        per_page: pagination.value.perPage,
        sort: sortBy.value || undefined,
        order: sortOrder.value,
      }

      const result = await fetchFn(params)
      data.value = result.data
      pagination.value.total = result.total
      pagination.value.totalPages = Math.ceil(result.total / pagination.value.perPage)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Wystąpił błąd'
    } finally {
      loading.value = false
    }
  }

  // Actions
  function setSort(column: string, order: 'asc' | 'desc') {
    sortBy.value = column
    sortOrder.value = order
    pagination.value.page = 1
    syncToUrl()
    fetchData()
  }

  function setPage(page: number) {
    pagination.value.page = page
    syncToUrl()
    fetchData()
  }

  function applyFilters() {
    pagination.value.page = 1
    syncToUrl()
    fetchData()
  }

  function resetFilters() {
    for (const config of filterConfigs) {
      filters.value[config.key] = config.defaultValue ?? ''
    }
    pagination.value.page = 1
    syncToUrl()
    fetchData()
  }

  // Initialize
  initFromUrl()

  return {
    // State
    filters,
    data,
    loading,
    error,
    sortBy,
    sortOrder,
    pagination,
    // Actions
    fetchData,
    setSort,
    setPage,
    applyFilters,
    resetFilters,
  }
}
```

## Usage: Feature Page with Table + Filters

```vue
<!-- src/components/features/payments/PaymentList.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import DataTable, { type Column } from '@/components/common/DataTable.vue'
import TableFilters from '@/components/common/TableFilters.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useTableFilters, type FilterConfig } from '@/composables/useTableFilters'
import { usePaymentApi } from '@/composables/api/usePaymentApi'

interface Payment {
  id: string
  transactionDate: string
  amount: number
  senderName: string
  title: string
  category: string | null
  status: string
}

const { fetchPayments } = usePaymentApi()

const filterConfigs: FilterConfig[] = [
  { key: 'search', type: 'text', label: 'Szukaj (nadawca, tytuł)' },
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    options: [
      { value: '', label: 'Wszystkie' },
      { value: 'new', label: 'Nowe' },
      { value: 'categorized', label: 'Skategoryzowane' },
      { value: 'verified', label: 'Zweryfikowane' },
    ],
  },
  { key: 'date_from', type: 'date', label: 'Od daty' },
  { key: 'date_to', type: 'date', label: 'Do daty' },
]

const columns: Column<Payment>[] = [
  { key: 'transactionDate', label: 'Data', sortable: true, width: '120px' },
  {
    key: 'amount',
    label: 'Kwota',
    sortable: true,
    align: 'right',
    width: '120px',
    format: (val) => `${(val as number).toFixed(2)} PLN`,
  },
  { key: 'senderName', label: 'Nadawca', sortable: true },
  { key: 'title', label: 'Tytuł' },
  { key: 'category', label: 'Kategoria', sortable: true, width: '150px' },
  { key: 'status', label: 'Status', width: '130px' },
]

const {
  filters,
  data,
  loading,
  sortBy,
  sortOrder,
  pagination,
  fetchData,
  setSort,
  setPage,
  applyFilters,
  resetFilters,
} = useTableFilters<Payment>(filterConfigs, fetchPayments)

onMounted(() => fetchData())
</script>

<template>
  <div class="payment-list">
    <header class="page-header">
      <h1>Płatności</h1>
      <div class="page-actions">
        <button class="btn btn-secondary" @click="$router.push('/payments/import')">
          Import CSV
        </button>
        <a :href="`/api/payments/export?${new URLSearchParams(filters as any)}`" class="btn btn-outline">
          Eksport CSV
        </a>
      </div>
    </header>

    <TableFilters
      :configs="filterConfigs"
      :filters="filters"
      @apply="applyFilters"
      @reset="resetFilters"
    />

    <DataTable
      :columns="columns"
      :data="data"
      :loading="loading"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      @sort="setSort"
      @row-click="(row) => $router.push(`/payments/${row.id}`)"
    >
      <!-- Custom cell: status badge -->
      <template #cell-status="{ value }">
        <StatusBadge :status="value as string" />
      </template>

      <!-- Custom cell: category with fallback -->
      <template #cell-category="{ value }">
        <span v-if="value" class="category-tag">{{ value }}</span>
        <span v-else class="text-muted">Brak</span>
      </template>

      <!-- Row actions -->
      <template #actions="{ row }">
        <button class="btn-icon" title="Edytuj" @click.stop="$router.push(`/payments/${row.id}/edit`)">
          ✏️
        </button>
      </template>
    </DataTable>

    <TablePagination
      :page="pagination.page"
      :total-pages="pagination.totalPages"
      :total="pagination.total"
      @change="setPage"
    />
  </div>
</template>
```

## Status Badge Component

```vue
<!-- src/components/common/StatusBadge.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: string
  /** Override default label mapping */
  label?: string
}

const props = defineProps<Props>()

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  // Workflow statuses
  draft: { label: 'Szkic', color: 'gray' },
  submitted: { label: 'Złożony', color: 'blue' },
  pending: { label: 'Oczekuje', color: 'yellow' },
  approved: { label: 'Zaakceptowany', color: 'green' },
  leader_approved: { label: 'Lider OK', color: 'teal' },
  finance_approved: { label: 'Finanse OK', color: 'green' },
  rejected: { label: 'Odrzucony', color: 'red' },
  settled: { label: 'Rozliczony', color: 'green' },
  cancelled: { label: 'Anulowany', color: 'gray' },
  // Data statuses
  new: { label: 'Nowy', color: 'blue' },
  categorized: { label: 'Skategoryzowany', color: 'teal' },
  verified: { label: 'Zweryfikowany', color: 'green' },
  duplicate: { label: 'Duplikat', color: 'orange' },
  error: { label: 'Błąd', color: 'red' },
  // Generic
  active: { label: 'Aktywny', color: 'green' },
  inactive: { label: 'Nieaktywny', color: 'gray' },
}

const config = computed(() => STATUS_MAP[props.status] ?? { label: props.status, color: 'gray' })
const displayLabel = computed(() => props.label ?? config.value.label)
</script>

<template>
  <span :class="['status-badge', `status-badge--${config.color}`]">
    {{ displayLabel }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge--gray { background: #f1f5f9; color: #475569; }
.status-badge--blue { background: #dbeafe; color: #1d4ed8; }
.status-badge--green { background: #dcfce7; color: #15803d; }
.status-badge--yellow { background: #fef9c3; color: #a16207; }
.status-badge--orange { background: #ffedd5; color: #c2410c; }
.status-badge--red { background: #fee2e2; color: #b91c1c; }
.status-badge--teal { background: #ccfbf1; color: #0f766e; }
</style>
```

## File Upload Component (for CSV Import)

```vue
<!-- src/components/common/FileUpload.vue -->
<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  accept?: string
  maxSizeMb?: number
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.csv,.txt',
  maxSizeMb: 10,
  label: 'Wybierz plik lub przeciągnij tutaj',
})

const emit = defineEmits<{
  select: [file: File]
  error: [message: string]
}>()

const isDragging = ref(false)
const selectedFile = ref<File | null>(null)

function validateAndEmit(file: File) {
  const maxBytes = props.maxSizeMb * 1024 * 1024
  if (file.size > maxBytes) {
    emit('error', `Plik przekracza ${props.maxSizeMb}MB`)
    return
  }

  selectedFile.value = file
  emit('select', file)
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    validateAndEmit(input.files[0])
  }
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files[0]) {
    validateAndEmit(event.dataTransfer.files[0])
  }
}
</script>

<template>
  <div
    :class="['file-upload', { 'file-upload--dragging': isDragging }]"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="onDrop"
  >
    <input
      type="file"
      :accept="accept"
      class="file-upload__input"
      @change="onFileInput"
    />

    <div v-if="selectedFile" class="file-upload__selected">
      {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
    </div>
    <div v-else class="file-upload__placeholder">
      {{ label }}
    </div>
  </div>
</template>
```

## Import Page with Preview

```vue
<!-- src/components/features/payments/PaymentImport.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import FileUpload from '@/components/common/FileUpload.vue'
import DataTable from '@/components/common/DataTable.vue'
import { usePaymentApi } from '@/composables/api/usePaymentApi'

const { previewImport, executeImport } = usePaymentApi()

const file = ref<File | null>(null)
const previewData = ref<{ data: unknown[]; errors: unknown[] } | null>(null)
const importResult = ref<{ imported: number; errors: unknown[] } | null>(null)
const loading = ref(false)
const skipDuplicates = ref(true)

async function handleFileSelect(selectedFile: File) {
  file.value = selectedFile
  loading.value = true

  try {
    previewData.value = await previewImport(selectedFile)
  } finally {
    loading.value = false
  }
}

async function handleImport() {
  if (!file.value) return
  loading.value = true

  try {
    importResult.value = await executeImport(file.value, {
      skipDuplicates: skipDuplicates.value,
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="payment-import">
    <h1>Import płatności</h1>

    <!-- Step 1: Upload -->
    <section v-if="!importResult">
      <FileUpload accept=".csv" @select="handleFileSelect" />

      <!-- Step 2: Preview -->
      <template v-if="previewData">
        <h2>Podgląd ({{ previewData.data.length }} rekordów)</h2>

        <div v-if="previewData.errors.length" class="alert alert-warning">
          <strong>{{ previewData.errors.length }} błędów znalezionych</strong>
          <ul>
            <li v-for="(err, i) in previewData.errors.slice(0, 10)" :key="i">
              Wiersz {{ (err as any).row }}: {{ (err as any).message }}
            </li>
          </ul>
        </div>

        <label class="checkbox">
          <input v-model="skipDuplicates" type="checkbox" />
          Pomiń duplikaty
        </label>

        <button class="btn btn-primary" :disabled="loading" @click="handleImport">
          Importuj {{ previewData.data.length }} rekordów
        </button>
      </template>
    </section>

    <!-- Step 3: Result -->
    <section v-else class="import-result">
      <div class="alert alert-success">
        Zaimportowano {{ importResult.imported }} rekordów.
      </div>
      <button class="btn btn-secondary" @click="importResult = null; previewData = null; file = null">
        Importuj kolejny plik
      </button>
    </section>
  </div>
</template>
```

## API Composable Pattern (for Data Fetching)

```typescript
// src/composables/api/usePaymentApi.ts
import { useApi } from './useApi'

interface PaymentListResponse {
  data: Payment[]
  total: number
}

export function usePaymentApi() {
  const { get, post, postFile } = useApi()

  async function fetchPayments(
    params: Record<string, unknown>,
  ): Promise<PaymentListResponse> {
    return get<PaymentListResponse>('/api/payments', params)
  }

  async function previewImport(file: File) {
    return postFile('/api/payments/import/preview', file)
  }

  async function executeImport(
    file: File,
    options: { skipDuplicates: boolean },
  ) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('skip_duplicates', String(options.skipDuplicates))
    return post('/api/payments/import', formData)
  }

  return { fetchPayments, previewImport, executeImport }
}
```

## Pagination Component

```vue
<!-- src/components/common/TablePagination.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  page: number
  totalPages: number
  total: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ change: [page: number] }>()

const pages = computed(() => {
  const range: number[] = []
  const start = Math.max(1, props.page - 2)
  const end = Math.min(props.totalPages, props.page + 2)

  for (let i = start; i <= end; i++) {
    range.push(i)
  }
  return range
})
</script>

<template>
  <nav v-if="totalPages > 1" class="table-pagination">
    <span class="table-pagination__info">
      {{ total }} rekordów, strona {{ page }} z {{ totalPages }}
    </span>

    <div class="table-pagination__buttons">
      <button :disabled="page <= 1" @click="emit('change', page - 1)">
        &laquo; Poprzednia
      </button>
      <button
        v-for="p in pages"
        :key="p"
        :class="{ active: p === page }"
        @click="emit('change', p)"
      >
        {{ p }}
      </button>
      <button :disabled="page >= totalPages" @click="emit('change', page + 1)">
        Następna &raquo;
      </button>
    </div>
  </nav>
</template>
```

## Change History Component

```vue
<!-- src/components/common/ChangeHistory.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/api/useApi'

interface ChangeEntry {
  action: 'create' | 'update' | 'delete'
  changes: Record<string, { old: unknown; new: unknown }>
  changedBy: string | null
  createdAt: string
}

interface Props {
  entityType: string
  entityId: string
}

const props = defineProps<Props>()
const { get } = useApi()

const history = ref<ChangeEntry[]>([])
const loading = ref(true)

const ACTION_LABELS: Record<string, string> = {
  create: 'Utworzono',
  update: 'Zmieniono',
  delete: 'Usunięto',
}

onMounted(async () => {
  try {
    history.value = await get<ChangeEntry[]>(
      `/api/${props.entityType}/${props.entityId}/history`,
    )
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="change-history">
    <h3>Historia zmian</h3>

    <div v-if="loading" class="loading">Ładowanie...</div>

    <div v-else-if="history.length === 0" class="empty">
      Brak historii zmian.
    </div>

    <ul v-else class="timeline">
      <li v-for="(entry, i) in history" :key="i" class="timeline-item">
        <div class="timeline-header">
          <strong>{{ ACTION_LABELS[entry.action] ?? entry.action }}</strong>
          <span class="timeline-meta">
            {{ entry.changedBy ?? 'System' }} &middot;
            {{ new Date(entry.createdAt).toLocaleString('pl-PL') }}
          </span>
        </div>

        <ul v-if="Object.keys(entry.changes).length > 0" class="change-details">
          <li v-for="(change, field) in entry.changes" :key="field">
            <strong>{{ field }}:</strong>
            <span class="old-value">{{ change.old ?? '—' }}</span>
            &rarr;
            <span class="new-value">{{ change.new ?? '—' }}</span>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
```

## Workflow Actions Component

```vue
<!-- src/components/common/WorkflowActions.vue -->
<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  availableTransitions: string[]
  loading?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  transition: [name: string, reason?: string]
}>()

const TRANSITION_CONFIG: Record<string, { label: string; color: string; requiresReason: boolean }> = {
  submit: { label: 'Złóż wniosek', color: 'blue', requiresReason: false },
  to_leader_review: { label: 'Zatwierdź (Lider)', color: 'green', requiresReason: false },
  to_finance_review: { label: 'Zatwierdź (Finanse)', color: 'green', requiresReason: false },
  approve: { label: 'Zatwierdź', color: 'green', requiresReason: false },
  reject: { label: 'Odrzuć', color: 'red', requiresReason: true },
  settle: { label: 'Rozlicz', color: 'teal', requiresReason: false },
  reopen: { label: 'Otwórz ponownie', color: 'yellow', requiresReason: true },
}

const rejectReason = ref('')
const showReasonDialog = ref<string | null>(null)

function handleClick(transition: string) {
  const config = TRANSITION_CONFIG[transition]
  if (config?.requiresReason) {
    showReasonDialog.value = transition
    return
  }
  emit('transition', transition)
}

function submitWithReason() {
  if (showReasonDialog.value) {
    emit('transition', showReasonDialog.value, rejectReason.value)
    showReasonDialog.value = null
    rejectReason.value = ''
  }
}
</script>

<template>
  <div class="workflow-actions">
    <button
      v-for="t in availableTransitions"
      :key="t"
      :class="['btn', `btn--${TRANSITION_CONFIG[t]?.color ?? 'gray'}`]"
      :disabled="loading"
      @click="handleClick(t)"
    >
      {{ TRANSITION_CONFIG[t]?.label ?? t }}
    </button>

    <!-- Reason dialog (for reject, reopen) -->
    <div v-if="showReasonDialog" class="reason-dialog">
      <textarea v-model="rejectReason" placeholder="Podaj powód..." rows="3" />
      <div class="reason-dialog__actions">
        <button class="btn btn--gray" @click="showReasonDialog = null">Anuluj</button>
        <button class="btn btn--red" @click="submitWithReason">Potwierdź</button>
      </div>
    </div>
  </div>
</template>
```

---

> **Version:** 1.0 | **Stack:** Vue 3 Composition API, TypeScript, Vue Router  
> **See also:** `COMPONENT_BEST_PRACTICES.md` (naming, sizing), `COMPOSITION_API_PATTERNS.md` (composables)
