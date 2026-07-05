# 🎵 MusicChord - SaaS para Músicos

Aplicación web completa para músicos que permite guardar canciones, convertirlas a cifrado musical, transponer tonos y gestionar una biblioteca personal.

## ✨ Características

- 📚 **Biblioteca Personal**: Guarda y organiza todas tus canciones
- 🎼 **Cifrado Musical**: Convierte texto a cifrado con acordes automáticamente
- 🔄 **Transposición**: Cambia la tonalidad de cualquier canción
- 🔍 **Búsqueda Inteligente**: Encuentra canciones por título, artista o tono
- 🎨 **UI Moderna**: Diseño con gradientes y animaciones suaves
- 🌙 **Dark Mode**: Tema oscuro incluido

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Base de Datos**: PostgreSQL
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React

## 🚀 Instalación

### 1. Clonar e instalar dependencias

\`\`\`bash
npm install
\`\`\`

### 2. Configurar variables de entorno

Copia \`.env.example\` a \`.env\` y configura:

\`\`\`bash
cp .env.example .env
\`\`\`

Edita \`.env\` con tus credenciales:

\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/musicchord"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-un-secret-aleatorio"
\`\`\`

### 3. Configurar base de datos

\`\`\`bash
# Crear tablas en la base de datos
npm run db:push

# (Opcional) Abrir Prisma Studio para ver los datos
npm run db:studio
\`\`\`

### 4. Ejecutar en desarrollo

\`\`\`bash
npm run dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

\`\`\`
musicchord/
├── app/
│   ├── api/              # API Routes
│   │   ├── songs/        # CRUD de canciones
│   │   └── transpose/    # Transposición
│   ├── globals.css       # Estilos globales
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Landing page
├── components/
│   └── ui/               # Componentes UI reutilizables
├── lib/
│   ├── chord-parser.ts   # Parser de acordes
│   ├── transpose.ts      # Lógica de transposición
│   ├── prisma.ts         # Cliente Prisma
│   └── utils.ts          # Utilidades
├── prisma/
│   └── schema.prisma     # Schema de base de datos
└── package.json
\`\`\`

## 🎯 Funcionalidades Principales

### 1. Parser de Acordes
Detecta automáticamente acordes en el texto:
- Acordes mayores: C, D, E, F, G, A, B
- Acordes menores: Cm, Dm, Em
- Acordes con extensiones: C7, Dm7, G9

### 2. Transposición
Transpone canciones completas:
\`\`\`typescript
// De C a D (+2 semitonos)
transposeSong(lyrics, 2)

// O especificando tonalidades
getSemitonesBetween('C', 'D') // 2
\`\`\`

### 3. API REST

#### Obtener canciones
\`\`\`bash
GET /api/songs?userId=xxx&search=titulo
\`\`\`

#### Crear canción
\`\`\`bash
POST /api/songs
{
  "title": "Mi Canción",
  "artist": "Artista",
  "lyrics": "C G Am F...",
  "userId": "xxx"
}
\`\`\`

#### Transponer
\`\`\`bash
POST /api/transpose
{
  "lyrics": "C G Am F",
  "fromKey": "C",
  "toKey": "D"
}
\`\`\`

## 🎨 Diseño

### Colores
- Primary: Púrpura (#8b5cf6)
- Secondary: Azul (#3b82f6)
- Gradientes modernos incluidos

### Animaciones
- Fade in al cargar
- Hover effects en cards
- Transiciones suaves

## 📦 Scripts Disponibles

\`\`\`bash
npm run dev          # Desarrollo
npm run build        # Build para producción
npm run start        # Ejecutar producción
npm run lint         # Linter
npm run db:push      # Sincronizar schema con DB
npm run db:studio    # Abrir Prisma Studio
\`\`\`

## 🚀 Deployment

### Vercel (Recomendado)

1. Push a GitHub
2. Conecta con Vercel
3. Configura variables de entorno
4. Deploy automático

### Railway (Base de datos)

1. Crea proyecto en Railway
2. Añade PostgreSQL
3. Copia DATABASE_URL a Vercel

## 📈 Roadmap

- [ ] Autenticación con NextAuth
- [ ] Dashboard de usuario
- [ ] Editor de canciones
- [ ] Exportar a PDF
- [ ] Compartir canciones
- [ ] App móvil (React Native)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (\`git checkout -b feature/nueva-feature\`)
3. Commit cambios (\`git commit -m 'Add nueva feature'\`)
4. Push a la rama (\`git push origin feature/nueva-feature\`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - Libre para uso personal y comercial

## 👨‍💻 Autor

Creado con ❤️ siguiendo el sistema Prompt Maestro

---

**¿Preguntas?** Abre un issue en GitHub
