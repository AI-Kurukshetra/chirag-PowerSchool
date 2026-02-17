'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, Check, Loader2, Plus } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabaseClient'
import { logAction } from '@/lib/log'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

type Timetable = {
  id: string
  class_id: string
  day_of_week: string
  start_time: string
  end_time: string
  subject: string
  room?: string | null
  teacher_id?: string | null
}

type Profile = { id: string; full_name: string; role?: string }

type Props = {
  classes: any[]
  timetables: Timetable[]
  teachers: Profile[]
}

export function TimetableBoard({ classes, timetables, teachers }: Props) {
  const supabase = useMemo(() => getBrowserSupabase(), [])
  const [rows, setRows] = useState(timetables)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    class_id: classes[0]?.id || '',
    day_of_week: 'Mon',
    start_time: '09:00',
    end_time: '09:45',
    subject: '',
    room: '',
    teacher_id: '',
  })

  const clashes = (draft: Timetable) => {
    return rows.filter((r) => {
      if (r.day_of_week !== draft.day_of_week) return false
      // same class overlapping
      const overlapClass = r.class_id === draft.class_id && overlaps(r.start_time, r.end_time, draft.start_time, draft.end_time)
      // same teacher overlapping
      const overlapTeacher = draft.teacher_id && r.teacher_id === draft.teacher_id && overlaps(r.start_time, r.end_time, draft.start_time, draft.end_time)
      return overlapClass || overlapTeacher
    })
  }

  const add = async () => {
    if (!form.subject || !form.class_id) return
    const draft: Timetable = { id: '', ...form }
    const found = clashes(draft)
    if (found.length) {
      setError('Clash detected: same class or teacher has overlapping time.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = { ...form, teacher_id: form.teacher_id || null }
    const { data, error } = await supabase.from('timetables').insert(payload).select().single()
    if (error) {
      setError(error.message)
    } else if (data) {
      setRows((r) => [...r, data])
      logAction({ action: 'timetable_created', entity: 'timetables', entity_id: data.id, meta: { class_id: data.class_id } })
      setForm({ ...form, subject: '', room: '' })
    }
    setSaving(false)
  }

  const grouped = days.map((d) => ({
    day: d,
    slots: rows.filter((r) => r.day_of_week === d).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }))

  return (
    <div className="space-y-6">
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">Add class period</p>
            <h3 className="text-lg font-semibold">Timetable builder</h3>
          </div>
          {saving && <Loader2 size={18} className="animate-spin text-white/70" />}
        </div>
        <div className="flex flex-wrap gap-2 text-sm items-center">
          <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2">
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2">
            {days.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2" />
          <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2" />
          <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2 min-w-[160px]" />
          <input placeholder="Room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2 w-28" />
          <select value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2">
            <option value="">No teacher</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
          <button onClick={add} disabled={saving || !form.subject} className="inline-flex items-center gap-2 rounded-lg bg-accent text-midnight font-semibold px-3 py-2 hover:bg-accent/90 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add period
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-warning text-sm"><AlertTriangle size={14} /> {error}</div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {grouped.map(({ day, slots }) => (
          <div key={day} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{day}</h3>
              <span className="text-xs text-white/60">{slots.length} periods</span>
            </div>
            {slots.length === 0 && <p className="text-white/60 text-sm">No periods.</p>}
            <div className="space-y-2">
              {slots.map((s) => (
                <div key={s.id} className="rounded border border-white/10 bg-white/5 p-3 text-sm">
                  <div className="flex justify-between">
                    <div className="space-y-1">
                      <p className="text-white font-semibold">{s.subject}</p>
                      <p className="text-white/70">{s.start_time} - {s.end_time} • {classes.find((c) => c.id === s.class_id)?.name}</p>
                      <p className="text-white/60">Room {s.room || 'TBD'}</p>
                      {s.teacher_id && <p className="text-xs text-white/60">Teacher: {teachers.find((t) => t.id === s.teacher_id)?.full_name || '—'}</p>}
                    </div>
                    <span className="text-xs text-success inline-flex items-center gap-1"><Check size={12} /> Scheduled</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd
}
