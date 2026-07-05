import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Music, Search, Repeat, Library, Activity } from 'lucide-react'
import { Metronome } from '@/components/practice/metronome'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Music className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-gradient">MusicChord</span>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button variant="gradient">Comenzar Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Tu biblioteca musical
            <span className="text-gradient"> en la nube</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Guarda canciones, transpone acordes y gestiona tu repertorio musical
            de forma profesional
          </p>
          <Link href="/register">
            <Button variant="gradient" size="lg">
              Comenzar Gratis →
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Library className="w-8 h-8" />}
            title="Biblioteca Personal"
            description="Guarda todas tus canciones organizadas en un solo lugar"
          />
          <FeatureCard
            icon={<Music className="w-8 h-8" />}
            title="Cifrado Musical"
            description="Convierte texto a cifrado con acordes automáticamente"
          />
          <FeatureCard
            icon={<Repeat className="w-8 h-8" />}
            title="Transposición"
            description="Cambia la tonalidad de cualquier canción al instante"
          />
          <FeatureCard
            icon={<Search className="w-8 h-8" />}
            title="Búsqueda Rápida"
            description="Encuentra canciones por título, artista o tonalidad"
          />
        </div>
      </section>

      {/* Interactive Metronome Section */}
      <section className="container mx-auto px-4 py-16 bg-gray-100/30 dark:bg-gray-800/10 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 max-w-6xl my-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-semibold px-3 py-1 rounded-full bg-primary-100/50 dark:bg-primary-950/30 border border-primary-200/30 dark:border-primary-800/30 w-fit">
              <Activity className="w-3.5 h-3.5" />
              <span>Herramientas Profesionales</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight">
              Metrónomo Avanzado de Alta Precisión
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Prueba nuestro metrónomo interactivo directamente en la página principal. Desarrollado utilizando la <strong>Web Audio API</strong>, evita los micro-retrasos de los temporizadores tradicionales de JavaScript y se ejecuta directamente en la tarjeta de sonido de tu dispositivo para garantizar una precisión milimétrica.
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Rango completo de 30 a 280 BPM con Tap Tempo interactivo.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Múltiples opciones de compás y subdivisiones complejas.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Timbres ajustables: Madera (analógico), Digital y Campana.
              </li>
            </ul>
            <div className="pt-2">
              <Link href="/register">
                <Button variant="gradient" size="lg">
                  Comenzar Gratis Ahora →
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex justify-center w-full">
            <Metronome />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Planes</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            name="Free"
            price="$0"
            features={[
              '10 canciones',
              'Transposición básica',
              'Búsqueda simple',
            ]}
          />
          <PricingCard
            name="Pro"
            price="$9"
            features={[
              'Canciones ilimitadas',
              'Transposición avanzada',
              'Búsqueda inteligente',
              'Exportar PDF',
              'Sin anuncios',
            ]}
            highlighted
          />
          <PricingCard
            name="Enterprise"
            price="Custom"
            features={[
              'Todo de Pro',
              'API access',
              'Soporte prioritario',
              'Integraciones',
            ]}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© 2024 MusicChord. Hecho con ❤️ para músicos.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="text-primary-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}

function PricingCard({ name, price, features, highlighted }: any) {
  return (
    <div className={`p-8 rounded-xl border-2 ${
      highlighted 
        ? 'border-primary-600 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 scale-105' 
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <div className="text-4xl font-bold mb-6">
        {price}<span className="text-lg text-gray-600">/mes</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature: string, i: number) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-primary-600">✓</span>
            {feature}
          </li>
        ))}
      </ul>
      <Button 
        variant={highlighted ? 'gradient' : 'secondary'} 
        className="w-full"
      >
        Comenzar
      </Button>
    </div>
  )
}
