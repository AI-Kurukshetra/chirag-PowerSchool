import { FeeTable } from './fee-table'
import { DashboardData } from '@/lib/data'

type Props = {
  data: DashboardData
  role: string
}

export function FeesPageView({ data, role }: Props) {
  return (
    <div className="space-y-4">
      <div className="card p-4 border-white/10 bg-white/5">
        <h2 className="text-xl font-semibold mb-1">Fees & Billing</h2>
        <p className="text-sm text-white/60">Manage invoices, mark payments, export CSV.</p>
      </div>
      <FeeTable data={data} role={role} />
    </div>
  )
}
