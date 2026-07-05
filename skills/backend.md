# ⚙️ Desarrollador Backend

## Responsabilidades

- Diseñar y desarrollar APIs REST/GraphQL
- Implementar lógica de negocio
- Gestionar bases de datos
- Implementar autenticación y autorización
- Optimizar queries y performance
- Garantizar seguridad del sistema

## Stack Tecnológico

### Runtime & Frameworks
- **Node.js + Express**: Ligero, flexible, gran ecosistema
- **Node.js + NestJS**: TypeScript, arquitectura modular, enterprise-ready
- **Python + FastAPI**: Rápido, async, auto-documentación
- **Python + Django**: Batteries included, admin panel, ORM potente

### Bases de Datos
- **PostgreSQL**: Relacional, ACID, JSON support
- **MongoDB**: NoSQL, flexible, escalable
- **Redis**: Cache, sessions, pub/sub
- **Prisma**: ORM type-safe para Node.js

### Autenticación
- **JWT**: Stateless, escalable
- **Passport.js**: Estrategias múltiples
- **NextAuth.js**: Auth para Next.js
- **OAuth 2.0**: Login social (Google, GitHub)

## Estructura de Proyecto

### Node.js + Express
```
api/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.dto.ts
│   │   ├── users/
│   │   └── products/
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── utils/
│   │   └── types/
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   └── server.ts
├── prisma/
│   └── schema.prisma
├── tests/
└── package.json
```

## API REST Best Practices

### Estructura de Endpoints
```
GET    /api/users          # List all
GET    /api/users/:id      # Get one
POST   /api/users          # Create
PUT    /api/users/:id      # Update (full)
PATCH  /api/users/:id      # Update (partial)
DELETE /api/users/:id      # Delete
```

### Controller Example
```typescript
import { Request, Response } from 'express'
import { UserService } from './user.service'
import { CreateUserDto } from './user.dto'

export class UserController {
  constructor(private userService: UserService) {}

  async getAll(req: Request, res: Response) {
    try {
      const users = await this.userService.findAll()
      res.json({ data: users })
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async create(req: Request, res: Response) {
    try {
      const dto = CreateUserDto.parse(req.body)
      const user = await this.userService.create(dto)
      res.status(201).json({ data: user })
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  }
}
```

### Service Layer
```typescript
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true }
    })
  }

  async create(data: CreateUserDto) {
    const hashedPassword = await hash(data.password, 10)
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword
      }
    })
  }
}
```

## Autenticación JWT

### Generate Token
```typescript
import jwt from 'jsonwebtoken'

export function generateToken(userId: string) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )
}
```

### Verify Middleware
```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

## Base de Datos

### Prisma Schema
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

## Validación con Zod

```typescript
import { z } from 'zod'

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(8),
})

export type CreateUserDto = z.infer<typeof CreateUserSchema>
```

## Error Handling

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message
    })
  }

  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
```

## Testing

```typescript
import request from 'supertest'
import { app } from '../server'

describe('POST /api/users', () => {
  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      })
    
    expect(response.status).toBe(201)
    expect(response.body.data).toHaveProperty('id')
  })
})
```

## Seguridad

- [ ] Helmet.js (security headers)
- [ ] CORS configurado correctamente
- [ ] Rate limiting
- [ ] Input validation
- [ ] SQL injection prevention (usar ORM)
- [ ] XSS prevention
- [ ] CSRF tokens
- [ ] Passwords hasheados (bcrypt)
- [ ] Secrets en variables de entorno

## Performance

- [ ] Database indexing
- [ ] Query optimization
- [ ] Caching (Redis)
- [ ] Connection pooling
- [ ] Pagination
- [ ] Compression (gzip)
- [ ] CDN para assets

## Métricas de Éxito

- ✅ Response time < 200ms (p95)
- ✅ 99.9% uptime
- ✅ Zero security vulnerabilities
- ✅ 100% test coverage en lógica crítica
- ✅ API documentation completa
