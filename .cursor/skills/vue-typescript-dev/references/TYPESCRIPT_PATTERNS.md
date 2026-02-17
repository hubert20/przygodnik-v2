# TypeScript Patterns for Vue 3

Advanced TypeScript patterns, utility types, and best practices for Vue 3 development.

## Strict Mode Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

## Component Props Typing

### Basic Props

```typescript
<script setup lang="ts">
// ✅ GOOD: Interface for props
interface Props {
  title: string
  count: number
  isActive?: boolean // Optional
  tags?: string[] // Optional array
}

const props = defineProps<Props>()

// ✅ GOOD: With defaults
const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  tags: () => [] // Use function for array/object defaults
})
</script>
```

### Complex Props

```typescript
<script setup lang="ts">
import type { PropType } from 'vue'

interface User {
  id: number
  name: string
  email: string
}

type Status = 'pending' | 'approved' | 'rejected'

interface Props {
  user: User
  status: Status
  callback: (id: number) => void
  config: {
    theme: 'light' | 'dark'
    language: string
  }
}

const props = defineProps<Props>()
</script>
```

### Generic Props

```typescript
<script setup lang="ts" generic="T extends { id: number }">
interface Props {
  items: T[]
  selected?: T
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', item: T): void
  (e: 'remove', id: number): void
}>()
</script>
```

## Emits Typing

### Typed Events

```typescript
<script setup lang="ts">
// ✅ GOOD: Type-safe emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit', data: FormData): void
  (e: 'error', error: Error): void
}>()

// ✅ Usage with type checking
emit('update:modelValue', 'new value') // ✓
emit('submit', formData) // ✓
emit('nonexistent', 'value') // ✗ Type error!
emit('update:modelValue', 123) // ✗ Type error! (expects string)
</script>
```

### Event Payload Interfaces

```typescript
<script setup lang="ts">
interface SubmitPayload {
  email: string
  password: string
  remember: boolean
}

interface ErrorPayload {
  code: string
  message: string
  field?: string
}

const emit = defineEmits<{
  (e: 'submit', payload: SubmitPayload): void
  (e: 'error', payload: ErrorPayload): void
  (e: 'cancel'): void // No payload
}>()

function handleSubmit() {
  emit('submit', {
    email: 'user@example.com',
    password: '********',
    remember: true
  })
}
</script>
```

## Refs and Reactive Typing

### Typed Refs

```typescript
import { ref } from 'vue'
import type { Ref } from 'vue'

// ✅ Type inference (preferred)
const count = ref(0) // Ref<number>
const name = ref('') // Ref<string>

// ✅ Explicit typing (when needed)
const user = ref<User | null>(null)
const items = ref<string[]>([])

// ✅ Complex types
interface FormData {
  email: string
  password: string
}

const form = ref<FormData>({
  email: '',
  password: ''
})
```

### Typed Computed

```typescript
import { ref, computed } from 'vue'
import type { ComputedRef } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// ✅ Type inference
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
// fullName is ComputedRef<string>

// ✅ Explicit return type
const fullNameExplicit = computed<string>(() => {
  return `${firstName.value} ${lastName.value}`
})

// ✅ Complex computed with conditional return
interface Result {
  status: 'success' | 'error'
  data?: any
  error?: string
}

const result = computed<Result>(() => {
  if (someCondition.value) {
    return { status: 'success', data: 'result' }
  } else {
    return { status: 'error', error: 'Failed' }
  }
})
```

## Utility Types

### Built-in Utility Types

```typescript
interface User {
  id: number
  name: string
  email: string
  password: string
  role: 'admin' | 'user'
  createdAt: Date
  updatedAt: Date
}

// ✅ Partial - All properties optional
type PartialUser = Partial<User>
// { id?: number; name?: string; ... }

// ✅ Required - All properties required
type RequiredUser = Required<Partial<User>>

// ✅ Pick - Select specific properties
type UserPreview = Pick<User, 'id' | 'name' | 'email'>
// { id: number; name: string; email: string }

// ✅ Omit - Exclude specific properties
type UserWithoutPassword = Omit<User, 'password'>
// { id: number; name: string; email: string; role: ...; ... }

// ✅ Readonly - Make all properties readonly
type ReadonlyUser = Readonly<User>

// ✅ Record - Create object type with specific keys
type UserRoles = Record<'admin' | 'user' | 'guest', string[]>
// { admin: string[]; user: string[]; guest: string[] }
```

### Custom Utility Types

```typescript
// ✅ Make specific properties optional
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

type UserInput = Optional<User, 'id' | 'createdAt' | 'updatedAt'>
// id, createdAt, updatedAt are optional, rest required

// ✅ Make specific properties required
type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

interface FormData {
  email?: string
  password?: string
  name?: string
}

type ValidForm = RequireFields<FormData, 'email' | 'password'>
// email and password are required, name is optional

// ✅ Deep Partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// ✅ Non-nullable
type NonNullableUser = {
  [K in keyof User]: NonNullable<User[K]>
}
```

## API Response Types

### Generic API Response

```typescript
interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

// Usage
type UserResponse = ApiResponse<User>
type UsersResponse = PaginatedResponse<User>

async function fetchUsers(): Promise<UsersResponse> {
  const response = await fetch('/api/users')
  return response.json()
}
```

### Error Handling Types

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

async function fetchUser(id: number): Promise<Result<User>> {
  try {
    const response = await fetch(`/api/users/${id}`)
    const user = await response.json()
    return { ok: true, value: user }
  } catch (error) {
    return { ok: false, error: error as Error }
  }
}

