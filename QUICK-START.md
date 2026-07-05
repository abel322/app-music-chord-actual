# ⚡ Quick Start - MusicChord

## 🎯 Estado Actual

```
✅ Dependencias instaladas (454 paquetes)
✅ Código completo (30+ archivos)
✅ Archivo .env creado
⏳ Base de datos pendiente
⏳ App sin ejecutar
```

## 🚀 3 Pasos para Ejecutar

### Paso 1: Configurar Base de Datos (5 min)

**Opción más fácil: Supabase (Gratis)**

1. Ve a https://supabase.com
2. Sign up / Login
3. "New Project"
4. Espera 2 min
5. Settings > Database > Connection String > URI
6. Copia y pega en `.env`:

```env
DATABASE_URL="postgresql://postgres.xxx:password@xxx.supabase.com:5432/postgres"
```

### Paso 2: Sincronizar Base de Datos

```bash
npm run db:push
```

Deberías ver:
```
✔ Generated Prisma Client
✔ Your database is now in sync with your Prisma schema
```

### Paso 3: Ejecutar

```bash
npm run dev
```

Abre: http://localhost:3000

## 🎉 ¡Listo!

Deberías ver la landing page de MusicChord con:
- Header con logo
- Hero section con gradiente
- Features (4 cards)
- Pricing (3 planes)
- Footer

## 🧪 Probar las APIs

### Crear una canción

```bash
curl -X POST http://localhost:3000/api/songs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wonderwall",
    "artist": "Oasis",
    "lyrics": "Em G D A\nToday is gonna be the day",
    "userId": "test-user"
  }'
```

### Transponer acordes

```bash
curl -X POST http://localhost:3000/api/transpose \
  -H "Content-Type: application/json" \
  -d '{
    "lyrics": "C G Am F",
    "fromKey": "C",
    "toKey": "D"
  }'
```

Resultado: `D A Bm G`

## 📊 Comandos Útiles

```bash
# Ver datos en GUI
npm run db:studio

# Build para producción
npm run build

# Ejecutar producción
npm start

# Linting
npm run lint
```

## 🐛 Problemas Comunes

### "Can't reach database server"
→ Verifica DATABASE_URL en `.env`

### "Port 3000 already in use"
→ Cierra otras apps o usa: `PORT=3001 npm run dev`

### "Module not found"
→ Ejecuta: `npm install`

## 📚 Documentación

- `README.md` - Guía completa
- `SETUP-INSTRUCTIONS.md` - Instrucciones detalladas
- `ARCHITECTURE.md` - Arquitectura técnica
- `STATUS.md` - Estado del proyecto

## 🎯 Siguiente Nivel

Una vez funcionando:

1. Explora el código en `app/` y `components/`
2. Modifica la landing page
3. Prueba las APIs
4. Lee la arquitectura
5. Deploy a Vercel

## 💡 Tips

- Usa Prisma Studio para ver los datos: `npm run db:studio`
- Hot reload está activado (cambios en vivo)
- TypeScript te ayudará con autocompletado
- Tailwind CSS para estilos rápidos

---

**¿Listo?** Configura la base de datos y ejecuta `npm run dev` 🚀
