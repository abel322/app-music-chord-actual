import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentSongs } from '@/components/dashboard/recent-songs'
import { Library, Clock, TrendingUp, Flame, BookOpen, Target } from 'lucide-react'
import { HistoricalDistribution } from '@/components/dashboard/historical-distribution'
import { cn } from '@/lib/utils'

type Instrument = 'GUITARRA' | 'PIANO' | 'BAJO' | 'BATERIA'



export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  const [totalSongs, recentSongs, completedSessions, totalScheduledCount] = await Promise.all([
    prisma.song.count({ where: { userId: session!.user.id } }),
    prisma.song.findMany({
      where: { userId: session!.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.practiceSession.findMany({
      where: {
        userId: session!.user.id,
        completed: true
      },
      orderBy: { scheduledAt: 'asc' }
    }),
    prisma.practiceSession.count({
      where: {
        userId: session!.user.id
      }
    })
  ])

  // --- STATS CALCULATIONS ---

  // 1. Tiempo Total de Vuelo
  const totalMinutes = completedSessions.reduce((acc, s) => acc + s.duration, 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  // 2. Consistencia Global
  const consistency = totalScheduledCount === 0 ? 0 : Math.round((completedSessions.length / totalScheduledCount) * 100)

  // 3. Racha Actual (Streak)
  let streak = 0
  if (completedSessions.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const dateSet = new Set(
      completedSessions.map(s => {
        const d = new Date(s.scheduledAt)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      })
    )

    // Check starting from today or yesterday
    let checkDate = new Date(today)
    if (!dateSet.has(checkDate.getTime())) {
      checkDate = new Date(yesterday)
    }

    while (dateSet.has(checkDate.getTime())) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

  // 4. Distribución Histórica por Instrumento
  const instruments: Instrument[] = ['GUITARRA', 'PIANO', 'BAJO', 'BATERIA']
  const instrumentMinutes = instruments.reduce((acc, inst) => {
    acc[inst] = 0
    return acc
  }, {} as Record<Instrument, number>)

  completedSessions.forEach(s => {
    const inst = s.instrument as Instrument
    if (instrumentMinutes[inst] !== undefined) {
      instrumentMinutes[inst] += s.duration
    }
  })



  // 5. Enfoque Técnico (Top 3 Ejercicios/Conceptos)
  const exerciseMins: Record<string, number> = {}
  completedSessions.forEach(s => {
    if (s.exerciseType) {
      const type = s.exerciseType.trim()
      exerciseMins[type] = (exerciseMins[type] || 0) + s.duration
    }
  })

  const topExercises = Object.entries(exerciseMins)
    .map(([exercise, minutes]) => ({ exercise, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 3)

  const coreStats = [
    {
      label: 'Biblioteca de Canciones',
      value: `${totalSongs} temas`,
      icon: Library,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      description: 'Total de canciones cargadas'
    },
    {
      label: 'Tiempo Total de Vuelo',
      value: `${totalHours}h ${remainingMinutes}m`,
      icon: Clock,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      description: 'Suma de prácticas completadas'
    },
    {
      label: 'Consistencia Global',
      value: `${consistency}%`,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      description: 'Promedio de cumplimiento'
    },
    {
      label: 'Racha Actual (Streak)',
      value: `${streak} ${streak === 1 ? 'día' : 'días'}`,
      icon: Flame,
      color: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      description: 'Prácticas diarias consecutivas',
      highlight: streak > 0
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Bienvenido, {session!.user.name}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Tu panel de control de práctica y biblioteca musical
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Core Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {coreStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={cn(
                "relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl border p-5 transition-all shadow-sm",
                stat.highlight 
                  ? "border-orange-300 dark:border-orange-850/50 shadow-orange-500/5 ring-1 ring-orange-500/10" 
                  : "border-slate-200 dark:border-slate-800"
              )}
            >
              {stat.highlight && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-yellow-500/0 rounded-full blur-xl pointer-events-none" />
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={cn("p-2 rounded-lg shrink-0", stat.bg)}>
                  <Icon className={cn("w-5 h-5", stat.color, stat.highlight && "animate-pulse")} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-white mb-1">{stat.value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{stat.description}</p>
            </div>
          )
        })}
      </div>

      {/* Deep Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Historical Distribution Card */}
        <HistoricalDistribution instrumentMinutes={instrumentMinutes} />

        {/* Technical Focus Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Enfoque Técnico</h3>
              <p className="text-xs text-slate-500">Ejercicios y conceptos más entrenados (Top 3)</p>
            </div>
          </div>

          {topExercises.length > 0 ? (
            <div className="space-y-3.5">
              {topExercises.map((item, idx) => {
                const hrs = Math.floor(item.minutes / 60)
                const mins = item.minutes % 60
                
                return (
                  <div 
                    key={item.exercise} 
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white capitalize truncate max-w-[180px]">{item.exercise}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Concepto de Práctica</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                        {hrs > 0 ? `${hrs}h ` : ''}{mins}m
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
              <BookOpen className="w-8 h-8 mb-2 opacity-55" />
              <p className="text-sm italic">Aún no has registrado ejercicios técnicos.</p>
              <p className="text-xs mt-1">Completa prácticas en tu agenda para ver tu progreso.</p>
            </div>
          )}
        </div>

      </div>

      {/* Recent Songs */}
      <RecentSongs songs={recentSongs} />
    </div>
  )
}