// Usage
const result = await fetchUser(1)
if (result.ok) {
  console.log(result.value) // Type: User
} else {
  console.error(result.error) // Type: Error
}
```

## Type Guards

### Custom Type Guards

```typescript
interface Dog {
  type: 'dog'
  bark: () => void
}

interface Cat {
  type: 'cat'
  meow: () => void
}

type Animal = Dog | Cat

// ✅ Type guard function
function isDog(animal: Animal): animal is Dog {
  return animal.type === 'dog'
}

function makeSound(animal: Animal) {
  if (isDog(animal)) {
    animal.bark() // TypeScript knows it's Dog
  } else {
    animal.meow() // TypeScript knows it's Cat
  }
}
```

### Discriminated Unions

```typescript
interface LoadingState {
  status: 'loading'
}

interface SuccessState<T> {
  status: 'success'
  data: T
}

interface ErrorState {
  status: 'error'
  error: string
}

type AsyncState<T> = LoadingState | SuccessState<T> | ErrorState

function renderState<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'loading':
      return 'Loading...'
    case 'success':
      return state.data // Type: T
    case 'error':
      return state.error // Type: string
  }
}
```

## Composables Typing

### Typed Composable

```typescript
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'

interface UseCounterReturn {
  count: Ref<number>
  doubled: ComputedRef<number>
  increment: () => void
  decrement: () => void
}

export function useCounter(initial = 0): UseCounterReturn {
  const count = ref(initial)
  
  const doubled = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  function decrement() {
    count.value--
  }
  
  return {
    count,
    doubled,
    increment,
    decrement
  }
}
```

### Generic Composable

```typescript
import { ref } from 'vue'
import type { Ref } from 'vue'

interface UseFetchReturn<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
  loading: Ref<boolean>
  refetch: () => Promise<void>
}

export function useFetch<T>(url: string): UseFetchReturn<T> {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)
  
  async function fetchData() {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(url)
      data.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }
  
  // Fetch on creation
  fetchData()
  
  return {
    data,
    error,
    loading,
    refetch: fetchData
  }
}

// Usage with type inference
const { data, loading, error } = useFetch<User[]>('/api/users')
// data is Ref<User[] | null>
```

## Template Refs Typing

### DOM Element Refs

```typescript
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ✅ Specific HTML element type
const inputRef = ref<HTMLInputElement | null>(null)
const divRef = ref<HTMLDivElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)

onMounted(() => {
  inputRef.value?.focus() // Type-safe
  
  // Access input-specific properties
  console.log(inputRef.value?.value)
  console.log(inputRef.value?.selectionStart)
})
</script>

<template>
  <input ref="inputRef" type="text" />
  <div ref="divRef">Content</div>
  <button ref="buttonRef">Click</button>
</template>
```

### Component Instance Refs

```typescript
// ChildComponent.vue
<script setup lang="ts">
const count = ref(0)

function increment() {
  count.value++
}

// Expose methods and state
defineExpose({
  count,
  increment
})
</script>

// ParentComponent.vue
<script setup lang="ts">
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

// ✅ Type-safe component ref
const childRef = ref<InstanceType<typeof ChildComponent> | null>(null)

function callChild() {
  childRef.value?.increment() // Type-safe
  console.log(childRef.value?.count) // Type-safe
}
</script>

<template>
  <ChildComponent ref="childRef" />
</template>
```

## Avoiding Common Pitfalls

### Don't Use `any`

```typescript
// ❌ BAD
const data = ref<any>(null)
function process(input: any) { }

// ✅ GOOD: Use unknown and type guards
const data = ref<unknown>(null)

function process(input: unknown) {
  if (typeof input === 'string') {
    console.log(input.toUpperCase()) // Type: string
  } else if (typeof input === 'number') {
    console.log(input.toFixed(2)) // Type: number
  }
}

// ✅ GOOD: Use generics
function process<T>(input: T): T {
  return input
}
```

### Avoid Type Assertions

```typescript
// ❌ BAD: Type assertion without validation
const data = fetchData() as User

// ✅ GOOD: Validate before using
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data
  )
}

const data = fetchData()
if (isUser(data)) {
  console.log(data.name) // Type-safe
}
```

### Handle Null/Undefined Properly

```typescript
// ❌ BAD: Assuming value exists
const user = users.find(u => u.id === 1)
console.log(user.name) // Possible undefined error!

// ✅ GOOD: Optional chaining
console.log(user?.name)

// ✅ GOOD: Nullish coalescing
const name = user?.name ?? 'Unknown'

// ✅ GOOD: Type guard
if (user) {
  console.log(user.name) // Type: User (not undefined)
}
```

## Advanced Patterns

### Branded Types

```typescript
// Create nominal types (compile-time only)
type UserId = number & { __brand: 'UserId' }
type ProductId = number & { __brand: 'ProductId' }

function createUserId(id: number): UserId {
  return id as UserId
}

function createProductId(id: number): ProductId {
  return id as ProductId
}

function fetchUser(id: UserId) {
  // ...
}

const userId = createUserId(1)
const productId = createProductId(1)

fetchUser(userId) // ✓
fetchUser(productId) // ✗ Type error!
```

### Const Assertions

```typescript
// ✅ GOOD: Use const assertions for literal types
const STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const

type Status = typeof STATUS[keyof typeof STATUS]
// Type: 'pending' | 'approved' | 'rejected'

// ✅ Readonly array
const colors = ['red', 'green', 'blue'] as const
type Color = typeof colors[number]
// Type: 'red' | 'green' | 'blue'
```

---

**Version:** 1.0  
**Last Updated:** 2025-01-09
