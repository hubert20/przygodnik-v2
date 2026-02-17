# Composition API Patterns

Deep dive into Vue 3 Composition API patterns, lifecycle, and advanced techniques.

## Lifecycle Hooks

### Setup Execution Order

```typescript
<script setup lang="ts">
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted
} from 'vue'

// 1. Script setup executes immediately (during component creation)
console.log('1. Setup executing')

// 2. Before component is mounted to DOM
onBeforeMount(() => {
  console.log('2. Before mount')
})

// 3. Component mounted to DOM (can access DOM)
onMounted(() => {
  console.log('3. Mounted - DOM available')
  // Good place for:
  // - API calls
  // - Setting up third-party libraries
  // - Accessing DOM elements via refs
})

// 4. Before component re-renders (reactive data changed)
onBeforeUpdate(() => {
  console.log('4. Before update')
})

// 5. After component re-rendered
onUpdated(() => {
  console.log('5. Updated')
  // Use sparingly - can cause infinite loops
})

// 6. Before component is unmounted
onBeforeUnmount(() => {
  console.log('6. Before unmount')
  // Good place for:
  // - Canceling timers
  // - Removing event listeners
  // - Cleaning up subscriptions
})

// 7. Component unmounted and removed from DOM
onUnmounted(() => {
  console.log('7. Unmounted')
})
</script>
```

### Cleanup Pattern

```typescript
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  const intervalId = setInterval(() => {
    console.log('Tick')
  }, 1000)
  
  // ✅ GOOD: Clean up in onUnmounted
  onUnmounted(() => {
    clearInterval(intervalId)
  })
})

// ✅ ALSO GOOD: Register cleanup inside onMounted
onMounted(() => {
  window.addEventListener('resize', handleResize)
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})
</script>
```

## Advanced Reactivity

### shallowRef vs ref

```typescript
import { ref, shallowRef, triggerRef } from 'vue'

// ref: Deep reactivity
const deepState = ref({
  user: {
    name: 'John',
    address: {
      city: 'NYC'
    }
  }
})

// This triggers re-render (deep)
deepState.value.user.address.city = 'LA'

// shallowRef: Only triggers on .value replacement
const shallowState = shallowRef({
  user: {
    name: 'John',
    address: {
      city: 'NYC'
    }
  }
})

// ❌ This does NOT trigger re-render
shallowState.value.user.address.city = 'LA'

// ✅ This DOES trigger re-render
shallowState.value = {
  user: {
    name: 'John',
    address: {
      city: 'LA'
    }
  }
}

// Force trigger if you mutated shallowRef
triggerRef(shallowState)
```

### toRef and toRefs

```typescript
import { reactive, toRef, toRefs } from 'vue'

const state = reactive({
  count: 0,
  name: 'John'
})

// ❌ BAD: Destructuring loses reactivity
const { count, name } = state

// ✅ GOOD: toRefs maintains reactivity
const { count, name } = toRefs(state)

// ✅ GOOD: toRef for single property
const countRef = toRef(state, 'count')
```

### readonly

```typescript
import { ref, readonly } from 'vue'

const count = ref(0)

// Expose as readonly to prevent external mutations
const readonlyCount = readonly(count)

// ❌ This will throw error in dev mode
readonlyCount.value++ // Error!

// ✅ But original can still be mutated internally
count.value++ // OK
```

## Watch Patterns

### Immediate Watch

```typescript
import { ref, watch } from 'vue'

const userId = ref(1)

// ✅ GOOD: Run immediately on mount
watch(userId, async (id) => {
  const user = await fetchUser(id)
  console.log(user)
}, { immediate: true })
```

### Deep Watch

```typescript
import { ref, watch } from 'vue'

const user = ref({
  name: 'John',
  address: {
    city: 'NYC'
  }
})

// ✅ GOOD: Watch deep changes
watch(user, (newUser) => {
  console.log('User changed:', newUser)
}, { deep: true })

// ✅ BETTER: Watch specific nested property (more performant)
watch(() => user.value.address.city, (city) => {
  console.log('City changed:', city)
})
```

### Stop Watching

```typescript
import { ref, watch } from 'vue'

const count = ref(0)

// watch() returns a stop function
const stopWatch = watch(count, (value) => {
  console.log('Count:', value)
  
  if (value > 10) {
    stopWatch() // Stop watching
  }
})
```

### Flush Timing

```typescript
import { ref, watch } from 'vue'

const count = ref(0)

// Default: 'pre' - runs before DOM update
watch(count, () => {
  console.log('Before DOM update')
})

// 'post' - runs after DOM update
watch(count, () => {
  console.log('After DOM update - can access updated DOM')
}, { flush: 'post' })

// 'sync' - runs synchronously (use sparingly, can be slow)
watch(count, () => {
  console.log('Immediately')
}, { flush: 'sync' })
```

## Provide / Inject Pattern

### Providing Data to Descendants

