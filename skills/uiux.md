# 🎨 Diseñador UI/UX Profesional

## Responsabilidades

- Diseñar experiencia de usuario intuitiva
- Crear interfaces visuales modernas
- Definir flujos de usuario
- Prototipar interacciones
- Garantizar consistencia visual
- Optimizar conversión

## Principios de Diseño

### UX (User Experience)
1. **Usabilidad**: Fácil de usar
2. **Accesibilidad**: Para todos los usuarios
3. **Findability**: Fácil de navegar
4. **Credibilidad**: Inspirar confianza
5. **Valor**: Resolver problemas reales

### UI (User Interface)
1. **Jerarquía Visual**: Guiar la atención
2. **Consistencia**: Patrones predecibles
3. **Feedback**: Respuesta a acciones
4. **Simplicidad**: Menos es más
5. **Estética**: Visualmente atractivo

## Design System

### Colores
```css
/* Primary */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-900: #1e3a8a;

/* Neutral */
--gray-50: #f9fafb;
--gray-500: #6b7280;
--gray-900: #111827;

/* Semantic */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
```

### Typography
```css
/* Font Family */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Spacing
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
```

### Gradientes Modernos
```css
/* Gradiente Principal (Brand) */
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Gradiente Sunset */
--gradient-sunset: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

/* Gradiente Ocean */
--gradient-ocean: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);

/* Gradiente Success */
--gradient-success: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);

/* Gradiente Dark */
--gradient-dark: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Gradiente Glass (Glassmorphism) */
--gradient-glass: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.1) 0%,
  rgba(255, 255, 255, 0.05) 100%
);

/* Gradiente Mesh (Moderno) */
--gradient-mesh: radial-gradient(
  at 40% 20%, 
  hsla(28,100%,74%,1) 0px, 
  transparent 50%
),
radial-gradient(
  at 80% 0%, 
  hsla(189,100%,56%,1) 0px, 
  transparent 50%
),
radial-gradient(
  at 0% 50%, 
  hsla(355,100%,93%,1) 0px, 
  transparent 50%
);
```

### Aplicación de Gradientes
```css
/* Botón con gradiente */
.btn-gradient {
  background: var(--gradient-primary);
  color: white;
  border: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

/* Card con gradiente sutil */
.card-gradient {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 100%
  );
  backdrop-filter: blur(10px);
}

/* Texto con gradiente */
.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Border con gradiente */
.border-gradient {
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box,
              var(--gradient-primary) border-box;
}
```

## Animaciones y Transiciones

### Principios de Animación
1. **Duración**: 200-300ms para micro-interacciones, 400-600ms para transiciones
2. **Easing**: ease-out para entradas, ease-in para salidas
3. **Propósito**: Cada animación debe tener un propósito (feedback, guía, deleite)
4. **Performance**: Animar solo transform y opacity

### Timing Functions
```css
/* Easing personalizado */
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
```

### Animaciones CSS
```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide In */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Pulse (para notificaciones) */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Shimmer (loading skeleton) */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

/* Gradient Animation */
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

### Animaciones con Framer Motion (React)
```typescript
import { motion } from 'framer-motion'

// Fade In Up
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>

// Stagger Children
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>

// Hover Scale
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>

// Page Transitions
<motion.div
  initial={{ opacity: 0, x: -100 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 100 }}
  transition={{ duration: 0.3 }}
>
  Page content
</motion.div>
```

### Micro-interacciones
```css
/* Button Ripple Effect */
.btn-ripple {
  position: relative;
  overflow: hidden;
}

.btn-ripple::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn-ripple:active::after {
  width: 300px;
  height: 300px;
}

/* Input Focus Animation */
.input-animated {
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.input-animated:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

/* Card Hover Effect */
.card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}
```

### Loading States Animados
```css
/* Spinner */
.spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Skeleton Loading */
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Dots Loading */
.dots-loading span {
  animation: bounce 1.4s infinite ease-in-out both;
}

.dots-loading span:nth-child(1) {
  animation-delay: -0.32s;
}

.dots-loading span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
```

### Scroll Animations
```typescript
// Intersection Observer para animaciones al scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in')
    }
  })
}, observerOptions)

