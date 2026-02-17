# Component Best Practices

Architecture patterns, naming conventions, and best practices for Vue 3 components.

## Component Organization

### File Structure

```
src/components/
├── common/              # Reusable UI primitives
│   ├── Button.vue
│   ├── Input.vue
│   ├── Modal.vue
│   └── Card.vue
├── features/            # Feature-specific components
│   ├── auth/
│   │   ├── LoginForm.vue
│   │   └── RegisterForm.vue
│   ├── admin/
│   │   ├── UserTable.vue
│   │   └── UserFilters.vue
│   └── profile/
│       ├── ProfileCard.vue
│       └── ProfileEditor.vue
└── layouts/             # Layout components
    ├── DefaultLayout.vue
    ├── AdminLayout.vue
    └── AuthLayout.vue
```

### Naming Conventions

```typescript
// ✅ GOOD: PascalCase for components
Button.vue
UserProfile.vue
AdminDashboard.vue

// ✅ GOOD: Multi-word names (avoid single-word)
UserCard.vue (not Card.vue)
ProductList.vue (not List.vue)
SearchInput.vue (not Input.vue - unless it's truly generic)

// ❌ BAD: Single-word names (reserved for HTML elements)
Card.vue // Could conflict with <card> if it becomes HTML element
List.vue
Table.vue
```

## Component Size Limits

### Rules

- **Maximum 300 lines** per component (including template, script, style)
- **Maximum 10 props** per component
- **Maximum nesting depth: 5 levels** in template

### When to Split

```typescript
// ❌ BAD: Too large (400+ lines)
<template>
  <div class="user-dashboard">
    <!-- 50 lines of template -->
    <div class="user-profile">
      <!-- 50 lines -->
    </div>
    <div class="user-stats">
      <!-- 50 lines -->
    </div>
    <div class="user-activities">
      <!-- 100 lines -->
    </div>
  </div>
</template>

<script setup lang="ts">
// 150 lines of logic
</script>

// ✅ GOOD: Split into smaller components
<template>
  <div class="user-dashboard">
    <UserProfile :user="user" />
    <UserStats :stats="stats" />
    <UserActivities :activities="activities" />
  </div>
</template>

<script setup lang="ts">
// 30 lines of composition
</script>
```

## Props Best Practices

### Props Validation

```typescript
<script setup lang="ts">
// ✅ GOOD: Typed props with defaults
interface Props {
  title: string
  count?: number
  status?: 'pending' | 'approved' | 'rejected'
  user?: User
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  status: 'pending'
})
</script>
```

### Prop Naming

```typescript
// ✅ GOOD: camelCase in script
interface Props {
  userId: number
  isActive: boolean
  maxCount: number
}

// ✅ GOOD: kebab-case in template
<UserCard
  :user-id="123"
  :is-active="true"
  :max-count="10"
/>
```

### Boolean Props

```typescript
// ✅ GOOD: Explicit boolean props
interface Props {
  isActive: boolean
  hasError: boolean
  canEdit: boolean
}

// ✅ Usage in template (shorthand for true)
<MyComponent is-active has-error />

// ✅ Explicit
<MyComponent :is-active="true" :has-error="false" />
```

### Avoid Mutating Props

```typescript
<script setup lang="ts">
interface Props {
  count: number
}

const props = defineProps<Props>()

// ❌ BAD: Mutating prop directly
function increment() {
  props.count++ // Error!
}

// ✅ GOOD: Emit event to parent
const emit = defineEmits<{
  (e: 'update:count', value: number): void
}>()

function increment() {
  emit('update:count', props.count + 1)
}

// ✅ GOOD: Create local copy if needed for internal state
const localCount = ref(props.count)
</script>
```

## Events Best Practices

### Event Naming

```typescript
// ✅ GOOD: Descriptive event names
const emit = defineEmits<{
  (e: 'submit', data: FormData): void
  (e: 'cancel'): void
  (e: 'user-selected', user: User): void
}>()

// ❌ BAD: Generic names
(e: 'click'): void // What was clicked?
(e: 'change'): void // What changed?
```