```typescript
// Parent.vue
<script setup lang="ts">
import { provide, ref } from 'vue'
import type { InjectionKey, Ref } from 'vue'

// ✅ GOOD: Use InjectionKey for type safety
export const countKey = Symbol() as InjectionKey<Ref<number>>

const count = ref(0)

provide(countKey, count)
</script>

// Child.vue (anywhere in tree)
<script setup lang="ts">
import { inject } from 'vue'
import { countKey } from './Parent.vue'

const count = inject(countKey)

// ✅ count is type-safe and reactive
</script>
```

### Provide with Default Value

```typescript
<script setup lang="ts">
import { inject } from 'vue'

// ✅ GOOD: Provide default value
const config = inject('config', {
  apiUrl: 'https://api.example.com',
  timeout: 5000
})

// ✅ GOOD: Provide factory function for complex defaults
const settings = inject('settings', () => ({
  theme: 'dark',
  language: 'en'
}))
</script>
```

## Template Refs

### Accessing DOM Elements

```typescript
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  // ✅ Access DOM element
  inputRef.value?.focus()
})
</script>

<template>
  <input ref="inputRef" type="text" />
</template>
```

### Component Refs

```typescript
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ChildComponent from './ChildComponent.vue'

const childRef = ref<InstanceType<typeof ChildComponent> | null>(null)

onMounted(() => {
  // ✅ Call exposed methods
  childRef.value?.someMethod()
})
</script>

<template>
  <ChildComponent ref="childRef" />
</template>

// ChildComponent.vue
<script setup lang="ts">
defineExpose({
  someMethod() {
    console.log('Called from parent')
  }
})
</script>
```

### Refs in v-for

```typescript
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const itemRefs = ref<HTMLElement[]>([])

onMounted(() => {
  // itemRefs.value contains all list item elements
  console.log(itemRefs.value)
})
</script>

<template>
  <ul>
    <li
      v-for="item in items"
      :key="item.id"
      :ref="el => { if (el) itemRefs.push(el as HTMLElement) }"
    >
      {{ item.name }}
    </li>
  </ul>
</template>
```

## Async Components

### defineAsyncComponent

```typescript
import { defineAsyncComponent } from 'vue'

// ✅ Simple lazy loading
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)

// ✅ With options (loading, error states)
const AsyncComponent = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200, // ms before showing loading component
  timeout: 3000 // fail after 3 seconds
})
```

## Slots and Dynamic Components

### Slots with TypeScript

```typescript
<script setup lang="ts">
interface Props {
  items: Array<{ id: number; name: string }>
}

defineProps<Props>()
</script>

<template>
  <div>
    <div v-for="item in items" :key="item.id">
      <!-- Scoped slot with type-safe bindings -->
      <slot :item="item" :index="item.id">
        <!-- Default content -->
        {{ item.name }}
      </slot>
    </div>
  </div>
</template>

<!-- Usage in parent -->
<template>
  <MyComponent :items="items">
    <template #default="{ item, index }">
      <!-- item and index are type-safe -->
      <strong>{{ index }}: {{ item.name }}</strong>
    </template>
  </MyComponent>
</template>
```

### Dynamic Components

```typescript
<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import ComponentA from './ComponentA.vue'
import ComponentB from './ComponentB.vue'

// ✅ GOOD: Use shallowRef for component references (performance)
const currentComponent = shallowRef(ComponentA)

function switchComponent() {
  currentComponent.value = currentComponent.value === ComponentA 
    ? ComponentB 
    : ComponentA
}
</script>

<template>
  <component :is="currentComponent" />
  <button @click="switchComponent">Switch</button>
</template>
```

## Error Handling

### onErrorCaptured Hook

```typescript
<script setup lang="ts">
import { onErrorCaptured } from 'vue'

// ✅ Catch errors from child components
onErrorCaptured((err, instance, info) => {
  console.error('Error captured:', err)
  console.log('Component:', instance)
  console.log('Error info:', info)
  
  // Return false to prevent error from propagating
  return false
})
</script>
```

## Performance Tips

### Avoid Unnecessary Reactivity

```typescript
import { ref, shallowRef, markRaw } from 'vue'

// ❌ BAD: Making large non-reactive data reactive
const bigData = ref({
  // 10,000 items that never change
})

// ✅ GOOD: Use shallowRef for large data
const bigDataShallow = shallowRef({
  // 10,000 items
})

// ✅ GOOD: Use markRaw for objects that should never be reactive
import ThirdPartyLib from 'third-party-lib'

const lib = markRaw(new ThirdPartyLib())
```

### Computed Caching

```typescript
import { ref, computed } from 'vue'

const items = ref([1, 2, 3, 4, 5])

// ✅ GOOD: Computed caches result
const expensiveComputation = computed(() => {
  console.log('Computing...') // Only runs when items change
  return items.value.reduce((sum, item) => sum + item, 0)
})

// ❌ BAD: Method runs on every template access
function expensiveMethod() {
  console.log('Computing...') // Runs every render!
  return items.value.reduce((sum, item) => sum + item, 0)
}
</script>

<template>
  <!-- Computed: cached, runs once per items change -->
  <div>{{ expensiveComputation }}</div>
  
  <!-- Method: runs every render -->
  <div>{{ expensiveMethod() }}</div>
</template>
```

---

**Version:** 1.0  
**Last Updated:** 2025-01-09
