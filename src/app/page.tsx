import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { NavBar } from '@/components/nav'
import { Dashboard } from '@/components/dashboard'
import { loadDashboardData } from '@/lib/data'
import { ActivityWidget } from '@/components/activity-widget'
import { getServerSupabase } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/sign-in')
  }

  const role = (session.user.user_metadata as any)?.role || 'admin'
  const data = await loadDashboardData(role, session.user.id)

  const serverSupabase = getServerSupabase()
  const today = new Date().toISOString().slice(0, 10)

  const [teacherCountRes, paymentsTodayRes, examsTodayRes] = await Promise.all([
    serverSupabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('role', 'teacher'),
    serverSupabase.from('payments').select('amount_cents').eq('paid_on', today),
    serverSupabase.from('exams').select('*').eq('exam_date', today).limit(5),
  ])

  const teacherCount = teacherCountRes.count || 0
  const paymentsToday = (paymentsTodayRes.data || []).reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0)

  const attendanceToday = data.attendance.filter((a) => a.attendance_date === today)
  const attendanceTodayPct = attendanceToday.length
    ? Math.round((attendanceToday.filter((a) => a.status === 'present').length / attendanceToday.length) * 100)
    : 0
  const absentToday = attendanceToday.filter((a) => a.status === 'absent').map((a) => {
    const student = data.students.find((s) => s.id === a.student_id)
    return student?.full_name || a.student_id
  })

  const pendingFees = (data.invoices || [])
    .filter((inv) => inv.status !== 'paid')
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    .slice(0, 5)

  const examsToday = examsTodayRes.data || []

  let activities: any[] = []
  if (role === 'admin') {
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    activities = logs || []
  }

  return (
    <div className="min-h-screen flex">
      <NavBar email={session.user.email || 'admin'} role={role} />
      <main className="flex-1 p-6 space-y-4">
        {role === 'teacher' && (
          <div className="card border-white/10 bg-accent/10 text-accent px-4 py-3 text-sm">
            Need to update today&apos;s attendance? Go to <a className="underline" href="/attendance">Attendance entry</a>.
          </div>
        )}
        {role === 'admin' && activities.length > 0 && <ActivityWidget logs={activities as any} />}
        <Dashboard data={data} role={role} />
      </main>
    </div>
  )
}
