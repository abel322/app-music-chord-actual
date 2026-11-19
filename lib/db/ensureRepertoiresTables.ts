import { prisma } from '@/lib/prisma'

let isInitialized = false

/**
 * Helper idempotente que asegura la existencia de las tablas Repertoire y RepertoireSong
 * en PostgreSQL (Neon DB u otros entornos) antes de que se ejecuten consultas o mutaciones.
 * Previene el fallo "Failed to create repertoire" o listas vacías si la base de datos
 * aún no ha ejecutado la migración de esquema.
 */
export async function ensureRepertoiresTables(): Promise<void> {
  if (isInitialized) return

  try {
    // 1. Tabla Repertoire
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Repertoire" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "eventDate" TIMESTAMP(3),
        "color" TEXT NOT NULL DEFAULT 'indigo',
        "userId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Repertoire_pkey" PRIMARY KEY ("id")
      );
    `)

    // 2. Tabla RepertoireSong
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RepertoireSong" (
        "id" TEXT NOT NULL,
        "repertoireId" TEXT NOT NULL,
        "songId" TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RepertoireSong_pkey" PRIMARY KEY ("id")
      );
    `)

    // 3. Índices
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "RepertoireSong_repertoireId_songId_key" 
      ON "RepertoireSong"("repertoireId", "songId");
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "RepertoireSong_repertoireId_order_idx" 
      ON "RepertoireSong"("repertoireId", "order");
    `)

    // 4. Claves Foráneas con ON DELETE CASCADE
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'RepertoireSong_repertoireId_fkey'
        ) THEN
          ALTER TABLE "RepertoireSong" 
          ADD CONSTRAINT "RepertoireSong_repertoireId_fkey" 
          FOREIGN KEY ("repertoireId") REFERENCES "Repertoire"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `)

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'RepertoireSong_songId_fkey'
        ) THEN
          ALTER TABLE "RepertoireSong" 
          ADD CONSTRAINT "RepertoireSong_songId_fkey" 
          FOREIGN KEY ("songId") REFERENCES "Song"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `)

    isInitialized = true
  } catch (error) {
    // No romper el flujo si la base de datos tiene restricciones de DDL pero las tablas ya existen
    console.error('Aviso en ensureRepertoiresTables:', error)
  }
}