### v-model Pattern

```typescript
// ✅ GOOD: Implement v-model
<script setup lang="ts">
interface Props {
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <input
    :value="modelValue"
    @input="handleInput"
  />
</template>

// Usage in parent:
<MyInput v-model="text" />
```

### Multiple v-models

```typescript
<script setup lang="ts">
interface Props {
  firstName: string
  lastName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:firstName', value: string): void
  (e: 'update:lastName', value: string): void
}>()
</script>

<template>
  <div>
    <input
      :value="firstName"
      @input="emit('update:firstName', ($event.target as HTMLInputElement).value)"
    />
    <input
      :value="lastName"
      @input="emit('update:lastName', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

// Usage:
<UserForm
  v-model:first-name="user.firstName"
  v-model:last-name="user.lastName"
/>
```

## Slots Best Practices

### Named Slots

```typescript
<template>
  <div class="card">
    <header v-if="$slots.header">
      <slot name="header" />
    </header>
    
    <main>
      <slot /> <!-- Default slot -->
    </main>
    
    <footer v-if="$slots.footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

// Usage:
<Card>
  <template #header>
    <h2>Title</h2>
  </template>
  
  <p>Main content</p>
  
  <template #footer>
    <button>Action</button>
  </template>
</Card>
```

### Scoped Slots

```typescript
<script setup lang="ts">
interface Props {
  items: Array<{ id: number; name: string }>
}

const props = defineProps<Props>()
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <!-- Provide data to parent via slot props -->
      <slot :item="item" :index="item.id">
        <!-- Default fallback -->
        {{ item.name }}
      </slot>
    </li>
  </ul>
</template>

// Usage:
<ItemList :items="items">
  <template #default="{ item, index }">
    <strong>{{ index }}:</strong> {{ item.name }}
  </template>
</ItemList>
```

## Composables in Components

### When to Extract to Composable

```typescript
// ❌ BAD: Logic duplicated across components
// Component A
<script setup lang="ts">
const isOpen = ref(false)
function open() { isOpen.value = true }
function close() { isOpen.value = false }
function toggle() { isOpen.value = !isOpen.value }
</script>

// Component B - same logic!
<script setup lang="ts">
const isOpen = ref(false)
function open() { isOpen.value = true }
function close() { isOpen.value = false }
function toggle() { isOpen.value = !isOpen.value }
</script>

// ✅ GOOD: Extract to composable
// composables/useToggle.ts
export function useToggle(initial = false) {
  const isOpen = ref(initial)
  
  function open() { isOpen.value = true }
  function close() { isOpen.value = false }
  function toggle() { isOpen.value = !isOpen.value }
  
  return { isOpen, open, close, toggle }
}

// Both components
<script setup lang="ts">
import { useToggle } from '@/composables/useToggle'
const { isOpen, open, close, toggle } = useToggle()
</script>
```

### Keep Components Thin

```typescript
// ❌ BAD: Too much logic in component
<script setup lang="ts">
const users = ref<User[]>([])
const loading = ref(false)
const error = ref<Error | null>(null)
const search = ref('')
const sortBy = ref<'name' | 'email'>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

const filteredUsers = computed(() => {
  return users.value.filter(u =>
    u.name.includes(search.value) ||
    u.email.includes(search.value)
  )
})

const sortedUsers = computed(() => {
  const sorted = [...filteredUsers.value]
  sorted.sort((a, b) => {
    const aVal = a[sortBy.value]
    const bVal = b[sortBy.value]
    return sortOrder.value === 'asc'
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal)
  })
  return sorted
})

async function fetchUsers() {
  loading.value = true
  try {
    const response = await fetch('/api/users')
    users.value = await response.json()
  } catch (e) {
    error.value = e as Error
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

// ✅ GOOD: Extract to composable
<script setup lang="ts">
import { useUsers } from '@/composables/useUsers'

const {
  users: sortedUsers,
  loading,
  error,
  search,
  sortBy,
  sortOrder
} = useUsers()
</script>
```

