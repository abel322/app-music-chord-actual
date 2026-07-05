# 🚀 Guía de Deployment - MusicChord

## Opciones de Deployment

### Opción 1: Vercel + Supabase (Recomendado)

#### Ventajas
- ✅ Deploy automático desde GitHub
- ✅ Zero-config
- ✅ Edge functions
- ✅ PostgreSQL managed (Supabase)
- ✅ Gratis para empezar

#### Pasos

**1. Preparar Supabase**

```bash
# 1. Crear cuenta en supabase.com
# 2. Crear nuevo proyecto
# 3. Copiar DATABASE_URL de Settings > Database
```

**2. Configurar Vercel**

```bash
# 1. Push código a GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/musicchord.git
git push -u origin main

# 2. Ir a vercel.com
# 3. Import Git Repository
# 4. Seleccionar tu repo
```

**3. Variables de Entorno en Vercel**

```
DATABASE_URL=postgresql://...supabase...
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32
```

**4. Deploy**

```bash
# Vercel hace deploy automático
# Cada push a main = nuevo deploy
```

**5. Ejecutar Migraciones**

```bash
# Desde tu local
npx prisma db push
```

---

### Opción 2: Railway (Todo en uno)

#### Ventajas
- ✅ PostgreSQL incluido
- ✅ Deploy desde GitHub
- ✅ $5/mes de crédito gratis

#### Pasos

```bash
# 1. Crear cuenta en railway.app
# 2. New Project > Deploy from GitHub
# 3. Seleccionar repo
# 4. Add PostgreSQL service
# 5. Conectar DATABASE_URL automáticamente
# 6. Deploy
```

---

### Opción 3: DigitalOcean App Platform

#### Ventajas
- ✅ Control total
- ✅ Escalable
- ✅ $5/mes

#### Pasos

```bash
# 1. Crear Droplet con PostgreSQL
# 2. Configurar App Platform
# 3. Conectar GitHub
# 4. Deploy
```

---

## Configuración de Base de Datos

### Supabase

```bash
# 1. Crear proyecto en supabase.com
# 2. Copiar connection string
# 3. Añadir a .env

DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

### Railway

```bash
# Railway genera automáticamente:
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Local (Docker)

```bash
# Usar docker-compose.yml incluido
docker-compose up -d

# DATABASE_URL en .env
DATABASE_URL="postgresql://musicchord:musicchord123@localhost:5432/musicchord"
```

---

## CI/CD con GitHub Actions

El archivo `.github/workflows/ci.yml` ya está configurado:

```yaml
# Se ejecuta en:
- Push a main
- Pull requests

# Hace:
- Install dependencies
- Lint
- Type check
- Build
```

---

## Checklist Pre-Deploy

### Código
- [ ] `npm run build` funciona sin errores
- [ ] `npm run lint` pasa
- [ ] TypeScript sin errores
- [ ] Tests pasan (si hay)

### Base de Datos
- [ ] Schema de Prisma actualizado
- [ ] Migraciones ejecutadas
- [ ] Índices creados

### Environment Variables
- [ ] DATABASE_URL configurada
- [ ] NEXTAUTH_SECRET generada
- [ ] NEXTAUTH_URL correcta

### Seguridad
- [ ] .env en .gitignore
- [ ] Secrets no en código
- [ ] CORS configurado
- [ ] Rate limiting (futuro)

### Performance
- [ ] Images optimizadas
- [ ] Code splitting
- [ ] Database indexes

---

## Comandos Útiles

### Build Local
```bash
npm run build
npm start
```

### Database
```bash
# Push schema
npm run db:push

# Ver datos
npm run db:studio

# Reset (cuidado!)
npx prisma migrate reset
```

### Vercel CLI
```bash
# Install
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod

# Logs
vercel logs
```

---

## Monitoreo

### Vercel Analytics
```bash
# Añadir a layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Error Tracking (Sentry)
```bash
npm install @sentry/nextjs

# Configurar en next.config.js
```

---

## Backup Strategy

### Supabase
```bash
# Backups automáticos incluidos
# Restaurar desde dashboard
```

### Railway
```bash
# Backups automáticos
# Restaurar con un click
```

### Manual
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

---

## Scaling

### Horizontal (Vercel)
- Automático
- Edge functions
- CDN global

### Database (Supabase)
- Connection pooling
- Read replicas (Pro plan)
- Upgrade plan según uso

### Caching (Futuro)
```bash
# Redis en Railway
# Añadir servicio Redis
# Conectar con REDIS_URL
```

---

## Troubleshooting

### Build Fails
```bash
# Verificar logs en Vercel
# Común: DATABASE_URL no configurada
```

### Database Connection
```bash
# Verificar connection string
# Verificar IP whitelist (Supabase)
# Verificar Prisma client generado
```

### 500 Errors
```bash
# Ver logs: vercel logs
# Verificar env variables
# Verificar Prisma schema
```

---

## Costos Estimados

### Mes 1-3 (0-100 usuarios)
- Vercel: $0 (Hobby)
- Supabase: $0 (Free tier)
- Domain: $1/mes
- **Total: ~$1/mes**

### Mes 4-6 (100-1,000 usuarios)
- Vercel: $20/mes (Pro)
- Supabase: $25/mes (Pro)
- **Total: ~$45/mes**

### Mes 7-12 (1,000-10,000 usuarios)
- Vercel: $20/mes
- Supabase: $25/mes
- Redis: $10/mes
- **Total: ~$55/mes**

---

## Health Checks

### Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: await checkDatabase(),
  })
}
```

### Monitoring
- Vercel: Built-in uptime monitoring
- UptimeRobot: Gratis para 50 monitors
- Pingdom: Alternativa

---

## Rollback

### Vercel
```bash
# Desde dashboard:
# Deployments > Previous > Promote to Production

# O con CLI:
vercel rollback
```

---

## Próximos Pasos

1. Deploy a Vercel
2. Configurar dominio custom
3. Añadir Analytics
4. Configurar error tracking
5. Setup monitoring

**¡Listo para producción!** 🚀
