'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Loader2, Check, AlertTriangle, CalendarClock, Lock, Unlock } from 'lucide-react'
import { DashboardData } from '@/lib/data'
import { getBrowserSupabase } from '@/lib/supabaseClient'
import { logAction } from '@/lib/log'

const statusOptions = [
  { value: 'present', label: 'Present', color: 'bg-success/15 border-success/30 text-success' },
  { value: 'absent', label: 'Absent', color: 'bg-danger/15 border-danger/30 text-danger' },
  { value: 'tardy', label: 'Tardy', color: 'bg-warning/15 border-warning/30 text-warning' },
  { value: 'excused', label: 'Excused', color: 'bg-accent/15 border-accent/30 text-accent' },
] as const

type Props = {
  data: DashboardData
  userId: string
  role: string
}

type LocalRow = {
  id: string
  student_id: string
  class_id: string
  name: string
  medical_info?: string | null
  status: string
  note?: string
}

export function AttendanceEntry({ data, role }: Props) {
  const supabase = useMemo(() => getBrowserSupabase(), [])
  const today = format(new Date(), 'yyyy-MM-dd')

  const defaultClassId = data.classes[0]?.id
  const [classId, setClassId] = useState(defaultClassId)
  const [date, setDate] = useState(today)

  const [rows, setRows] = useState<LocalRow[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lock, setLock] = useState<{ locked: boolean; lockedBy?: string; lockedAt?: string } | null>(null)
  const [lockSaving, setLockSaving] = useState(false)

  useEffect(() => {
    const scopedStudents = (data.students || []).filter((s) => !classId || s.class_id === classId)
    const scopedAttendance = (data.attendance || []).filter((a) => !classId || a.class_id === classId)

    const newRows: LocalRow[] = scopedStudents.map((s) => {
      const existing = scopedAttendance.find(
        (a) => a.student_id === s.id && a.attendance_date === date
      )
      return {
        id: existing?.id || `${s.id}-${date}`,
        student_id: s.id,
        class_id: s.class_id,
        name: s.full_name,
        medical_info: (s as any).medical_info,
        status: existing?.status || 'present',
        note: existing?.note || '',
      }
    })
    setRows(newRows)
  }, [classId, data.attendance, data.students, date])

  useEffect(() => {
    const fetchLock = async () => {
      const { data: lockRow, error } = await supabase
        .from('attendance_locks')
        .select('*')
        .eq('class_id', classId || '')
        .eq('attendance_date', date)
        .maybeSingle()
      if (!error) {
        setLock(lockRow ? { locked: lockRow.locked, lockedBy: lockRow.locked_by, lockedAt: lockRow.locked_at } : { locked: false })
      }
    }
    if (classId) fetchLock()
  }, [classId, supabase, date])

  const handleStatus = (student_id: string, status: string) => {
    setRows((rows) => rows.map((r) => (r.student_id === student_id ? { ...r, status } : r)))
  }

  const handleBulk = (status: string) => {
    setRows((rows) => rows.map((r) => ({ ...r, status })))
  }

  const handleSave = async () => {
    if (lock?.locked) return
    setSaving(true)
    setMessage(null)
    setError(null)

    const payload = rows.map((r) => {
      const record: any = {
        student_id: r.student_id,
        class_id: r.class_id,
        attendance_date: date,
        status: r.status,
        note: r.note,
      }
      // Only send id when we already have a real one (to update). Otherwise omit to allow default uuid.
      if (r.id && r.id.startsWith('att-') === false && r.id.includes('-')) {
        record.id = r.id
      }
      return record
    })

    const { error } = await supabase.from('attendance_records').upsert(payload, {
      onConflict: 'student_id,attendance_date',
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Saved attendance for today.')
      logAction({
        action: 'attendance_saved',
        entity: 'class',
        entity_id: classId || '',
        meta: { count: payload.length, date },
      })
    }
    setSaving(false)
  }

  const toggleLock = async (lockState: boolean) => {
    if (!classId) return
    setLockSaving(true)
    const payload = {
      class_id: classId,
      attendance_date: date,
      locked: lockState,
      locked_by: lockState ? userId : null,
    }
    const { error } = await supabase.from('attendance_locks').upsert(payload)
    if (!error) {
      setLock({ locked: lockState, lockedBy: userId, lockedAt: new Date().toISOString() })
      logAction({
        action: lockState ? 'attendance_locked' : 'attendance_unlocked',
        entity: 'class',
        entity_id: classId,
        meta: { date },
      })
    }
    setLockSaving(false)
  }

  const classes = role === 'teacher' ? data.classes : data.classes

  return (
    <div className="card p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">{format(new Date(date), 'EEE, MMM d')}</p>
          <h2 className="text-xl font-semibold">Mark attendance</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2"
            value={classId || ''}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value || today)}
          />
          <div className="flex gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleBulk(opt.value)}
                className={`text-xs px-3 py-2 rounded-lg border ${opt.color}`}
                type="button"
              >
                Set all {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="badge bg-white/5 border-white/10 text-white/70">
              Status: {lock?.locked ? 'Locked' : 'Open'}
            </span>
            <button
              type="button"
              onClick={() => toggleLock(!lock?.locked)}
              disabled={lockSaving}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 border text-xs ${
                lock?.locked
                  ? 'border-warning/40 text-warning hover:bg-warning/10'
                  : 'border-success/40 text-success hover:bg-success/10'
              } disabled:opacity-60`}
            >
              {lockSaving ? <Loader2 size={14} className="animate-spin" /> : lock?.locked ? <Unlock size={14} /> : <Lock size={14} />}
              {lock?.locked ? 'Unlock day' : 'Lock day'}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-white/60 border-b border-white/5">
              <tr className="text-left">
                <th className="py-2 pr-3">Student</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Note</th>
              </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.student_id} className="table-row">
                <td className="py-3 pr-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{row.name}</span>
                    {row.medical_info && (
                      <span className="text-xs text-warning flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {row.medical_info}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleStatus(row.student_id, opt.value)}
                        disabled={lock?.locked}
                        className={`text-xs px-3 py-2 rounded-lg border transition ${
                          row.status === opt.value ? `${opt.color} ring-2 ring-white/20` : 'border-white/10 text-white/70'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <input
                    value={row.note || ''}
                    onChange={(e) =>
                      setRows((rows) =>
                        rows.map((r) => (r.student_id === row.student_id ? { ...r, note: e.target.value } : r))
                      )
                    }
                    disabled={lock?.locked}
                    className="w-full rounded-lg bg-[#0F162B] text-white placeholder:text-white/40 border border-white/10 px-3 py-2 focus:border-accent focus:ring-2 focus:ring-accent/30"
                    placeholder="Optional note"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-white/70 flex items-center gap-2">
          <CalendarClock size={16} />
          <span>Saving updates for {rows.length} students</span>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-danger text-sm inline-flex items-center gap-1">
              <AlertTriangle size={14} /> {error}
            </span>
          )}
          {message && (
            <span className="text-success text-sm inline-flex items-center gap-1">
              <Check size={14} /> {message}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || lock?.locked}
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-midnight font-semibold px-4 py-3 hover:bg-accent/90 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {lock?.locked ? 'Locked' : saving ? 'Saving...' : 'Save attendance'}
          </button>
        </div>
      </div>
    </div>
  )
}
