import { formatDistanceToNow } from 'date-fns'
import { ActivityLog } from '@/types'

const importantActions = new Set([
  'attendance_locked',
  'attendance_unlocked',
  'attendance_unlocked_admin',
  'attendance_saved',
  'invoice_mark_paid',
  'receipt_sent',
  'class_assignments_saved',
  'role_updated',
])

export function ActivityWidget({ logs }: { logs: ActivityLog[] }) {
  const critical = logs.filter((l) => importantActions.has(l.action)).slice(0, 5)

  if (!critical.length) return null

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">Recent admin events</p>
        <a href="/admin/activity" className="text-xs text-accent underline">View all</a>
      </div>
      <div className="space-y-2 text-sm">
        {critical.map((log) => (
          <div key={log.id} className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-medium text-white">{log.action.replaceAll('_', ' ')}</p>
              <p className="text-white/60 text-xs">{log.entity} {log.entity_id || ''}</p>
            </div>
            <p className="text-white/50 text-xs">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
