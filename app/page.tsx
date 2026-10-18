import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  Music, 
  Search, 
  Repeat, 
  Library, 
  Activity, 
  ArrowRight, 
  Lock, 
  Layers, 
  FileText, 
  Sparkles,
  PlayCircle,
  Sliders,
  CheckCircle2
} from 'lucide-react'
import { Metronome } from '@/components/practice/metronome'

export const metadata = {
  title: 'MusicChord - Biblioteca Abierta de Canciones, Acordes y Partituras Lead Sheet',
  description: 'Explora libremente el catálogo completo de canciones con cifrado armónico de compases, letras con teleprompter, transposición instantánea y metrónomo interactivo.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-primary-500/20">
      {/* Header Superior */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="container mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-900/20 group-hover:scale-105 transition-transform">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                MusicChord
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                Acceso Abierto
              </span>
            </div>
          </Link>

          {/* Enlaces de Navegación Rápida */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link 
              href="/dashboard/songs/chords" 
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5"
            >
              <Music className="w-4 h-4 text-primary-500" />
              <span>Acordes</span>
            </Link>
            <Link 
              href="/dashboard/songs/lyrics" 
              className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-purple-500" />
              <span>Letras</span>
            </Link>
            <Link 
              href="/dashboard/chords" 
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Progresiones</span>
            </Link>
            <Link 
              href="/dashboard/practice" 
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Metrónomo</span>
            </Link>
          </nav>

          {/* Acciones de la Cabecera */}
          <div className="flex gap-2.5 sm:gap-3 items-center">
            <ThemeToggle />
            
            {/* Botón directo: Ver Acordes */}
            <Link href="/dashboard/songs/chords">
              <Button 
                variant="gradient" 
                size="sm"
                className="font-bold shadow-md shadow-primary-900/20 text-xs sm:text-sm px-3.5 sm:px-4"
              >
                <Music className="w-4 h-4 mr-1.5" />
                <span>Ver Acordes</span>
              </Button>
            </Link>

            {/* Enlace discreto a la derecha: Acceso Admin */}
            <Link 
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              title="Acceso exclusivo para el administrador"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Acceso Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-slate-200/80 dark:border-slate-850">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-primary-500/15 via-indigo-500/15 to-purple-500/15 blur-3xl pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 sm:px-6 relative text-center max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100/70 dark:bg-primary-950/50 border border-primary-200/80 dark:border-primary-800/60 text-primary-700 dark:text-primary-300 text-xs font-bold mb-6 shadow-xs animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-primary-500" />
            <span>Biblioteca Abierta • Sin Registro ni Bloqueos</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            Tu repertorio musical, letras y acordes{' '}
            <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto font-normal leading-relaxed">
            Accede libremente al catálogo de canciones en formato <strong>Lead Sheet de estudio</strong>, compases estructurados, cifrado de acordes, transposición instantánea y herramientas rítmicas profesionales.
          </p>

          {/* Botones Principales de Llamada a la Acción */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto">
            <Link href="/dashboard/songs/chords" className="w-full sm:w-auto">
              <Button 
                variant="gradient" 
                size="lg" 
                className="w-full sm:w-auto text-base font-bold px-7 py-6 shadow-xl shadow-primary-900/25 group"
              >
                <span>Explorar Repertorio / Ver Canciones</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link href="/dashboard/chords" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-base font-bold px-6 py-6 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Layers className="w-5 h-5 mr-2 text-indigo-500" />
                <span>Ver Progresiones</span>
              </Button>
            </Link>
          </div>

          {/* Pills Informativas de Acceso Rápido */}
          <div className="pt-10 flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              4 Compases por Línea
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Transposición Tonal ♭/♯
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Visor de Letras con Prompter
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Metrónomo y Playback en Vivo
            </span>
          </div>
        </div>
      </section>

      {/* Características Principales */}
      <section className="container mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight mb-3">
            Herramientas diseñadas para músicos
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Estudia canciones, ensaya con tu banda y domina la estructura armónica de cada tema con la máxima claridad visual.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Music className="w-6 h-6 text-primary-500" />}
            title="Lead Sheets de Estudio"
            description="Rejilla armónica profesional con compases, divisiones rítmicas de blancas, negras o corcheas y cadencias."
            href="/dashboard/songs/chords"
            cta="Ver Partituras"
          />
          <FeatureCard
            icon={<Repeat className="w-6 h-6 text-indigo-500" />}
            title="Transposición en Vivo"
            description="Sube o baja semitonos con un solo clic. Adapta cualquier canción a tu tesitura vocal o instrumento."
            href="/dashboard/songs/chords"
            cta="Probar Transpositor"
          />
          <FeatureCard
            icon={<FileText className="w-6 h-6 text-purple-500" />}
            title="Visor de Letras & Prompter"
            description="Lee las estrofas y coros con auto-scroll ajustable para ensayos en vivo y presentaciones sin distracciones."
            href="/dashboard/songs/lyrics"
            cta="Ver Modo Letras"
          />
          <FeatureCard
            icon={<Layers className="w-6 h-6 text-pink-500" />}
            title="Catálogo de Progresiones"
            description="Biblioteca de progresiones armónicas en múltiples géneros con reproductor integrado de audio al tempo."
            href="/dashboard/chords"
            cta="Escuchar Progresiones"
          />
        </div>
      </section>

      {/* Sección Interactiva del Metrónomo */}
      <section className="container mx-auto px-4 sm:px-6 py-16 max-w-6xl my-4">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 w-fit">
                <Activity className="w-3.5 h-3.5" />
                <span>Web Audio API de Alta Precisión</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Metrónomo Profesional Integrado
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Prueba nuestro metrónomo interactivo directamente en el navegador. Funciona con el reloj de audio nativo de la tarjeta de sonido, eliminando la latencia y los micro-retrasos típicos de JavaScript para ofrecer un pulso milimétrico.
              </p>
              <ul className="space-y-2.5 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Rango completo de 30 a 280 BPM con Tap Tempo interactivo.
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Cifras de compás: 4/4, 3/4, 2/4, 6/8 y 12/8 con subdivisiones.
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Sincronizado en tiempo real con la reproducción de canciones.
                </li>
              </ul>
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <Link href="/dashboard/songs/chords">
                  <Button variant="gradient" size="lg" className="font-bold text-sm shadow-lg shadow-primary-900/40">
                    <Music className="w-4 h-4 mr-2" />
                    Ver Canciones con Tempo
                  </Button>
                </Link>
                <Link href="/dashboard/practice">
                  <Button variant="secondary" size="lg" className="font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                    <Activity className="w-4 h-4 mr-2 text-emerald-400" />
                    Abrir Pantalla Completa
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex justify-center w-full">
              <Metronome />
            </div>
          </div>
        </div>
      </section>

      {/* Banner de Invitación Directa al Catálogo (Reemplazo de Planes Comerciales) */}
      <section className="container mx-auto px-4 sm:px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-primary-900/20 max-w-5xl mx-auto">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              ¿Listo para estudiar tus canciones favoritas?
            </h2>
            <p className="text-primary-100 text-base sm:text-lg">
              No necesitas crear una cuenta ni ingresar métodos de pago. El catálogo de partituras y acordes está disponible para que comiences ahora mismo.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/dashboard/songs/chords">
                <Button 
                  size="lg" 
                  className="bg-white hover:bg-slate-100 text-primary-700 font-extrabold text-base px-8 py-6 shadow-xl"
                >
                  <Music className="w-5 h-5 mr-2" />
                  Explorar Repertorio Ahora
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="bg-primary-700/50 hover:bg-primary-700 text-white border-primary-400/40 font-semibold text-sm px-5 py-6"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Ingreso para Administrador
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-primary-600" />
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                MusicChord
              </span>
              <span className="text-xs text-slate-400 ml-2">
                • Catálogo Abierto de Estudio Musical
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap justify-center">
              <Link href="/dashboard/songs/chords" className="hover:text-primary-600 transition-colors">
                Canciones (Acordes)
              </Link>
              <Link href="/dashboard/songs/lyrics" className="hover:text-primary-600 transition-colors">
                Letras
              </Link>
              <Link href="/dashboard/chords" className="hover:text-primary-600 transition-colors">
                Progresiones
              </Link>
              <Link href="/dashboard/practice" className="hover:text-primary-600 transition-colors">
                Metrónomo
              </Link>
              <Link href="/login" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Acceso Admin</span>
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-850 text-center text-xs text-slate-400">
            <p>© {new Date().getFullYear()} MusicChord. Plataforma de estudio armónico y lectura musical.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  href, 
  cta 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <Link 
      href={href}
      className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-primary-500/50 dark:hover:border-primary-500/40 transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          {description}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400">
        <span>{cta}</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
}
