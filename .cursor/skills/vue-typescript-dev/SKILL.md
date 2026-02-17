---
name: vue-typescript-dev
description: Vue 3 Composition API TypeScript development patterns testing Pinia router forms validation accessibility performance optimization
---

# Vue 3 + TypeScript Development

Expert guide for building modern Vue 3 applications with TypeScript, emphasizing Composition API, type safety, and best practices.

## Purpose

This skill provides comprehensive patterns and best practices for Vue 3 development with TypeScript, focusing on:
- Composition API (ref, reactive, computed, watch)
- Type-safe component development
- State management with Pinia
- Routing with Vue Router
- Form handling and validation
- Testing strategies
- Performance optimization
- Accessibility

## Local Development

> **Frontend działa w kontenerze Docker** (`node:20-alpine`).
> NIE instaluj Node.js na hoście. Komendy npm uruchamiaj przez:
> ```bash
> docker compose exec node npm install
> docker compose exec node npm run dev
> docker compose exec node npm test
> ```
> Szczegóły: `.cursor/skills/docker-dev/SKILL.md`

## Core Principles

### KISS (Keep It Simple)
- One component = one responsibility
- Prefer simple solutions over clever ones
- Extract complexity into composables

### Type Safety First
- Enable TypeScript strict mode
- Use type inference when possible
- Avoid `any` type (use `unknown` instead)
- Define interfaces for all props and emits

### Composition over Options
- **Always use Composition API** (not Options API)
- Use `<script setup>` syntax
- Extract reusable logic into composables

## Component Structure

### Script Setup Pattern

```typescript
<script setup lang="ts">
import { ref, computed } from 'vue'

// Props with TypeScript
interface Props {
  userId: number
  initialName?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialName: 'Guest'
})

// Emits with TypeScript
interface Emits {
  (e: 'update', value: string): void
  (e: 'delete', id: number): void
}

const emit = defineEmits<Emits>()

// State
const name = ref(props.initialName)
const counter = ref(0)

// Computed
const displayName = computed(() => `User: ${name.value}`)

// Methods
function handleUpdate() {
  emit('update', name.value)
}
</script>

<template>
  <div class="user-card">
    <h2>{{ displayName }}</h2>
    <button @click="handleUpdate">Update</button>
  </div>
</template>

<style scoped>
.user-card {
  padding: 1rem;
  border: 1px solid #ccc;
}
</style>
```

### Component Organization

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   │   ├── Button.vue
│   │   └── Input.vue
│   ├── features/        # Feature-specific components
│   │   ├── auth/
│   │   └── admin/
│   └── layouts/         # Layout components
├── composables/         # Reusable composition functions
│   ├── useAuth.ts
│   └── useApi.ts
├── stores/              # Pinia stores
│   ├── auth.ts
│   └── users.ts
├── types/               # TypeScript type definitions
│   ├── api.ts
│   └── models.ts
├── views/               # Page components (routes)
├── router/
│   └── index.ts
└── App.vue
```

## Reactivity Patterns

### ref vs reactive

```typescript
import { ref, reactive } from 'vue'

// ✅ GOOD: Use ref for primitives
const count = ref(0)
const name = ref('')
const isActive = ref(false)

// ✅ GOOD: Use reactive for objects (if you need reactivity for whole object)
const form = reactive({
  email: '',
  password: '',
  remember: false
})

// ❌ BAD: Don't destructure reactive (loses reactivity)
const { email, password } = reactive({ email: '', password: '' })

// ✅ GOOD: Use toRefs if you need to destructure
import { toRefs } from 'vue'
const state = reactive({ email: '', password: '' })
const { email, password } = toRefs(state)
```

### Computed Properties

```typescript
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// ✅ GOOD: Computed for derived state
const fullName = computed(() => `${firstName.value} ${lastName.value}`)

// ✅ GOOD: Writable computed
const fullNameWritable = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (value) => {
    const parts = value.split(' ')
    firstName.value = parts[0]
    lastName.value = parts[1] || ''
  }
})

