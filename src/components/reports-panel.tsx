import { DashboardData } from '@/lib/data'

export function ReportsPanel({ data }: { data: DashboardData }) {
  const { insights } = data

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Insights</p>
          <p className="text-lg font-semibold">Attendance & fees</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-white/70">Most frequent absences (last 7 days)</p>
        <div className="space-y-2">
          {insights.mostAbsent.length === 0 && <p className="text-white/50 text-sm">No absences recorded.</p>}
          {insights.mostAbsent.map(({ student, absences }) => (
            <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div>
                <p className="font-medium">{student.full_name}</p>
                <p className="text-xs text-white/50">{student.class_id}</p>
              </div>
              <span className="badge bg-danger/20 border-danger/30 text-danger">{absences} absences</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-white/70">Upcoming / overdue fees</p>
        <div className="space-y-2">
          {insights.upcomingDue.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 text-sm">
              <div className="flex flex-col">
                <span className="font-medium">{invoice.description}</span>
                <span className="text-white/50">Due {invoice.due_date}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">${(invoice.amount_cents / 100).toFixed(2)}</p>
                <p className="text-white/50 text-xs">Status: {invoice.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
