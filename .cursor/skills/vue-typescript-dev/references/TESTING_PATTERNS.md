# Testing Patterns for Vue 3

Testing strategies, patterns, and best practices using Vitest and Vue Testing Library.

## Test Setup

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

### Test Setup File

```typescript
// src/test/setup.ts
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/vue'
import matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})
```

## Component Testing

### Basic Component Test

```typescript
// Button.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Button from './Button.vue'

describe('Button', () => {
  it('renders button with text', () => {
    render(Button, {
      props: {
        label: 'Click me'
      }
    })
    
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
  
  it('emits click event when clicked', async () => {
    const user = userEvent.setup()
    const { emitted } = render(Button, {
      props: {
        label: 'Click me'
      }
    })
    
    await user.click(screen.getByRole('button'))
    
    expect(emitted()).toHaveProperty('click')
    expect(emitted().click).toHaveLength(1)
  })
  
  it('is disabled when disabled prop is true', () => {
    render(Button, {
      props: {
        label: 'Click me',
        disabled: true
      }
    })
    
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### Testing with Props

```typescript
// UserCard.spec.ts
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import UserCard from './UserCard.vue'

describe('UserCard', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  }
  
  it('displays user information', () => {
    render(UserCard, {
      props: {
        user: mockUser
      }
    })
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
  
  it('renders placeholder when user is null', () => {
    render(UserCard, {
      props: {
        user: null
      }
    })
    
    expect(screen.getByText('No user selected')).toBeInTheDocument()
  })
})
```

### Testing Events

```typescript
// SearchInput.spec.ts
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import SearchInput from './SearchInput.vue'

describe('SearchInput', () => {
  it('emits search event with input value', async () => {
    const user = userEvent.setup()
    const { emitted } = render(SearchInput)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'test query')
    
    expect(emitted()).toHaveProperty('update:modelValue')
    const events = emitted()['update:modelValue']
    expect(events[events.length - 1]).toEqual(['test query'])
  })
  
  it('emits submit event on Enter key', async () => {
    const user = userEvent.setup()
    const { emitted } = render(SearchInput)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'search{Enter}')
    
    expect(emitted()).toHaveProperty('submit')
  })
})
```

### Testing v-model

```typescript
// CustomInput.spec.ts
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { ref } from 'vue'
import CustomInput from './CustomInput.vue'

describe('CustomInput with v-model', () => {
  it('updates parent value via v-model', async () => {
    const user = userEvent.setup()
    const value = ref('')
    
    render({
      components: { CustomInput },
      template: '<CustomInput v-model="value" />',
      setup() {
        return { value }
      }
    })
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'test')
    
    expect(value.value).toBe('test')
  })
})
```

## Testing with Pinia

### Store Setup

```typescript
// test/utils.ts
import { createPinia, setActivePinia } from 'pinia'

export function setupPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}
```

### Testing Store

```typescript
// stores/counter.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from './counter'

describe('Counter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('initializes with count 0', () => {
    const store = useCounterStore()
    expect(store.count).toBe(0)
  })
  
  it('increments count', () => {
    const store = useCounterStore()
    store.increment()
    expect(store.count).toBe(1)
  })
  
  it('computes doubled value', () => {
    const store = useCounterStore()
    store.count = 5
    expect(store.doubled).toBe(10)
  })
})
```

### Testing Component with Store

```typescript
// UserList.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import UserList from './UserList.vue'
import { useUserStore } from '@/stores/user'

describe('UserList with Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('displays users from store', () => {
    const store = useUserStore()
    store.users = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]
    
    render(UserList)
    
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Jane')).toBeInTheDocument()
  })
})
```

## Testing Composables

### Basic Composable Test

```typescript
// composables/useCounter.spec.ts
import { describe, it, expect } from 'vitest'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('initializes with provided value', () => {
    const { count } = useCounter(5)
    expect(count.value).toBe(5)
  })
  
  it('increments count', () => {
    const { count, increment } = useCounter(0)
    increment()
    expect(count.value).toBe(1)
  })
  
  it('computes doubled value', () => {
    const { count, doubled } = useCounter(3)
    expect(doubled.value).toBe(6)
  })
  
  it('resets to initial value', () => {
    const { count, increment, reset } = useCounter(5)
    increment()
    increment()
    reset()
    expect(count.value).toBe(5)
  })
})
```

### Testing Async Composable

```typescript
// composables/useFetch.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { useFetch } from './useFetch'

