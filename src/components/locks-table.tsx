'use client'

import { useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, Unlock } from 'lucide-react'
import { logAction } from '@/lib/log'

type LockRow = {
  class_id: string
  attendance_date: string
  locked: boolean
  locked_by: string | null
  locked_at: string | null
}

type Klass = { id: string; name: string }

export default function LocksTable({ locks, classes }: { locks: LockRow[]; classes: Klass[] }) {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [rows, setRows] = useState(locks)
  const [saving, setSaving] = useState<string | null>(null)

  const className = (id: string) => classes.find((c) => c.id === id)?.name || id

  const unlock = async (lock: LockRow) => {
    setSaving(lock.class_id + lock.attendance_date)
    const { error } = await supabase
      .from('attendance_locks')
      .delete()
      .eq('class_id', lock.class_id)
      .eq('attendance_date', lock.attendance_date)
    if (!error) {
      setRows((r) => r.filter((l) => !(l.class_id === lock.class_id && l.attendance_date === lock.attendance_date)))
      logAction({ action: 'attendance_unlocked_admin', entity: 'class', entity_id: lock.class_id, meta: { date: lock.attendance_date } })
    }
    setSaving(null)
  }

  return (
    <div className="card p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Force unlock days</p>
          <p className="text-lg font-semibold">Locked records</p>
        </div>
        <span className="badge">{rows.length} locks</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="text-white/60 border-b border-white/5">
            <tr className="text-left">
              <th className="py-2 pr-3">Class</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Locked by</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.class_id + l.attendance_date} className="table-row">
                <td className="py-3 pr-3 text-white">{className(l.class_id)}</td>
                <td className="py-3 pr-3 text-white/80">{l.attendance_date}</td>
                <td className="py-3 pr-3 text-white/60 text-xs">{l.locked_by || '—'}</td>
                <td className="py-3 pr-3">
                  <button
                    onClick={() => unlock(l)}
                    disabled={saving === l.class_id + l.attendance_date}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/15 text-white px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-60"
                  >
                    {saving === l.class_id + l.attendance_date ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}
                    Unlock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
