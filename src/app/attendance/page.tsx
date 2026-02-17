import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { AttendanceEntry } from '@/components/attendance-entry'
import { BackButton } from '@/components/back-button'
import { loadDashboardData } from '@/lib/data'
import { getServerSupabase } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/sign-in')

  const role = (session.user.user_metadata as any)?.role || 'teacher'
  if (role !== 'teacher' && role !== 'admin') {
    redirect('/')
  }

  const data = await loadDashboardData(role, session.user.id)

  return (
    <main className="min-h-screen bg-midnight text-white p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <p className="text-sm text-white/60">Fast homeroom check-in</p>
          <h1 className="text-2xl font-semibold">Daily attendance</h1>
        </div>
      </div>
      <AttendanceEntry data={data} userId={session.user.id} role={role} />
    </main>
  )
}