// ❌ BAD: Don't use computed for side effects
const badComputed = computed(() => {
  console.log('This runs on every access!') // Side effect!
  return firstName.value
})
```

### Watchers

```typescript
import { ref, watch, watchEffect } from 'vue'

const count = ref(0)
const name = ref('')

// ✅ GOOD: Watch specific source
watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`)
})

// ✅ GOOD: Watch multiple sources
watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
  console.log('Either count or name changed')
})

// ✅ GOOD: Watch with immediate option
watch(count, (value) => {
  console.log('Runs immediately and on change')
}, { immediate: true })

// ✅ GOOD: Deep watch for objects
const user = ref({ name: 'John', age: 30 })
watch(user, (newUser) => {
  console.log('User changed deeply')
}, { deep: true })

// ✅ GOOD: watchEffect for automatic dependency tracking
watchEffect(() => {
  console.log(`Count is ${count.value}, Name is ${name.value}`)
})
```

## TypeScript Patterns

### Type Definitions

```typescript
// types/models.ts

// ✅ GOOD: Use interfaces for object shapes
export interface User {
  id: number
  email: string
  name: string
  role: UserRole
  createdAt: Date
}

// ✅ GOOD: Use type for unions and primitives
export type UserRole = 'admin' | 'user' | 'guest'

// ✅ GOOD: Use type for complex types
export type ApiResponse<T> = {
  data: T
  status: number
  message: string
}

// ✅ GOOD: Utility types
export type UserInput = Omit<User, 'id' | 'createdAt'>
export type PartialUser = Partial<User>
export type ReadonlyUser = Readonly<User>
```

### Generic Components

```typescript
<script setup lang="ts" generic="T extends { id: number }">
interface Props {
  items: T[]
  selectedId?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', item: T): void
}>()

function handleSelect(item: T) {
  emit('select', item)
}
</script>

<template>
  <ul>
    <li 
      v-for="item in items" 
      :key="item.id"
      @click="handleSelect(item)"
    >
      <slot :item="item" />
    </li>
  </ul>
</template>
```

## Composables (Reusable Logic)

### Composable Pattern

```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const doubled = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  function decrement() {
    count.value--
  }
  
  function reset() {
    count.value = initialValue
  }
  
  // Return everything that should be public
  return {
    count: readonly(count), // Expose as readonly if needed
    doubled,
    increment,
    decrement,
    reset
  }
}

// Usage in component:
<script setup lang="ts">
import { useCounter } from '@/composables/useCounter'

const { count, doubled, increment, decrement } = useCounter(10)
</script>
```

### Async Composable with Loading State

```typescript
// composables/useApi.ts
import { ref } from 'vue'
import type { Ref } from 'vue'

interface UseApiReturn<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
  loading: Ref<boolean>
  execute: () => Promise<void>
}

export function useApi<T>(
  fetcher: () => Promise<T>
): UseApiReturn<T> {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)
  
  async function execute() {
    loading.value = true
    error.value = null
    
    try {
      data.value = await fetcher()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }
  
  return {
    data,
    error,
    loading,
    execute
  }
}

// Usage:
<script setup lang="ts">
import { onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import type { User } from '@/types'

const { data: users, loading, error, execute } = useApi<User[]>(
  () => fetch('/api/users').then(r => r.json())
)

onMounted(() => {
  execute()
})
</script>
```

## Pinia State Management

### Store Definition

```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  
  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  
  // Actions
  async function login(email: string, password: string) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    if (!response.ok) {
      throw new Error('Login failed')
    }
    
    const data = await response.json()
    user.value = data.user
    token.value = data.token
  }
  
  function logout() {
    user.value = null
    token.value = null
  }
  
  return {
    // State
    user,
    token,
    // Getters
    isAuthenticated,
    isAdmin,
    // Actions
    login,
    logout
  }
})

// Usage in component:
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

async function handleLogin() {
  await authStore.login('user@example.com', 'password')
}
</script>
```

## Vue Router

### Route Definition

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach((to, from) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }
  
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'home' }
  }
})

export default router
```

## Form Handling

### Basic Form with Validation

```typescript
<script setup lang="ts">
import { ref, computed } from 'vue'

