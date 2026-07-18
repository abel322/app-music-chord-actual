import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar user={session.user} />
      <main className="flex-1 w-full md:ml-64 p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}