// CSS
.animate-in {
  animation: fadeIn 0.6s ease-out forwards;
}
```

## Componentes UI

### Button States
```
Default → Hover → Active → Disabled → Loading
```

### Form Elements
- Input fields
- Textarea
- Select dropdown
- Checkbox
- Radio buttons
- Toggle switch
- Date picker

### Feedback
- Toast notifications
- Modal dialogs
- Loading spinners
- Progress bars
- Empty states
- Error messages

## User Flows

### Onboarding
```
Landing → Sign Up → Email Verification → Profile Setup → Dashboard
```

### Purchase Flow
```
Browse → Product Detail → Add to Cart → Checkout → Payment → Confirmation
```

## Wireframes (Texto)

### Landing Page
```
┌─────────────────────────────────────┐
│ [Logo]              [Login] [Sign Up]│
├─────────────────────────────────────┤
│                                     │
│     Headline Principal              │
│     Subheadline explicativo         │
│                                     │
│     [CTA Button]                    │
│                                     │
│     [Hero Image/Video]              │
│                                     │
├─────────────────────────────────────┤
│  Feature 1  │  Feature 2  │ Feature 3│
├─────────────────────────────────────┤
│     Testimonials Section            │
├─────────────────────────────────────┤
│     Pricing Section                 │
├─────────────────────────────────────┤
│     Footer                          │
└─────────────────────────────────────┘
```

### Dashboard
```
┌─────────────────────────────────────┐
│ [Logo] [Search]      [User] [Notif] │
├──────┬──────────────────────────────┤
│      │  Welcome back, User!         │
│ Nav  │                              │
│ Menu │  [Stat 1] [Stat 2] [Stat 3] │
│      │                              │
│      │  Recent Activity             │
│      │  ┌────────────────────────┐  │
│      │  │ Item 1                 │  │
│      │  │ Item 2                 │  │
│      │  │ Item 3                 │  │
│      │  └────────────────────────┘  │
└──────┴──────────────────────────────┘
```

## Responsive Breakpoints

```
Mobile:  < 640px
Tablet:  640px - 1024px
Desktop: > 1024px
```

## Accesibilidad (WCAG)

- [ ] Contraste mínimo 4.5:1 (texto normal)
- [ ] Contraste mínimo 3:1 (texto grande)
- [ ] Focus visible en elementos interactivos
- [ ] Alt text en imágenes
- [ ] Labels en formularios
- [ ] Keyboard navigation
- [ ] Screen reader friendly

## Herramientas

- **Figma**: Diseño y prototipado
- **Tailwind CSS**: Framework CSS
- **shadcn/ui**: Componentes React
- **Lucide Icons**: Iconos
- **Coolors**: Paletas de colores
- **Google Fonts**: Tipografías

## Efectos Visuales Modernos

### Glassmorphism
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Neumorphism
```css
.neomorphic {
  background: #e0e5ec;
  box-shadow: 
    9px 9px 16px rgba(163, 177, 198, 0.6),
    -9px -9px 16px rgba(255, 255, 255, 0.5);
  border-radius: 20px;
}

.neomorphic:active {
  box-shadow: 
    inset 9px 9px 16px rgba(163, 177, 198, 0.6),
    inset -9px -9px 16px rgba(255, 255, 255, 0.5);
}
```

### Parallax Effect
```typescript
// Parallax simple con scroll
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset
  const parallax = document.querySelector('.parallax')
  parallax.style.transform = `translateY(${scrolled * 0.5}px)`
})
```

### Gradient Background Animado
```css
.gradient-animated {
  background: linear-gradient(
    -45deg,
    #ee7752,
    #e73c7e,
    #23a6d5,
    #23d5ab
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}
```

## Checklist de Diseño

- [ ] Wireframes creados
- [ ] Design system definido
- [ ] Paleta de colores + gradientes
- [ ] Componentes diseñados
- [ ] Responsive design
- [ ] Estados de interacción
- [ ] Animaciones y transiciones
- [ ] Loading states animados
- [ ] Error states
- [ ] Empty states
- [ ] Micro-interacciones
- [ ] Accesibilidad básica
- [ ] Performance de animaciones

## Métricas de Éxito

- ✅ Tasa de conversión > 3%
- ✅ Bounce rate < 40%
- ✅ Time on page > 2 min
- ✅ WCAG AA compliance
- ✅ Mobile-friendly