interface FormData {
  email: string
  password: string
}

const form = ref<FormData>({
  email: '',
  password: ''
})

const errors = ref<Partial<Record<keyof FormData, string>>>({})

// Validation rules
function validateEmail(email: string): string | null {
  if (!email) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Invalid email format'
  }
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  return null
}

// Computed valid state
const isValid = computed(() => {
  return Object.keys(errors.value).length === 0
    && form.value.email !== ''
    && form.value.password !== ''
})

function validateField(field: keyof FormData) {
  if (field === 'email') {
    const error = validateEmail(form.value.email)
    if (error) {
      errors.value.email = error
    } else {
      delete errors.value.email
    }
  } else if (field === 'password') {
    const error = validatePassword(form.value.password)
    if (error) {
      errors.value.password = error
    } else {
      delete errors.value.password
    }
  }
}

async function handleSubmit() {
  // Validate all fields
  validateField('email')
  validateField('password')
  
  if (!isValid.value) return
  
  // Submit form
  try {
    await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
  } catch (error) {
    console.error('Submission failed:', error)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label for="email">Email:</label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        @blur="validateField('email')"
        :aria-invalid="!!errors.email"
        :aria-describedby="errors.email ? 'email-error' : undefined"
      />
      <span v-if="errors.email" id="email-error" role="alert">
        {{ errors.email }}
      </span>
    </div>
    
    <div>
      <label for="password">Password:</label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        @blur="validateField('password')"
        :aria-invalid="!!errors.password"
        :aria-describedby="errors.password ? 'password-error' : undefined"
      />
      <span v-if="errors.password" id="password-error" role="alert">
        {{ errors.password }}
      </span>
    </div>
    
    <button type="submit" :disabled="!isValid">
      Login
    </button>
  </form>
</template>
```

## Best Practices

### ✅ DO

- **Use Composition API** with `<script setup>`
- **Enable TypeScript strict mode**
- **Define types for props and emits**
- **Extract reusable logic into composables**
- **Use computed for derived state**
- **Use key attribute in v-for with stable, unique values**
- **Lazy load routes and heavy components**
- **Add ARIA attributes for accessibility**
- **Use semantic HTML** (button, nav, header, etc.)

### ❌ DON'T

- **Don't use Options API** (use Composition API)
- **Don't use `any` type** (use `unknown` or proper types)
- **Don't mutate props** (emit events instead)
- **Don't put business logic in components** (use composables or stores)
- **Don't use index as key in v-for** (use unique id)
- **Don't use v-html with unsanitized content** (XSS risk)
- **Don't manipulate DOM directly** (use refs and Vue reactivity)

## Performance Optimization

### Lazy Loading

```typescript
// Lazy load routes
{
  path: '/admin',
  component: () => import('@/views/AdminView.vue')
}

// Lazy load heavy components
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent(() =>
  import('@/components/HeavyChart.vue')
)
</script>
```

### Computed vs Watch

```typescript
// ✅ GOOD: Use computed for synchronous derived state
const doubled = computed(() => count.value * 2)

// ✅ GOOD: Use watch for side effects (async, logging, etc.)
watch(count, async (newValue) => {
  await saveToDatabase(newValue)
})
```

## Additional Resources

See `references/` directory for:
- `COMPOSITION_API_PATTERNS.md` - Deep dive into Composition API
- `TYPESCRIPT_PATTERNS.md` - Advanced TypeScript patterns
- `COMPONENT_BEST_PRACTICES.md` - Component architecture
- `TESTING_PATTERNS.md` - Testing strategies with Vitest

## Quick Reference

| Pattern | Use Case |
|---------|----------|
| `ref()` | Primitives, single values |
| `reactive()` | Objects (if needed) |
| `computed()` | Derived state (synchronous) |
| `watch()` | Side effects (async, logs) |
| `defineProps<T>()` | Type-safe props |
| `defineEmits<T>()` | Type-safe events |
| Composables | Reusable logic |
| Pinia stores | Global state |

---

**Version:** 1.0  
**Last Updated:** 2025-01-09
