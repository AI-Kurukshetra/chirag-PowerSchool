import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { loadDashboardData } from '@/lib/data'
import { FeesPageView } from '@/components/fees-page'
import { BackButton } from '@/components/back-button'

export const dynamic = 'force-dynamic'

export default async function FeesPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/sign-in')
  const role = (session.user.user_metadata as any)?.role || 'finance'
  if (role !== 'finance' && role !== 'admin') redirect('/')

  const data = await loadDashboardData(role, session.user.id)

  return (
    <main className="min-h-screen bg-midnight text-white p-6 space-y-6 flex">
      <div className="flex-1 space-y-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <p className="text-sm text-white/60">Finance / Admin</p>
          <h1 className="text-2xl font-semibold">Fees & Billing</h1>
        </div>
      </div>
        <FeesPageView data={data} role={role} />
      </div>
    </main>
  )
}
