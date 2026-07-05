# 💻 Desarrollador Frontend

## Responsabilidades

- Crear interfaces de usuario modernas y responsivas
- Implementar diseños UI/UX
- Optimizar performance del frontend
- Garantizar accesibilidad (a11y)
- Integrar con APIs backend
- Implementar estado global y gestión de datos

## Stack Tecnológico

### Frameworks/Libraries
- **React 18+**: Hooks, Server Components, Suspense
- **Next.js 14+**: App Router, Server Actions, Streaming
- **TypeScript**: Type safety, mejor DX
- **Tailwind CSS**: Utility-first CSS, diseño rápido
- **shadcn/ui**: Componentes accesibles y customizables

### Estado y Datos
- **Zustand**: Estado global simple
- **TanStack Query**: Server state, caching, sincronización
- **React Hook Form**: Formularios performantes
- **Zod**: Validación de schemas

### Herramientas
- **Vite**: Build tool rápido
- **ESLint + Prettier**: Code quality
- **Vitest**: Unit testing
- **Playwright**: E2E testing

## Estructura de Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/               # API Routes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                # Componentes base (shadcn)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── card.tsx
│   ├── features/          # Componentes de features
│   │   ├── auth/
│   │   └── dashboard/
│   └── layouts/           # Layouts compartidos
├── lib/
│   ├── api/              # API client
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utilidades
│   └── validations/      # Schemas de validación
├── styles/
│   └── globals.css
└── types/
    └── index.ts
```

## Componentes Best Practices

### Componente Base
```typescript
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'hover:bg-gray-100': variant === 'ghost',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled || isLoading,
        },
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
}
```

### Custom Hook
```typescript
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

### API Client
```typescript
import { z } from 'zod'

const API_URL = process.env.NEXT_PUBLIC_API_URL

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint)
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const api = new ApiClient()
```

## Patrones de Diseño

### Compound Components
```typescript
interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

export function Tabs({ children, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  )
}

Tabs.List = function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2">{children}</div>
}

Tabs.Tab = function Tab({ value, children }: TabProps) {
  const context = useContext(TabsContext)
  return (
    <button
      onClick={() => context?.setActiveTab(value)}
      className={context?.activeTab === value ? 'active' : ''}
    >
      {children}
    </button>
  )
}
```

### Render Props
```typescript
interface DataFetcherProps<T> {
  url: string
  children: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode
}

export function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [url])

  return <>{children(data, loading, error)}</>
}
```

## Performance Optimization

### Code Splitting
```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Disable SSR if needed
})
```

### Memoization
```typescript
import { memo, useMemo, useCallback } from 'react'

export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  const processedData = useMemo(() => {
    return data.map(item => /* expensive operation */)
  }, [data])

  const handleClick = useCallback(() => {
    // handler logic
  }, [])

  return <div onClick={handleClick}>{/* render */}</div>
})
```

### Image Optimization
```typescript
import Image from 'next/image'

export function OptimizedImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={1200}
      height={600}
      priority // For above-the-fold images
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  )
}
```

## Accesibilidad (a11y)

### Checklist
- [ ] Semantic HTML (header, nav, main, footer)
- [ ] ARIA labels cuando sea necesario
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus visible
- [ ] Color contrast (WCAG AA mínimo)
- [ ] Alt text en imágenes
- [ ] Form labels
- [ ] Error messages descriptivos

### Ejemplo Accesible
```typescript
export function AccessibleModal({ isOpen, onClose, title, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className={isOpen ? 'block' : 'hidden'}
    >
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <h2 id="modal-title">{title}</h2>
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="close-button"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  )
}
```

## Testing

### Unit Test (Vitest)
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Button isLoading>Click me</Button>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
```

### E2E Test (Playwright)
```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'user@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

## Responsive Design

### Breakpoints (Tailwind)
```typescript
// Mobile first approach
<div className="
  w-full           // mobile
  md:w-1/2         // tablet (768px+)
  lg:w-1/3         // desktop (1024px+)
  xl:w-1/4         // large desktop (1280px+)
">
  Content
</div>
```

### Container Queries (Modern)
```css
@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
```

## Checklist de Desarrollo

### Antes de Empezar
- [ ] Revisar diseño UI/UX
- [ ] Definir componentes reutilizables
- [ ] Configurar proyecto (Next.js, TypeScript, Tailwind)
- [ ] Configurar ESLint y Prettier

### Durante el Desarrollo
- [ ] Componentes modulares y reutilizables
- [ ] TypeScript types para todo
- [ ] Responsive design (mobile-first)
- [ ] Accesibilidad básica
- [ ] Loading states
- [ ] Error handling
- [ ] Form validation

### Antes de Deploy
- [ ] Tests unitarios críticos
- [ ] Tests E2E de flujos principales
- [ ] Lighthouse audit (Performance, A11y, SEO)
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Optimización de imágenes
- [ ] Code splitting implementado

## Herramientas Esenciales

- **VS Code Extensions**: ESLint, Prettier, Tailwind IntelliSense
- **Chrome DevTools**: Performance, Lighthouse, Accessibility
- **React DevTools**: Component tree, profiler
- **Figma**: Diseño y handoff
- **Storybook**: Component documentation

## Métricas de Éxito

- ✅ Lighthouse Score > 90 (Performance, A11y, Best Practices, SEO)
- ✅ First Contentful Paint < 1.8s
- ✅ Time to Interactive < 3.8s
- ✅ Cumulative Layout Shift < 0.1
- ✅ 100% responsive (mobile, tablet, desktop)
- ✅ WCAG AA compliance
- ✅ Zero console errors/warnings
