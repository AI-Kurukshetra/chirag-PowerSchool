import { Users, CheckCircle2, CreditCard, BarChart3, BusFront, AlertTriangle } from 'lucide-react'
import { DashboardData } from '@/lib/data'
import { StatCard } from './stat-card'
import { AttendanceTable } from './attendance-table'
import { FeeTable } from './fee-table'
import { ReportsPanel } from './reports-panel'

type Role = 'admin' | 'teacher' | 'finance' | string

export function Dashboard({ data, role }: { data: DashboardData; role: Role }) {
  const { summary } = data

  const currency = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  const canSeeFees = role === 'admin' || role === 'finance'
  const canSeeAttendance = role === 'admin' || role === 'teacher'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <StatCard
          title="Students"
          value={summary.studentCount.toString()}
          helper="Active across all classes"
          accent="blue"
          icon={<Users size={18} />}
        />
        <StatCard
          title="Teachers"
          value={'—'}
          helper="From profiles"
          accent="purple"
          icon={<Users size={18} />}
        />
        {canSeeAttendance && (
          <StatCard
            title="Attendance (7d)"
            value={`${summary.attendanceRate}%`}
            helper="Present rate"
            accent="green"
            icon={<CheckCircle2 size={18} />}
          />
        )}
        {canSeeFees && (
          <StatCard
            title="Outstanding fees"
            value={currency(summary.outstandingAmount)}
            helper={`${summary.overdueCount} overdue invoices`}
            accent="red"
            icon={<CreditCard size={18} />}
          />
        )}
        {canSeeFees && (
          <StatCard
            title="Paid last 30d"
            value={currency(summary.paidThisMonth)}
            helper="Collections"
            accent="yellow"
            icon={<BarChart3 size={18} />}
          />
        )}
        <StatCard
          title="Buses"
          value="—"
          helper="Transport"
          accent="teal"
          icon={<BusFront size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {canSeeAttendance && <AttendanceTable data={data} role={role} />}
        </div>
        <ReportsPanel data={data} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {canSeeFees && (
          <div className="card p-4 space-y-3">
            <h2 className="text-lg font-semibold">Pending fees (top 5)</h2>
            <div className="space-y-2 text-sm">
              {(data.invoices || [])
                .filter((inv) => inv.status !== 'paid')
                .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
                .slice(0, 5)
                .map((inv) => {
                  const student = data.students.find((s) => s.id === inv.student_id)
                  return (
                    <div key={inv.id} className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-white/80">{student?.full_name || 'Student'}</span>
                      <span className="text-accent font-semibold">{currency(inv.amount_cents)}</span>
                    </div>
                  )
                })}
            </div>
            <a className="text-accent underline text-sm" href="/fees">Open fees</a>
          </div>
        )}

        <div className="card p-4 space-y-3">
          <h2 className="text-lg font-semibold">Absent today</h2>
          <div className="flex items-center gap-2 text-warning text-sm">
            <AlertTriangle size={14} /> Showing latest attendance in last 24h
          </div>
          <ul className="space-y-2 text-sm">
            {(data.attendance || [])
              .filter((a) => a.status === 'absent')
              .slice(0, 5)
              .map((a) => {
                const student = data.students.find((s) => s.id === a.student_id)
                return (
                  <li key={`${a.student_id}-${a.attendance_date}`} className="flex items-center justify-between">
                    <span className="text-white/80">{student?.full_name || a.student_id}</span>
                    <span className="text-white/50">{a.attendance_date}</span>
                  </li>
                )
              })}
          </ul>
        </div>
      </div>
    </div>
  )
}
