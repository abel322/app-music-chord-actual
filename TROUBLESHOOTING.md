# 🔧 Solución de Problemas - MusicChord

## Error 404 "This page could not be found"

### Causa
Next.js no está compilando correctamente o hay un problema con la caché.

### Solución

#### Opción 1: Limpiar y Reiniciar (Recomendado)

```bash
# 1. Detener el servidor (Ctrl+C en la terminal)

# 2. Eliminar carpetas de caché
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache

# 3. Reinstalar dependencias (opcional)
npm install

# 4. Ejecutar de nuevo
npm run dev
```

#### Opción 2: Verificar Puerto

```bash
# Asegúrate de que el puerto 3000 no esté ocupado
netstat -ano | findstr :3000

# Si está ocupado, mata el proceso
taskkill /PID <PID> /F

# O usa otro puerto
$env:PORT=3001; npm run dev
```

#### Opción 3: Verificar Archivos

Asegúrate de que existan estos archivos:
- ✅ `app/page.tsx` (landing page)
- ✅ `app/layout.tsx` (layout principal)
- ✅ `app/globals.css` (estilos)

```bash
# Verificar estructura
tree app /F
```

#### Opción 4: Build Manual

```bash
# Hacer build completo
npm run build

# Ejecutar producción
npm start
```

---

## Error "ERR_UNSUPPORTED_ESM_URL_SCHEME"

### Causa
Problema de Next.js 14.2.0 con rutas de Windows.

### Solución
✅ Ya solucionado - actualizado a Next.js 14.2.18

Si persiste:
```bash
npm install next@latest
```

---

## Error "Can't reach database server"

### Causa
DATABASE_URL no configurada o incorrecta.

### Solución

1. Verifica tu archivo `.env`:
```env
DATABASE_URL="postgresql://..."
```

2. Si usas Supabase, asegúrate de:
   - Incluir la contraseña correcta
   - Usar la URI completa
   - Verificar que el proyecto esté activo

3. Prueba la conexión:
```bash
npm run db:push
```

---

## Error "Module not found"

### Causa
Dependencias no instaladas o corruptas.

### Solución

```bash
# Limpiar todo
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstalar
npm install
```

---

## Error de Compilación de TypeScript

### Causa
Errores de tipos o sintaxis.

### Solución

```bash
# Ver errores específicos
npx tsc --noEmit

# Verificar configuración
cat tsconfig.json
```

---

## Puerto 3000 ya en uso

### Solución

```bash
# Opción 1: Matar proceso
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Opción 2: Usar otro puerto
$env:PORT=3001
npm run dev
```

---

## Estilos no se aplican (Tailwind)

### Causa
PostCSS o Tailwind no configurado correctamente.

### Solución

1. Verifica que existan:
   - `tailwind.config.ts`
   - `postcss.config.mjs`
   - `app/globals.css`

2. Reinicia el servidor:
```bash
# Ctrl+C
npm run dev
```

---

## Hot Reload no funciona

### Solución

```bash
# Agregar al package.json scripts:
"dev": "next dev --turbo"

# O reiniciar con:
npm run dev
```

---

## Prisma: "Client not generated"

### Causa
Prisma Client no generado después de cambios en schema.

### Solución

```bash
# Generar cliente
npx prisma generate

# Sincronizar con DB
npm run db:push
```

---

## Build falla en producción

### Solución

```bash
# Limpiar todo
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules

# Reinstalar
npm install

# Build
npm run build
```

---

## Comandos Útiles de Diagnóstico

```bash
# Ver versión de Node
node --version  # Debe ser v18+

# Ver versión de npm
npm --version

# Ver dependencias instaladas
npm list --depth=0

# Ver errores de TypeScript
npx tsc --noEmit

# Ver estado de Prisma
npx prisma validate

# Limpiar caché de npm
npm cache clean --force
```

---

## Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] Node.js v18 o superior instalado
- [ ] `npm install` ejecutado sin errores
- [ ] Archivo `.env` existe y tiene DATABASE_URL
- [ ] Puerto 3000 disponible
- [ ] No hay errores de TypeScript (`npx tsc --noEmit`)
- [ ] Carpeta `.next` eliminada y regenerada
- [ ] Servidor reiniciado después de cambios

---

## Logs Útiles

### Ver logs completos de Next.js
```bash
npm run dev -- --debug
```

### Ver logs de Prisma
```bash
$env:DEBUG="prisma:*"
npm run dev
```

---

## Contacto

Si el problema persiste:

1. Revisa la documentación oficial: https://nextjs.org/docs
2. Busca en GitHub Issues: https://github.com/vercel/next.js/issues
3. Revisa `README.md` y `ARCHITECTURE.md`

---

## Solución Rápida (Reset Completo)

Si nada funciona, reset completo:

```bash
# 1. Detener servidor (Ctrl+C)

# 2. Limpiar todo
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 3. Reinstalar
npm install

# 4. Ejecutar
npm run dev
```

Esto debería solucionar el 90% de los problemas.
