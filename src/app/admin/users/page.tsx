import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { getServerSupabase } from '@/lib/supabaseServer'
import UsersTable from '@/components/users-table'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/sign-in')
  const role = (session.user.user_metadata as any)?.role || 'teacher'
  if (role !== 'admin') redirect('/')

  const serverSupabase = getServerSupabase()
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: profiles }, { data: staffAttendance }] = await Promise.all([
    serverSupabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false }),
    serverSupabase
      .from('staff_attendance')
      .select('*')
      .eq('attendance_date', today),
  ])

  return (
    <main className="min-h-screen bg-midnight text-white p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Admin • Users</p>
          <h1 className="text-2xl font-semibold">Staff & roles</h1>
        </div>
        <a href="/" className="text-accent text-sm underline">Back to dashboard</a>
      </div>
      <UsersTable profiles={profiles || []} staffAttendance={staffAttendance || []} />
    </main>
  )
}
