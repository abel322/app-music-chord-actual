'use client'

import { useState, useMemo, useEffect } from 'react'
import { ProgressPanel } from './progress-panel'
import { WeeklyCalendar } from './weekly-calendar'
import { PracticeHistory } from './practice-history'

interface Session {
  id: string
  instrument: string
  duration: number
  scheduledAt: Date
  completed: boolean
  book?: string | null
  exerciseType?: string | null
  isRecurring?: boolean
  createdAt?: Date | string
}

interface RoutinesClientProps {
  sessions?: Session[]
  initialRoutines?: Session[]
  currentWeek?: string
}

export function RoutinesClient({ sessions, initialRoutines, currentWeek }: RoutinesClientProps) {
  const allSessions = sessions ?? initialRoutines ?? []
  const [currentDate, setCurrentDate] = useState(() => {
    if (currentWeek) {
      const parsed = new Date(currentWeek)
      if (!isNaN(parsed.getTime())) return parsed
    }
    return new Date()
  })
  const [localSessions, setLocalSessions] = useState<Session[]>(allSessions)

  // Sync with prop updates if server revalidates
  useEffect(() => {
    const updated = sessions ?? initialRoutines ?? []
    setLocalSessions(updated)
  }, [sessions, initialRoutines])

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      const fallback = new Date()
      const day = fallback.getDay()
      const diff = fallback.getDate() - day + (day === 0 ? -6 : 1)
      fallback.setDate(diff)
      fallback.setHours(0, 0, 0, 0)
      return fallback
    }
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const startOfWeek = useMemo(() => getStartOfWeek(currentDate), [currentDate])
  
  const endOfWeek = useMemo(() => {
    const d = new Date(startOfWeek)
    d.setDate(d.getDate() + 7)
    return d
  }, [startOfWeek])

  // Filter sessions for the active week (Monday to Sunday)
  const activeWeekSessions = useMemo(() => {
    return localSessions.filter(s => {
      const d = new Date(s.scheduledAt)
      return d >= startOfWeek && d < endOfWeek
    })
  }, [localSessions, startOfWeek, endOfWeek])

  return (
    <>
      <ProgressPanel sessions={activeWeekSessions} />
      
      <WeeklyCalendar 
        sessions={localSessions}
        setSessions={setLocalSessions}
        currentDate={currentDate} 
        setCurrentDate={setCurrentDate} 
      />

      <div className="mt-8 sm:mt-12">
        <PracticeHistory sessions={activeWeekSessions} />
      </div>
    </>
  )
}

export { RoutinesClient as RoutinesClientView }
