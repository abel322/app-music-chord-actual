# 🏗️ Arquitectura de MusicChord

## Visión General

MusicChord es una aplicación SaaS construida con arquitectura moderna de Next.js 14, siguiendo principios de Clean Architecture y SOLID.

## Stack Tecnológico

### Frontend
- **Next.js 14**: Framework React con App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS
- **Framer Motion**: Animaciones
- **Lucide React**: Iconos

### Backend
- **Next.js API Routes**: Serverless functions
- **Prisma ORM**: Type-safe database client
- **PostgreSQL**: Base de datos relacional
- **Zod**: Schema validation

### DevOps
- **Vercel**: Hosting y CI/CD
- **Railway/Supabase**: PostgreSQL managed

## Arquitectura de Capas

\`\`\`
┌─────────────────────────────────────┐
│     Presentation Layer              │
│  (Components, Pages, UI)            │
├─────────────────────────────────────┤
│     Application Layer               │
│  (API Routes, Business Logic)       │
├─────────────────────────────────────┤
│     Domain Layer                    │
│  (chord-parser, transpose)          │
├─────────────────────────────────────┤
│     Infrastructure Layer            │
│  (Prisma, Database)                 │
└─────────────────────────────────────┘
\`\`\`

## Módulos Principales

### 1. Chord Parser
**Ubicación**: \`lib/chord-parser.ts\`

**Responsabilidad**: Detectar y parsear acordes musicales

**Funciones**:
- \`parseChords(text)\`: Extrae acordes del texto
- \`detectKey(chords)\`: Detecta tonalidad basada en acordes

**Algoritmo**:
1. Regex para detectar patrones de acordes
2. Análisis de frecuencia de notas raíz
3. Retorna tonalidad más probable

### 2. Transpose Engine
**Ubicación**: \`lib/transpose.ts\`

**Responsabilidad**: Transponer acordes y canciones

**Funciones**:
- \`transposeChord(chord, semitones)\`: Transpone un acorde
- \`transposeSong(lyrics, semitones)\`: Transpone canción completa
- \`getSemitonesBetween(from, to)\`: Calcula semitonos entre tonalidades

**Algoritmo**:
1. Mapeo de notas en círculo cromático
2. Cálculo modular de posiciones
3. Preservación de sufijos (m, 7, maj, etc)

### 3. API Layer
**Ubicación**: \`app/api/\`

**Endpoints**:

#### Songs API
- \`GET /api/songs?userId=xxx&search=xxx\`
- \`POST /api/songs\`
- \`GET /api/songs/[id]\`
- \`PUT /api/songs/[id]\`
- \`DELETE /api/songs/[id]\`

#### Transpose API
- \`POST /api/transpose\`

**Validación**: Zod schemas

### 4. Database Schema

\`\`\`prisma
User {
  id: String (cuid)
  email: String (unique)
  name: String?
  password: String (hashed)
  plan: Enum (FREE, PRO, ENTERPRISE)
  songs: Song[]
}

Song {
  id: String (cuid)
  title: String
  artist: String?
  key: String (C, D, E, etc)
  lyrics: Text
  chords: Text (JSON)
  userId: String (FK)
  user: User
}
\`\`\`

**Índices**:
- \`userId\`: Para queries rápidas por usuario
- \`title\`: Para búsqueda de canciones

## Flujo de Datos

### Crear Canción
\`\`\`
User Input → Validation (Zod) → Parse Chords → Detect Key → Save to DB
\`\`\`

### Transponer Canción
\`\`\`
Song + Target Key → Calculate Semitones → Transpose All Chords → Return Result
\`\`\`

### Búsqueda
\`\`\`
Search Query → Prisma Filter (title/artist) → Return Results
\`\`\`

## Patrones de Diseño

### 1. Repository Pattern
Prisma actúa como repository, abstrayendo acceso a datos

### 2. Service Layer
Lógica de negocio separada en \`lib/\`:
- \`chord-parser.ts\`
- \`transpose.ts\`

### 3. Validation Layer
Zod schemas para validación de inputs

### 4. Component Composition
Componentes UI reutilizables en \`components/ui/\`

## Seguridad

### Implementado
- [x] Input validation (Zod)
- [x] SQL injection prevention (Prisma)
- [x] Environment variables para secrets

### Por Implementar
- [ ] Authentication (NextAuth.js)
- [ ] Authorization (RBAC)
- [ ] Rate limiting
- [ ] CSRF protection

## Performance

### Optimizaciones
- Database indexing (userId, title)
- Server-side rendering (Next.js)
- Code splitting automático
- Image optimization (Next.js Image)

### Métricas Objetivo
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

## Escalabilidad

### Horizontal Scaling
- Serverless functions (Vercel)
- Database connection pooling (Prisma)

### Vertical Scaling
- PostgreSQL optimizado
- Índices en queries frecuentes

### Caching Strategy (Futuro)
- Redis para sesiones
- CDN para assets estáticos

## Testing Strategy

### Unit Tests
- \`chord-parser.ts\`
- \`transpose.ts\`
- Componentes UI

### Integration Tests
- API endpoints
- Database operations

### E2E Tests
- User flows críticos
- Playwright

## Deployment

### CI/CD Pipeline
\`\`\`
Git Push → GitHub → Vercel Build → Deploy → Health Check
\`\`\`

### Environments
- **Development**: Local (\`npm run dev\`)
- **Staging**: Vercel preview
- **Production**: Vercel production

## Monitoreo

### Logs
- Vercel logs
- Error tracking (Sentry - futuro)

### Métricas
- Vercel Analytics
- Database metrics (Railway/Supabase)

## Roadmap Técnico

### Fase 1 (Actual)
- [x] CRUD de canciones
- [x] Transposición básica
- [x] Búsqueda simple

### Fase 2
- [ ] Autenticación
- [ ] Dashboard de usuario
- [ ] Editor avanzado

### Fase 3
- [ ] Exportar PDF
- [ ] Compartir canciones
- [ ] Colaboración

### Fase 4
- [ ] API pública
- [ ] Webhooks
- [ ] Integraciones

## Decisiones Arquitectónicas

### ¿Por qué Next.js?
- SSR para SEO
- API Routes integradas
- Deployment simple en Vercel
- Ecosistema React

### ¿Por qué Prisma?
- Type-safe
- Migraciones automáticas
- Excelente DX
- Compatible con múltiples DBs

### ¿Por qué PostgreSQL?
- ACID compliance
- JSON support
- Escalable
- Managed options (Supabase, Railway)

### ¿Por qué Tailwind?
- Desarrollo rápido
- Consistencia visual
- Tree-shaking automático
- Responsive design fácil

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guías de desarrollo.
