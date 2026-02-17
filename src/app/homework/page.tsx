import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { HomeworkBoard } from '@/components/homework'
import { BackButton } from '@/components/back-button'
import { getServerSupabase } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export default async function HomeworkPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/sign-in')
  const role = (session.user.user_metadata as any)?.role || 'teacher'
  if (role !== 'teacher' && role !== 'admin') {
    redirect('/')
  }

  const serverSupabase = getServerSupabase()
  const [{ data: classes }, { data: students }, { data: homeworks }, { data: submissions }] = await Promise.all([
    serverSupabase.from('classes').select('*').order('name'),
    serverSupabase.from('students').select('*').order('full_name'),
    serverSupabase.from('homeworks').select('*').order('due_date', { ascending: true }),
    serverSupabase.from('homework_submissions').select('*').order('submitted_at', { ascending: false }),
  ])

  return (
    <main className="min-h-screen bg-midnight text-white p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <p className="text-sm text-white/60">Teacher/Admin • Homework</p>
          <h1 className="text-2xl font-semibold">Homework & Assignments</h1>
        </div>
      </div>
      <HomeworkBoard
        classes={classes || []}
        students={students || []}
        homeworks={homeworks || []}
        submissions={submissions || []}
      />
    </main>
  )
}
