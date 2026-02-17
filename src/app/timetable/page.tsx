import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { TimetableBoard } from '@/components/timetable'
import { BackButton } from '@/components/back-button'
import { getServerSupabase } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export default async function TimetablePage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/sign-in')
  const role = (session.user.user_metadata as any)?.role || 'teacher'
  if (role !== 'teacher' && role !== 'admin') redirect('/')

  const server = getServerSupabase()
  const [classesRes, timetableRes, teacherRes] = await Promise.all([
    server.from('classes').select('*').order('name'),
    server.from('timetables').select('*').order('day_of_week').order('start_time'),
    server.from('profiles').select('id, full_name, role').eq('role', 'teacher'),
  ])

  return (
    <main className="min-h-screen bg-midnight text-white p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <p className="text-sm text-white/60">Teacher/Admin • Timetable</p>
          <h1 className="text-2xl font-semibold">Class & Teacher Timetables</h1>
        </div>
      </div>
      <TimetableBoard
        classes={classesRes.data || []}
        timetables={timetableRes.data || []}
        teachers={teacherRes.data || []}
      />
    </main>
  )
}
