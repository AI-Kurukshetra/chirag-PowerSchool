import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { getServerSupabase } from '@/lib/supabaseServer'
import { BackButton } from '@/components/back-button'

export const dynamic = 'force-dynamic'

const requiredEnvs = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

export default async function HealthPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/sign-in')
  const role = (session.user.user_metadata as any)?.role || 'teacher'
  if (role !== 'admin') redirect('/')

  const serverSupabase = getServerSupabase()
  const [classes, students, attendance, invoices, payments] = await Promise.all([
    serverSupabase.from('classes').select('id', { count: 'exact', head: true }),
    serverSupabase.from('students').select('id', { count: 'exact', head: true }),
    serverSupabase.from('attendance_records').select('id', { count: 'exact', head: true }),
    serverSupabase.from('fee_invoices').select('id', { count: 'exact', head: true }),
    serverSupabase.from('payments').select('id', { count: 'exact', head: true }),
  ])

  const envStatus = requiredEnvs.map((key) => ({ key, present: Boolean(process.env[key]) }))

  const cards = [
    { label: 'Classes', count: classes.count ?? 0 },
    { label: 'Students', count: students.count ?? 0 },
    { label: 'Attendance records', count: attendance.count ?? 0 },
    { label: 'Invoices', count: invoices.count ?? 0 },
    { label: 'Payments', count: payments.count ?? 0 },
  ]

  return (
    <main className="min-h-screen bg-midnight text-white p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <p className="text-sm text-white/60">Admin • System check</p>
          <h1 className="text-2xl font-semibold">Health & environment</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-sm text-white/60">{c.label}</p>
            <p className="text-2xl font-semibold">{c.count}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 space-y-3">
        <p className="text-lg font-semibold">Environment keys</p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {envStatus.map((e) => (
            <div key={e.key} className="flex items-center justify-between border border-white/5 rounded-lg px-3 py-2">
              <span className="text-white/70">{e.key}</span>
              <span className={`badge ${e.present ? 'text-success bg-success/10 border-success/30' : 'text-danger bg-danger/10 border-danger/30'}`}>
                {e.present ? 'Present' : 'Missing'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
