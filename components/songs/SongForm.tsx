'use client'

import React from 'react'
import { LeadSheetBuilder } from '@/components/songs/LeadSheetBuilder'
import type { SongInput } from '@/lib/validations/song'

interface SongFormProps {
  initialData?: Partial<SongInput> & { id?: string }
  isEditing?: boolean
}

/**
 * Componente unificado SongForm con arquitectura de Compases (Lead Sheet),
 * Progresiones Armónicas y Detección de Cadencias.
 */
export function SongForm({ initialData, isEditing = false }: SongFormProps) {
  return <LeadSheetBuilder initialData={initialData as any} isEditing={isEditing} />
}
