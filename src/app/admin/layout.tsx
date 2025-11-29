import { redirect } from 'next/navigation'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user || !hasRole(user.role, 'STAFF')) {
    redirect('/login?redirect=/admin')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar user={user} />
      <main className="lg:pl-64">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
