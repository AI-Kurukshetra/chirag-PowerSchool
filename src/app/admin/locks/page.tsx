import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { getServerSupabase } from '@/lib/supabaseServer'
import LocksTable from '@/components/locks-table'

export const dynamic = 'force-dynamic'

export default async function LocksPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/sign-in')
  const role = (session.user.user_metadata as any)?.role || 'teacher'
  if (role !== 'admin') redirect('/')

  const serverSupabase = getServerSupabase()
  const { data: locks } = await serverSupabase
    .from('attendance_locks')
    .select('*')
    .order('attendance_date', { ascending: false })
    .limit(200)

  const { data: classes } = await serverSupabase.from('classes').select('id, name')

  return (
    <main className="min-h-screen bg-midnight text-white p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Admin • Attendance locks</p>
          <h1 className="text-2xl font-semibold">Lock status</h1>
        </div>
        <a href="/" className="text-accent text-sm underline">Back to dashboard</a>
      </div>
      <LocksTable locks={locks || []} classes={classes || []} />
    </main>
  )
}
