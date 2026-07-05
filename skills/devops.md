# 🔧 Ingeniero DevOps

## Responsabilidades

- Configurar CI/CD pipelines
- Containerización con Docker
- Deployment automatizado
- Monitoreo y logging
- Gestión de infraestructura
- Optimización de costos

## Stack Tecnológico

### Containerización
- **Docker**: Containerización de apps
- **Docker Compose**: Multi-container local dev

### CI/CD
- **GitHub Actions**: CI/CD integrado con GitHub
- **GitLab CI**: CI/CD para GitLab
- **Vercel**: Deploy automático para frontend
- **Railway**: Deploy fácil para fullstack

### Hosting
- **Vercel**: Next.js, React, static sites
- **Netlify**: JAMstack, serverless functions
- **Railway**: Node.js, Python, databases
- **Fly.io**: Apps globales, edge computing
- **AWS**: Escalabilidad enterprise
- **DigitalOcean**: VPS simple y económico

### Databases
- **Supabase**: PostgreSQL managed
- **PlanetScale**: MySQL serverless
- **MongoDB Atlas**: MongoDB managed
- **Redis Cloud**: Redis managed

## Docker Setup

### Dockerfile (Node.js)
```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## GitHub Actions

### CI/CD Pipeline
```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Environment Variables

### .env.example
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# API
API_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# External Services
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=SG...
```

## Deployment Strategies

### Vercel (Frontend)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url"
  }
}
```

### Railway (Backend)
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
```

## Monitoring

### Health Check Endpoint
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  })
})
```

### Error Tracking (Sentry)
```typescript
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

## Backup Strategy

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
# Upload to S3 or similar
```

## Checklist de Deployment

- [ ] Environment variables configuradas
- [ ] Database migrations ejecutadas
- [ ] Health check endpoint funcionando
- [ ] HTTPS configurado
- [ ] Domain/DNS configurado
- [ ] Monitoring activo
- [ ] Backups automatizados
- [ ] Error tracking (Sentry)
- [ ] Rate limiting configurado
- [ ] CORS configurado

## Métricas de Éxito

- ✅ Deploy time < 5 minutos
- ✅ Zero-downtime deployments
- ✅ Automated backups
- ✅ 99.9% uptime
- ✅ Monitoring y alertas activas
