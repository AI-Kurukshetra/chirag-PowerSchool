'use client'

import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Check, Loader2, Plus, Trash2, UploadCloud } from 'lucide-react'
import { logAction } from '@/lib/log'

export default function StudentsAdmin({ classes, students }: { classes: any[]; students: any[] }) {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [rows, setRows] = useState(students)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<{ id: string; field: 'photo_url' | 'aadhar_url' | 'certificate_url' } | null>(null)
  const [newStudent, setNewStudent] = useState({
    full_name: '',
    email: '',
    birth_date: '',
    previous_school: '',
    father_name: '',
    mother_name: '',
    phone: '',
    medical_info: '',
    guardian_name: '',
    guardian_email: '',
    class_id: classes[0]?.id || '',
  })

  const createStudent = async () => {
    setSaving(true)
    setError(null)
    const { data, error } = await supabase.from('students').insert(newStudent).select().single()
    if (error) {
      setError(error.message)
    } else if (data) {
      setRows((r) => [data, ...r])
      logAction({ action: 'student_created', entity: 'student', entity_id: data.id, meta: { class_id: data.class_id } })
      setNewStudent({ full_name: '', email: '', birth_date: '', previous_school: '', father_name: '', mother_name: '', phone: '', medical_info: '', guardian_name: '', guardian_email: '', class_id: classes[0]?.id || '' })
    }
    setSaving(false)
  }

  const remove = async (id: string) => {
    setSaving(true)
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) setError(error.message)
    else setRows((r) => r.filter((s) => s.id !== id))
    setSaving(false)
  }

  const triggerUpload = (id: string, field: 'photo_url' | 'aadhar_url' | 'certificate_url') => {
    setUploadTarget({ id, field })
    fileInputRef.current?.click()
  }

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadTarget) return
    setSaving(true)
    setError(null)
    const path = `${uploadTarget.id}/${uploadTarget.field}-${Date.now()}-${file.name}`
    const { data, error: uploadError } = await supabase.storage.from('student-docs').upload(path, file, { upsert: true })
    if (uploadError) {
      setError(uploadError.message)
      setSaving(false)
      return
    }
    const { data: updated, error: updateError } = await supabase
      .from('students')
      .update({ [uploadTarget.field]: data?.path || path })
      .eq('id', uploadTarget.id)
      .select()
      .single()
    if (updateError) setError(updateError.message)
    else if (updated) setRows((r) => r.map((row) => (row.id === updated.id ? updated : row)))
    setSaving(false)
    setUploadTarget(null)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <input
            placeholder="Full name"
            value={newStudent.full_name}
            onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          />
          <input
            placeholder="Email"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          />
          <input
            type="date"
            placeholder="Birth date"
            value={newStudent.birth_date}
            onChange={(e) => setNewStudent({ ...newStudent, birth_date: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          />
          <input
            placeholder="Previous school"
            value={newStudent.previous_school}
            onChange={(e) => setNewStudent({ ...newStudent, previous_school: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          />
          <input
            placeholder="Father name"
            value={newStudent.father_name}
            onChange={(e) => setNewStudent({ ...newStudent, father_name: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          />
          <input
            placeholder="Mother name"
            value={newStudent.mother_name}
            onChange={(e) => setNewStudent({ ...newStudent, mother_name: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          />
          <input
            placeholder="Phone"
            value={newStudent.phone}
            onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          />
          <input
            placeholder="Medical info (allergies, notes)"
            value={newStudent.medical_info}
            onChange={(e) => setNewStudent({ ...newStudent, medical_info: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2 min-w-[220px]"
          />
          <input
            placeholder="Guardian name"
            value={newStudent.guardian_name}
            onChange={(e) => setNewStudent({ ...newStudent, guardian_name: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          />
          <input
            placeholder="Guardian email"
            value={newStudent.guardian_email}
            onChange={(e) => setNewStudent({ ...newStudent, guardian_email: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          />
          <select
            value={newStudent.class_id}
            onChange={(e) => setNewStudent({ ...newStudent, class_id: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={createStudent}
            disabled={saving || !newStudent.full_name}
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-midnight font-semibold px-3 py-2 hover:bg-accent/90 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add student
          </button>
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>

      <div className="card p-4 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">Students</p>
            <p className="text-lg font-semibold">{rows.length} total</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="text-white/60 border-b border-white/5">
              <tr className="text-left">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Class</th>
                <th className="py-2 pr-3">Birth</th>
                <th className="py-2 pr-3">Prev school</th>
                <th className="py-2 pr-3">Parents</th>
                <th className="py-2 pr-3">Contact</th>
                <th className="py-2 pr-3">Medical</th>
                <th className="py-2 pr-3">Guardian</th>
                <th className="py-2 pr-3">Docs</th>
                <th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="table-row">
                  <td className="py-3 pr-3 text-white">{s.full_name}</td>
                  <td className="py-3 pr-3 text-white/70">{s.email}</td>
                  <td className="py-3 pr-3 text-white/70">{classes.find((c) => c.id === s.class_id)?.name || ''}</td>
                  <td className="py-3 pr-3 text-white/70">{s.birth_date || '—'}</td>
                  <td className="py-3 pr-3 text-white/70">{s.previous_school || '—'}</td>
                  <td className="py-3 pr-3 text-white/70">{[s.father_name, s.mother_name].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="py-3 pr-3 text-white/70">{s.phone || '—'}</td>
                  <td className="py-3 pr-3 text-white/70">{s.medical_info || '—'}</td>
                  <td className="py-3 pr-3 text-white/70">{s.guardian_name}</td>
                  <td className="py-3 pr-3 text-white/70">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(['photo_url', 'aadhar_url', 'certificate_url'] as const).map((field) => {
                        const label = field === 'photo_url' ? 'Photo' : field === 'aadhar_url' ? 'Aadhar' : 'Cert'
                        const hasFile = Boolean(s[field])
                        return (
                          <button
                            key={field}
                            onClick={() => triggerUpload(s.id, field)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-xs"
                          >
                            {hasFile ? <Check size={12} /> : <UploadCloud size={12} />}
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <button
                      onClick={() => remove(s.id)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 text-danger text-xs"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleUpload}
        accept="image/*,.pdf"
      />
    </div>
  )
}
