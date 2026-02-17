import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { getServerSupabase } from '@/lib/supabaseServer'
import Gradebook from '@/components/gradebook'
import { BackButton } from '@/components/back-button'

export const dynamic = 'force-dynamic'

export default async function GradesPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/sign-in')
  const role = (session.user.user_metadata as any)?.role || 'teacher'
  if (role !== 'teacher' && role !== 'admin') redirect('/')

  const serverSupabase = getServerSupabase()

  let teacherClassIds: string[] | null = null
  if (role === 'teacher') {
    const tc = await serverSupabase.from('teacher_classes').select('class_id').eq('user_id', session.user.id)
    teacherClassIds = tc.data?.map((r: any) => r.class_id) || []
  }

  const classQuery = serverSupabase.from('classes').select('*')
  const { data: classes } = role === 'teacher' && teacherClassIds && teacherClassIds.length
    ? await classQuery.in('id', teacherClassIds)
    : await classQuery

  const studentQuery = serverSupabase.from('students').select('*')
  const { data: students } = role === 'teacher' && teacherClassIds && teacherClassIds.length
    ? await studentQuery.in('class_id', teacherClassIds)
    : await studentQuery

  const subjectQuery = serverSupabase.from('subjects').select('*')
  const { data: subjects } = role === 'teacher' && teacherClassIds && teacherClassIds.length
    ? await subjectQuery.in('class_id', teacherClassIds)
    : await subjectQuery

  const subjectIds = subjects?.map((s: any) => s.id) || []
  const gradeQuery = serverSupabase.from('grades').select('*')
  const { data: grades } =
    subjectIds.length > 0
      ? await gradeQuery.in('subject_id', subjectIds)
      : await gradeQuery.limit(0)

  return (
    <main className="min-h-screen bg-midnight text-white p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <p className="text-sm text-white/60">{role === 'admin' ? 'Admin' : 'Teacher'} • Grades</p>
          <h1 className="text-2xl font-semibold">Gradebook</h1>
        </div>
      </div>
      <Gradebook
        classes={classes || []}
        students={students || []}
        subjects={subjects || []}
        grades={grades || []}
        role={role}
      />
    </main>
  )
}
