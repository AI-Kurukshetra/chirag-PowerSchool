'use client'

import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ActivityLog } from '@/types'

export function ActivityFeed({ logs }: { logs: ActivityLog[] }) {
  const [actionFilter, setActionFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filtered = useMemo(() => {
    return logs
      .filter((l) => (actionFilter ? l.action.includes(actionFilter) : true))
      .filter((l) => (userFilter ? (l.user_id || '').includes(userFilter) : true))
      .filter((l) => (startDate ? l.created_at.slice(0, 10) >= startDate : true))
      .filter((l) => (endDate ? l.created_at.slice(0, 10) <= endDate : true))
  }, [logs, actionFilter, userFilter, startDate, endDate])

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-white/60">Recent changes</p>
          <p className="text-lg font-semibold">Activity log</p>
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <input
            placeholder="Filter action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-2 py-1"
          />
          <input
            placeholder="Filter user id"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-2 py-1"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-2 py-1"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-2 py-1"
          />
          <button
            onClick={() => {
              setActionFilter('')
              setUserFilter('')
              setStartDate('')
              setEndDate('')
            }}
            className="rounded bg-white/5 border border-white/10 px-2 py-1 text-white/80"
            type="button"
          >
            Clear
          </button>
          <span className="badge">{filtered.length} / {logs.length}</span>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        {filtered.length === 0 && <p className="text-white/60">No activity recorded.</p>}
        {filtered.map((log) => (
          <div key={log.id} className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
            <div className="space-y-1">
              <p className="font-medium text-white">{log.action.replaceAll('_', ' ')}</p>
              <p className="text-white/60 text-xs">{log.entity} {log.entity_id || ''}</p>
              {log.meta && (
                <pre className="text-xs text-white/50 bg-white/5 rounded p-2 whitespace-pre-wrap">
                  {JSON.stringify(log.meta, null, 2)}
                </pre>
              )}
            </div>
            <p className="text-white/50 text-xs">
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
