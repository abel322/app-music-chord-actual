# 🔐 Configuración de Autenticación - MusicChord

## ✅ Instalado

- [x] NextAuth.js
- [x] @auth/prisma-adapter
- [x] bcrypt (para hash de contraseñas)
- [x] Prisma schema actualizado
- [x] API routes configuradas
- [x] Páginas de login/register actualizadas

## 🚀 Configuración Rápida

### 1. Generar NEXTAUTH_SECRET

```bash
# Opción 1: Con OpenSSL (recomendado)
openssl rand -base64 32

# Opción 2: Online
# Visita: https://generate-secret.vercel.app/32
```

Copia el resultado y pégalo en `.env`:
```env
NEXTAUTH_SECRET="tu-secret-generado-aqui"
```

### 2. Configurar Base de Datos

```bash
# Sincronizar el nuevo schema con la base de datos
npm run db:push
```

Esto creará las tablas:
- `User` (actualizada)
- `Account` (nueva - para OAuth)
- `Session` (nueva - para sesiones)
- `VerificationToken` (nueva - para verificación de email)

### 3. Probar Autenticación

```bash
# Ejecutar la app
npm run dev
```

Ahora puedes:
1. Ir a http://localhost:3000/register
2. Crear una cuenta con email y contraseña
3. Iniciar sesión en http://localhost:3000/login

## 🔑 Autenticación Disponible

### ✅ Email y Contraseña
- Registro con validación
- Login con credenciales
- Hash seguro de contraseñas (bcrypt)

### ⏳ OAuth (Opcional)
Para habilitar login con Google o GitHub:

#### Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita "Google+ API"
4. Crea credenciales OAuth 2.0:
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copia Client ID y Client Secret a `.env`:

```env
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"
```

#### GitHub OAuth

1. Ve a [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. New OAuth App:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Copia Client ID y Client Secret a `.env`:

```env
GITHUB_ID="tu-github-client-id"
GITHUB_SECRET="tu-github-client-secret"
```

## 📁 Archivos Creados

### API Routes
- `app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- `app/api/auth/register/route.ts` - Endpoint de registro

### Configuración
- `lib/auth.ts` - Configuración de NextAuth
- `types/next-auth.d.ts` - TypeScript types

### Componentes
- `components/providers/session-provider.tsx` - Session provider

### Páginas Actualizadas
- `app/(auth)/login/page.tsx` - Login funcional
- `app/(auth)/register/page.tsx` - Registro funcional

## 🔒 Seguridad Implementada

- ✅ Contraseñas hasheadas con bcrypt (12 rounds)
- ✅ Validación de inputs con Zod
- ✅ JWT para sesiones
- ✅ CSRF protection (NextAuth)
- ✅ Secure cookies
- ✅ SQL injection prevention (Prisma)

## 🧪 Probar la Autenticación

### Registro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login (con NextAuth)
1. Ve a http://localhost:3000/login
2. Ingresa email y contraseña
3. Serás redirigido a `/dashboard` (pendiente de crear)

## 📊 Base de Datos

### Tablas Creadas

**User**
- id, name, email, emailVerified, image, password, plan
- Relaciones: songs, accounts, sessions

**Account**
- Para OAuth providers (Google, GitHub)
- Almacena tokens de acceso

**Session**
- Sesiones activas de usuarios
- Expira automáticamente

**VerificationToken**
- Para verificación de email (futuro)

## 🔐 Proteger Rutas

Para proteger páginas que requieren autenticación:

```typescript
// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  return <div>Dashboard protegido</div>
}
```

## 🎯 Próximos Pasos

1. ✅ Autenticación básica funcionando
2. ⏳ Crear página de dashboard
3. ⏳ Implementar "Olvidé mi contraseña"
4. ⏳ Verificación de email
5. ⏳ Configurar OAuth (Google, GitHub)

## 🐛 Troubleshooting

### Error: "NEXTAUTH_SECRET not set"
```bash
# Genera un secret
openssl rand -base64 32

# Añádelo a .env
NEXTAUTH_SECRET="tu-secret-aqui"
```

### Error: "Can't reach database"
```bash
# Verifica DATABASE_URL en .env
# Ejecuta las migraciones
npm run db:push
```

### Error: "User already exists"
- El email ya está registrado
- Usa otro email o inicia sesión

### OAuth no funciona
- Verifica que GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET estén en .env
- Verifica las redirect URIs en Google/GitHub console
- Reinicia el servidor después de cambiar .env

## 📚 Recursos

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)
- [Google OAuth Setup](https://console.cloud.google.com/)
- [GitHub OAuth Setup](https://github.com/settings/developers)

---

**¡Autenticación lista!** 🎉

Ahora puedes registrar usuarios, iniciar sesión y proteger rutas.