## Accessibility

### Semantic HTML

```typescript
// ❌ BAD: Using divs for everything
<template>
  <div @click="navigate">
    <div>Title</div>
    <div>Content</div>
  </div>
</template>

// ✅ GOOD: Semantic elements
<template>
  <article>
    <header>
      <h2>Title</h2>
    </header>
    <section>
      <p>Content</p>
    </section>
    <footer>
      <button @click="navigate">Read more</button>
    </footer>
  </article>
</template>
```

### ARIA Attributes

```typescript
<template>
  <div>
    <!-- ✅ GOOD: Label for input -->
    <label for="email">Email:</label>
    <input
      id="email"
      v-model="email"
      type="email"
      :aria-invalid="!!errors.email"
      :aria-describedby="errors.email ? 'email-error' : undefined"
    />
    <span
      v-if="errors.email"
      id="email-error"
      role="alert"
    >
      {{ errors.email }}
    </span>
    
    <!-- ✅ GOOD: Button with aria-label -->
    <button
      aria-label="Close modal"
      @click="close"
    >
      ×
    </button>
    
    <!-- ✅ GOOD: Loading state -->
    <div
      v-if="loading"
      role="status"
      aria-live="polite"
    >
      Loading...
    </div>
  </div>
</template>
```

### Keyboard Navigation

```typescript
<script setup lang="ts">
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  } else if (event.key === 'Enter') {
    submit()
  }
}
</script>

<template>
  <div
    tabindex="0"
    @keydown="handleKeydown"
    role="dialog"
    aria-modal="true"
  >
    <!-- Modal content -->
  </div>
</template>
```

## Performance Patterns

### v-show vs v-if

```typescript
// ✅ Use v-if for rarely toggled elements
<div v-if="isAdmin">
  Admin panel (rarely shown)
</div>

// ✅ Use v-show for frequently toggled elements
<div v-show="isMenuOpen">
  Menu (toggled often)
</div>
```

### v-for with :key

```typescript
// ❌ BAD: No key
<div v-for="user in users">
  {{ user.name }}
</div>

// ❌ BAD: Index as key (can cause issues)
<div v-for="(user, index) in users" :key="index">
  {{ user.name }}
</div>

// ✅ GOOD: Unique, stable identifier
<div v-for="user in users" :key="user.id">
  {{ user.name }}
</div>
```

### Lazy Loading Components

```typescript
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// ✅ GOOD: Lazy load heavy components
const HeavyChart = defineAsyncComponent(() =>
  import('@/components/HeavyChart.vue')
)

const isChartVisible = ref(false)
</script>

<template>
  <button @click="isChartVisible = true">Show Chart</button>
  
  <!-- Only loads when needed -->
  <HeavyChart v-if="isChartVisible" />
</template>
```

## Testing Considerations

### Testable Components

```typescript
// ✅ GOOD: Easy to test
<script setup lang="ts">
interface Props {
  userId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'user-loaded', user: User): void
}>()

// Dependency injection makes testing easy
const apiClient = inject<ApiClient>('apiClient')

const user = ref<User | null>(null)

async function loadUser() {
  user.value = await apiClient.fetchUser(props.userId)
  emit('user-loaded', user.value)
}

onMounted(() => {
  loadUser()
})

// Expose for testing
defineExpose({
  loadUser
})
</script>
```

### Data Test Attributes

```typescript
<template>
  <div data-testid="user-card">
    <h2 data-testid="user-name">{{ user.name }}</h2>
    <button
      data-testid="delete-button"
      @click="handleDelete"
    >
      Delete
    </button>
  </div>
</template>
```

---

**Version:** 1.0  
**Last Updated:** 2025-01-09
