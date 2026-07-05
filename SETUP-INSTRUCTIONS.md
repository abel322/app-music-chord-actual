# 🚀 Instrucciones de Configuración - MusicChord

## ✅ Estado Actual

- [x] Dependencias instaladas (`npm install`)
- [x] Archivo `.env` creado
- [ ] Base de datos configurada
- [ ] Aplicación ejecutándose

## 🗄️ Configurar Base de Datos

### Opción 1: Supabase (Recomendado - Gratis)

**Pasos:**

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta

2. Crea un nuevo proyecto:
   - Nombre: `musicchord`
   - Database Password: (guarda esta contraseña)
   - Region: Elige la más cercana

3. Espera 2 minutos mientras se crea el proyecto

4. Ve a **Settings** > **Database** > **Connection string** > **URI**

5. Copia la connection string (se ve así):
   ```
   postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```

6. Pega la connection string en tu archivo `.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@..."
   ```

7. Ejecuta las migraciones:
   ```bash
   npm run db:push
   ```

### Opción 2: Railway (También Gratis)

**Pasos:**

1. Ve a [railway.app](https://railway.app) y crea una cuenta

2. New Project > Provision PostgreSQL

3. Copia la `DATABASE_URL` desde las variables de entorno

4. Pégala en tu archivo `.env`

5. Ejecuta:
   ```bash
   npm run db:push
   ```

### Opción 3: PostgreSQL Local (Requiere Docker)

Si tienes Docker instalado:

```bash
# Iniciar PostgreSQL
docker compose up -d

# La DATABASE_URL ya está configurada en .env
# Ejecutar migraciones
npm run db:push
```

Si no tienes Docker, instálalo desde [docker.com](https://www.docker.com/products/docker-desktop/)

## 🚀 Ejecutar la Aplicación

Una vez configurada la base de datos:

```bash
# 1. Sincronizar schema con la base de datos
npm run db:push

# 2. Ejecutar en modo desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Ejecutar app en desarrollo

# Base de datos
npm run db:push          # Sincronizar schema
npm run db:studio        # Abrir Prisma Studio (GUI para ver datos)

# Build
npm run build            # Build para producción
npm start                # Ejecutar producción

# Linting
npm run lint             # Verificar código
```

## ⚠️ Solución de Problemas

### Error: "Can't reach database server"

**Causa**: La DATABASE_URL no es correcta o la base de datos no está accesible.

**Solución**:
1. Verifica que la DATABASE_URL en `.env` sea correcta
2. Si usas Supabase, verifica que incluiste la contraseña
3. Prueba la conexión con: `npm run db:push`

### Error: "Module not found"

**Causa**: Dependencias no instaladas correctamente.

**Solución**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Puerto 3000 ya en uso

**Solución**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# O usa otro puerto
PORT=3001 npm run dev
```

## 📊 Verificar Instalación

Ejecuta estos comandos para verificar:

```bash
# Verificar Node.js
node --version    # Debe ser v18 o superior

# Verificar npm
npm --version

# Verificar dependencias
npm list --depth=0

# Verificar TypeScript
npx tsc --version
```

## 🎯 Próximos Pasos

Una vez que la app esté corriendo:

1. ✅ Explora la landing page
2. ✅ Prueba crear una canción (API)
3. ✅ Prueba la transposición
4. ✅ Revisa el código en `app/` y `components/`
5. ✅ Lee `ARCHITECTURE.md` para entender la estructura

## 🆘 ¿Necesitas Ayuda?

- Revisa `README.md` para documentación completa
- Revisa `ARCHITECTURE.md` para detalles técnicos
- Revisa `DEPLOYMENT.md` para deploy a producción

## 🎉 ¡Listo!

Una vez que veas la landing page en http://localhost:3000, ¡estás listo para desarrollar!

---

**Nota**: Si no quieres configurar base de datos ahora, puedes explorar el código y la UI. La base de datos solo es necesaria para guardar canciones.
