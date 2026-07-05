import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/session-provider'
import { ThemeScript } from '@/components/theme-script'

export const metadata: Metadata = {
  title: 'MusicChord - SaaS para Músicos',
  description: 'Guarda, transpone y gestiona tus canciones con cifrado musical',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
