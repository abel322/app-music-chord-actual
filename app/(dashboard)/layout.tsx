import { getAdminSession } from '@/lib/admin-auth'
import { Sidebar } from '@/components/dashboard/sidebar'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Obtiene el estado de administrador de forma segura sin bloquear a visitantes
  const { isAdmin, user } = await getAdminSession()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row">
      <Sidebar user={user} isAdmin={isAdmin} />
      <main className="flex-1 w-full min-w-0 ml-0 md:ml-64 p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}