describe('useFetch', () => {
  it('fetches data successfully', async () => {
    const mockData = { id: 1, name: 'Test' }
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockData)
      } as Response)
    )
    
    const { data, loading, error, execute } = useFetch('/api/test')
    
    expect(loading.value).toBe(false)
    expect(data.value).toBe(null)
    
    await execute()
    
    expect(loading.value).toBe(false)
    expect(data.value).toEqual(mockData)
    expect(error.value).toBe(null)
  })
  
  it('handles fetch error', async () => {
    const mockError = new Error('Network error')
    global.fetch = vi.fn(() => Promise.reject(mockError))
    
    const { data, loading, error, execute } = useFetch('/api/test')
    
    await execute()
    
    expect(loading.value).toBe(false)
    expect(data.value).toBe(null)
    expect(error.value).toEqual(mockError)
  })
})
```

## Mocking

### Mocking Modules

```typescript
// api.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { fetchUser } from './api'

// Mock entire module
vi.mock('@/services/http', () => ({
  httpClient: {
    get: vi.fn()
  }
}))

import { httpClient } from '@/services/http'

describe('API', () => {
  it('fetches user data', async () => {
    const mockUser = { id: 1, name: 'John' }
    vi.mocked(httpClient.get).mockResolvedValue(mockUser)
    
    const user = await fetchUser(1)
    
    expect(httpClient.get).toHaveBeenCalledWith('/users/1')
    expect(user).toEqual(mockUser)
  })
})
```

### Mocking Fetch

```typescript
// UserList.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/vue'
import UserList from './UserList.vue'

describe('UserList with API', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })
  
  it('displays fetched users', async () => {
    const mockUsers = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]
    
    vi.mocked(global.fetch).mockResolvedValue({
      json: () => Promise.resolve(mockUsers)
    } as Response)
    
    render(UserList)
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Jane')).toBeInTheDocument()
    })
  })
  
  it('displays error on fetch failure', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Failed'))
    
    render(UserList)
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
```

### Mocking Router

```typescript
// Navigation.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Navigation from './Navigation.vue'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('Navigation', () => {
  it('navigates on link click', async () => {
    const user = userEvent.setup()
    render(Navigation)
    
    await user.click(screen.getByText('Home'))
    
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})
```

## Testing Patterns

### Testing Loading States

```typescript
it('shows loading spinner while fetching', async () => {
  let resolvePromise: (value: any) => void
  const promise = new Promise((resolve) => {
    resolvePromise = resolve
  })
  
  global.fetch = vi.fn(() => promise)
  
  render(UserList)
  
  // Loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  
  // Resolve promise
  resolvePromise!({ json: () => Promise.resolve([]) })
  
  // Wait for loading to disappear
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })
})
```

### Testing Error Boundaries

```typescript
it('catches and displays child component errors', async () => {
  const ThrowError = {
    setup() {
      throw new Error('Test error')
    }
  }
  
  const { container } = render({
    components: { ThrowError },
    template: `
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    `
  })
  
  expect(container.textContent).toContain('Something went wrong')
})
```

### Testing with Timers

```typescript
// AutoSave.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/vue'
import AutoSave from './AutoSave.vue'

describe('AutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })
  
  it('auto-saves after delay', async () => {
    const saveFn = vi.fn()
    render(AutoSave, {
      props: {
        onSave: saveFn
      }
    })
    
    // Fast-forward time
    vi.advanceTimersByTime(5000)
    
    expect(saveFn).toHaveBeenCalled()
  })
})
```

## Snapshot Testing

```typescript
// Card.spec.ts
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/vue'
import Card from './Card.vue'

describe('Card', () => {
  it('matches snapshot', () => {
    const { container } = render(Card, {
      props: {
        title: 'Test Title',
        content: 'Test Content'
      }
    })
    
    expect(container).toMatchSnapshot()
  })
})
```

## Testing Best Practices

### ✅ DO

- **Test user behavior**, not implementation details
- **Use accessible queries** (getByRole, getByLabelText)
- **Test edge cases** (empty states, errors)
- **Mock external dependencies** (API calls)
- **Use meaningful test descriptions**
- **Keep tests isolated and independent**

### ❌ DON'T

- **Don't test implementation details** (internal state, methods)
- **Don't rely on CSS selectors** (use semantic queries)
- **Don't skip cleanup** (use afterEach)
- **Don't test library code** (Vue itself, third-party libs)
- **Don't make tests dependent on each other**

## Coverage Goals

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

**Target Coverage:**
- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

---

**Version:** 1.0  
**Last Updated:** 2025-01-09
