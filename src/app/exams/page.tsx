import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { ExamsBoard } from '@/components/exams'
import { BackButton } from '@/components/back-button'
import { getServerSupabase } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export default async function ExamsPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/sign-in')
  const role = (session.user.user_metadata as any)?.role || 'teacher'
  if (role !== 'teacher' && role !== 'admin') redirect('/')

  const server = getServerSupabase()

  // limit data for teacher to their classes
  let teacherClassIds: string[] = []
  if (role === 'teacher') {
    const { data: tc } = await server.from('teacher_classes').select('class_id').eq('user_id', session.user.id)
    teacherClassIds = tc?.map((t) => t.class_id) || []
  }

  const classesRes = await server.from('classes').select('*').order('name')
  const studentsRes = await server.from('students').select('*').order('full_name')
  const examsRes = await server.from('exams').select('*').order('exam_date', { ascending: false })
  const scoresRes = await server.from('exam_scores').select('*')

  let classes = classesRes.data || []
  let students = studentsRes.data || []
  let exams = examsRes.data || []
  let scores = scoresRes.data || []

  if (role === 'teacher') {
    const tcSet = new Set(teacherClassIds)
    classes = classes.filter((c: any) => tcSet.has(c.id))
    students = students.filter((s: any) => tcSet.has(s.class_id))
    exams = exams.filter((e: any) => tcSet.has(e.class_id))
    const examIds = new Set(exams.map((e: any) => e.id))
    scores = scores.filter((s: any) => examIds.has(s.exam_id))
  }

  return (
    <main className="min-h-screen bg-midnight text-white p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <p className="text-sm text-white/60">Teacher/Admin • Exams</p>
          <h1 className="text-2xl font-semibold">Exam & Results</h1>
        </div>
      </div>
      <ExamsBoard classes={classes} students={students} exams={exams} scores={scores} />
    </main>
  )
}
