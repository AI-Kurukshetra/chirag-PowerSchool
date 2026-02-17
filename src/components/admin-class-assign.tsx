'use client'

import { useMemo, useState } from 'react'
import { Loader2, Check, AlertTriangle } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabaseClient'

export function AdminClassAssignments({ classes, teachers, mappings }: {
  classes: any[]
  teachers: any[]
  mappings: any[]
}) {
  const supabase = useMemo(() => getBrowserSupabase(), [])
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '')
  const [state, setState] = useState({ saving: false, message: '', error: '' })
  const [localMappings, setLocalMappings] = useState(mappings)
  const [teacherFilter, setTeacherFilter] = useState('')

  // Teacher-centric batch assign
  const [batchTeacher, setBatchTeacher] = useState(teachers[0]?.user_id || '')
  const [batchClassIds, setBatchClassIds] = useState<string[]>([])

  const currentMappings = localMappings.filter((m) => m.class_id === selectedClass)
  const selectedTeacherIds = currentMappings.map((m) => m.user_id)

  const toggleTeacher = (user_id: string) => {
    const exists = selectedTeacherIds.includes(user_id)
    let next = localMappings.filter((m) => !(m.class_id === selectedClass && m.user_id === user_id))
    if (!exists) next = [...next, { class_id: selectedClass, user_id }]
    setLocalMappings(next)
  }

  const handleSave = async () => {
    setState({ saving: true, message: '', error: '' })
    const toSave = localMappings
    const { error } = await supabase.from('teacher_classes').upsert(toSave)
    if (error) {
      setState({ saving: false, message: '', error: error.message })
    } else {
      setState({ saving: false, message: 'Saved mappings.', error: '' })
      // best-effort log
      const className = classes.find((c) => c.id === selectedClass)?.name
      supabase.from('activity_logs').insert({
        action: 'class_assignments_saved',
        entity: 'class',
        entity_id: selectedClass,
        meta: { class: className, teachers: toSave.filter((m) => m.class_id === selectedClass).map((m) => m.user_id) }
      })
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p className="text-sm text-white/60">Assign teachers to classes</p>
          <h2 className="text-xl font-semibold">Class mapping</h2>
        </div>
        <select
          className="rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          placeholder="Search teachers"
          value={teacherFilter}
          onChange={(e) => setTeacherFilter(e.target.value)}
          className="rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {teachers.length === 0 && (
          <div className="text-sm text-white/60">
            No teachers found. Create users (role=teacher) or rerun seed, then refresh.
          </div>
        )}
        {teachers
          .filter((t) =>
            teacherFilter
              ? (t.full_name || '').toLowerCase().includes(teacherFilter.toLowerCase()) ||
                t.user_id.includes(teacherFilter)
              : true
          )
          .map((t) => {
          const active = selectedTeacherIds.includes(t.user_id)
          return (
            <button
              key={t.user_id}
              type="button"
              onClick={() => toggleTeacher(t.user_id)}
              className={`text-left rounded-xl border p-4 transition ${
                active
                  ? 'border-accent/50 bg-accent/10 text-white'
                  : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.full_name || 'Unnamed'}</p>
                  <p className="text-xs text-white/60">{t.user_id}</p>
                </div>
                {active && <span className="badge bg-accent/20 border-accent/40 text-accent text-xs">Assigned</span>}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-white/70 flex items-center gap-2">
          <span>Selected class has {selectedTeacherIds.length} teacher(s) assigned.</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {state.error && (
            <span className="text-danger inline-flex items-center gap-1"><AlertTriangle size={14} />{state.error}</span>
          )}
          {state.message && (
            <span className="text-success inline-flex items-center gap-1"><Check size={14} />{state.message}</span>
          )}
          <button
            onClick={handleSave}
            disabled={state.saving}
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-midnight font-semibold px-4 py-3 hover:bg-accent/90 disabled:opacity-60"
          >
            {state.saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {state.saving ? 'Saving...' : 'Save mappings'}
          </button>
        </div>
      </div>

      <div className="border-t border-white/5 pt-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-white/60">Batch assign by teacher</p>
            <p className="text-lg font-semibold">Select classes for a teacher</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2"
            value={batchTeacher}
            onChange={(e) => setBatchTeacher(e.target.value)}
          >
            {teachers.map((t) => (
              <option key={t.user_id} value={t.user_id}>
                {t.full_name || t.user_id}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => {
              const active = batchClassIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setBatchClassIds((ids) =>
                      active ? ids.filter((id) => id !== c.id) : [...ids, c.id]
                    )
                  }
                  className={`text-xs px-3 py-2 rounded-lg border ${
                    active ? 'border-accent/50 bg-accent/10 text-white' : 'border-white/10 bg-white/5 text-white/70'
                  }`}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => {
              setState({ saving: true, message: '', error: '' })
              // Build new mappings for this teacher
              const others = localMappings.filter((m) => m.user_id !== batchTeacher)
              const teacherRows = batchClassIds.map((cid) => ({ user_id: batchTeacher, class_id: cid }))
              const next = [...others, ...teacherRows]
              setLocalMappings(next)
              supabase.from('teacher_classes').upsert(next).then(({ error }) => {
                if (error) setState({ saving: false, message: '', error: error.message })
                else setState({ saving: false, message: 'Saved teacher assignments.', error: '' })
              })
            }}
            disabled={state.saving || !batchTeacher || batchClassIds.length === 0}
            className="text-xs inline-flex items-center gap-2 rounded-lg bg-accent text-midnight px-3 py-2 font-semibold hover:bg-accent/90 disabled:opacity-60"
          >
            {state.saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save teacher classes
          </button>
        </div>
      </div>
    </div>
  )
}
