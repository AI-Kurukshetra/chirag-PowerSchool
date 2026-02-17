'use client'

import { useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, Trash2, Plus } from 'lucide-react'
import { logAction } from '@/lib/log'

export function SubjectsManager({ classes, subjects }: { classes: any[]; subjects: any[] }) {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [classId, setClassId] = useState(classes[0]?.id || '')
  const [localSubjects, setLocalSubjects] = useState(subjects)
  const [newSubject, setNewSubject] = useState('')
  const [saving, setSaving] = useState(false)
  const filtered = localSubjects.filter((s) => s.class_id === classId)

  const addSubject = async () => {
    if (!newSubject.trim()) return
    setSaving(true)
    const payload = { class_id: classId, name: newSubject.trim() }
    const { data, error } = await supabase.from('subjects').insert(payload).select().single()
    if (!error && data) {
      setLocalSubjects((s) => [...s, data])
      logAction({ action: 'subject_created', entity: 'class', entity_id: classId, meta: { name: newSubject } })
      setNewSubject('')
    }
    setSaving(false)
  }

  const remove = async (id: string) => {
    setSaving(true)
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (!error) {
      setLocalSubjects((s) => s.filter((sub) => sub.id !== id))
      logAction({ action: 'subject_deleted', entity: 'subject', entity_id: id })
    }
    setSaving(false)
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Subjects</p>
          <p className="text-lg font-semibold">Per class</p>
        </div>
        <select
          className="rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-white/60 text-sm">No subjects yet.</p>}
        {filtered.map((s) => (
          <div key={s.id} className="flex items-center justify-between border border-white/10 rounded-lg px-3 py-2 text-sm">
            <span>{s.name}</span>
            <button
              onClick={() => remove(s.id)}
              disabled={saving}
              className="text-danger inline-flex items-center gap-1 text-xs"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          placeholder="New subject"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          className="flex-1 rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2"
        />
        <button
          onClick={addSubject}
          disabled={saving || !newSubject.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-accent text-midnight px-3 py-2 text-sm font-semibold hover:bg-accent/90 disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
        </button>
      </div>
    </div>
  )
}
