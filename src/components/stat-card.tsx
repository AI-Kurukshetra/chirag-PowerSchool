import { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import clsx from 'clsx'

export function StatCard({
  title,
  value,
  helper,
  accent,
  icon,
}: {
  title: string
  value: string
  helper?: string
  accent?: 'blue' | 'green' | 'yellow' | 'red'
  icon?: ReactNode
}) {
  const accentClasses = {
    blue: 'from-accent/20 to-accent/5 text-accent border-accent/30',
    green: 'from-success/20 to-success/5 text-success border-success/30',
    yellow: 'from-warning/20 to-warning/5 text-warning border-warning/30',
    red: 'from-danger/20 to-danger/5 text-danger border-danger/30',
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-white/60">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {helper && <p className="text-xs text-white/50">{helper}</p>}
        </div>
        <div
          className={clsx(
            'h-12 w-12 rounded-xl border bg-gradient-to-br flex items-center justify-center',
            accent ? accentClasses[accent] : 'border-white/10 text-white'
          )}
        >
          {icon || <ArrowUpRight size={18} />}
        </div>
      </div>
    </div>
  )
}
