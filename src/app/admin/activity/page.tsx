import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { getServerSupabase } from '@/lib/supabaseServer'
import { ActivityFeed } from '@/components/activity-feed'
import { ActivityLog } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/sign-in')
  const role = (session.user.user_metadata as any)?.role || 'teacher'
  if (role !== 'admin') redirect('/')

  const serverSupabase = getServerSupabase()
  const { data: logs } = await serverSupabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <main className="min-h-screen bg-midnight text-white p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Admin • Audit trail</p>
          <h1 className="text-2xl font-semibold">Activity log</h1>
        </div>
        <a href="/" className="text-accent text-sm underline">Back to dashboard</a>
      </div>
      <ActivityFeed logs={(logs as ActivityLog[]) || []} />
    </main>
  )
}
