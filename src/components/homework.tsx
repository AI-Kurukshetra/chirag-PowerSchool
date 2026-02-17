'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Loader2, Plus, UploadCloud, Check } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabaseClient'
import { logAction } from '@/lib/log'

export type Homework = {
  id: string
  class_id: string
  title: string
  description: string | null
  due_date: string
  attachment_url: string | null
}

export type HomeworkSubmission = {
  id: string
  homework_id: string
  student_id: string
  file_url: string | null
  comments: string | null
  grade: string | null
  status: 'pending' | 'submitted' | 'graded'
  submitted_at: string
}

export function HomeworkBoard({ classes, students, homeworks, submissions }: { classes: any[]; students: any[]; homeworks: Homework[]; submissions: HomeworkSubmission[] }) {
  const supabase = useMemo(() => getBrowserSupabase(), [])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState(homeworks)
  const [subs, setSubs] = useState(submissions)
  const [form, setForm] = useState({
    class_id: classes[0]?.id || '',
    title: '',
    description: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    attachment_file: null as File | null,
  })

  const createHomework = async () => {
    if (!form.title || !form.class_id) return
    setSaving(true)
    setError(null)
    let attachment_url: string | null = null
    if (form.attachment_file) {
      setUploading(true)
      const path = `homework/${crypto.randomUUID()}-${form.attachment_file.name}`
      const { data, error: uploadError } = await supabase.storage.from('homework').upload(path, form.attachment_file, { upsert: true })
      setUploading(false)
      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }
      attachment_url = data?.path || path
    }
    const payload = {
      class_id: form.class_id,
      title: form.title,
      description: form.description,
      due_date: form.due_date,
      attachment_url,
    }
    const { data, error } = await supabase.from('homeworks').insert(payload).select().single()
    if (error) setError(error.message)
    else if (data) {
      setRows((r) => [data, ...r])
      logAction({ action: 'homework_created', entity: 'homework', entity_id: data.id, meta: { class_id: data.class_id } })
      setForm({ class_id: classes[0]?.id || '', title: '', description: '', due_date: format(new Date(), 'yyyy-MM-dd'), attachment_file: null })
    }
    setSaving(false)
  }

  const submitForStudent = async ({
    homework_id,
    student_id,
    file,
    comments,
    status,
  }: {
    homework_id: string
    student_id: string
    file?: File | null
    comments?: string
    status?: 'pending' | 'submitted' | 'graded'
  }) => {
    setSaving(true)
    setError(null)
    let file_url: string | null = null
    if (file) {
      const path = `submissions/${homework_id}/${student_id}-${Date.now()}-${file.name}`
      const { data, error: uploadError } = await supabase.storage.from('homework').upload(path, file, { upsert: true })
      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }
      file_url = data?.path || path
    }
    const payload: any = { homework_id, student_id }
    if (file_url !== null) payload.file_url = file_url
    if (typeof comments === 'string') payload.comments = comments
    if (status) payload.status = status
    const { data, error } = await supabase.from('homework_submissions').upsert(payload).select().single()
    if (error) setError(error.message)
    else if (data) {
      setSubs((s) => {
        const existingIdx = s.findIndex((x) => x.homework_id === homework_id && x.student_id === student_id)
        if (existingIdx >= 0) {
          const copy = [...s]
          copy[existingIdx] = data
          return copy
        }
        return [data, ...s]
      })
      logAction({ action: 'homework_submitted', entity: 'homework', entity_id: homework_id, meta: { student_id } })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="card p-4 space-y-3">
        <p className="text-sm text-white/60">Create homework</p>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <select
            value={form.class_id}
            onChange={(e) => setForm({ ...form, class_id: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2 min-w-[200px]"
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2 min-w-[260px]"
          />
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          />
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded border border-white/10 bg-white/5 cursor-pointer">
            <UploadCloud size={16} />
            {form.attachment_file ? form.attachment_file.name : 'Attach (optional)'}
            <input type="file" className="hidden" onChange={(e) => setForm({ ...form, attachment_file: e.target.files?.[0] || null })} />
          </label>
          <button
            onClick={createHomework}
            disabled={saving || !form.title}
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-midnight font-semibold px-3 py-2 hover:bg-accent/90 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Post homework
          </button>
          {uploading && <span className="text-xs text-white/60">Uploading file…</span>}
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>

      <div className="space-y-4">
        {rows.length === 0 && <p className="text-white/60 text-sm">No homework posted yet.</p>}
        {rows.map((hw) => {
          const className = classes.find((c) => c.id === hw.class_id)?.name || ''
          const due = format(new Date(hw.due_date), 'EEE, MMM d')
          const classStudents = students.filter((s) => s.class_id === hw.class_id)
          return (
            <div key={hw.id} className="card p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-white/60">{className} • Due {due}</p>
                  <h3 className="text-lg font-semibold">{hw.title}</h3>
                  {hw.description && <p className="text-sm text-white/70 max-w-3xl">{hw.description}</p>}
                  {hw.attachment_url && (
                    <a
                      className="text-xs text-accent underline"
                      href={`https://mcp.supabase.com/storage/v1/object/public/homework/${hw.attachment_url}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View attachment
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/60">Submissions</p>
                  <p className="text-lg font-semibold">{subs.filter((s) => s.homework_id === hw.id).length} / {classStudents.length}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-white/60 border-b border-white/5">
                    <tr className="text-left">
                      <th className="py-2 pr-3">Student</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Submission</th>
                      <th className="py-2 pr-3">Note</th>
                      <th className="py-2 pr-3">Set status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((s) => {
                      const sub = subs.find((x) => x.homework_id === hw.id && x.student_id === s.id)
                      return (
                        <tr key={s.id} className="table-row">
                          <td className="py-2 pr-3 text-white">{s.full_name}</td>
                          <td className="py-2 pr-3 text-white/70">
                            {sub?.status === 'graded' ? 'Graded' : sub ? 'Submitted' : 'Pending'}
                            {sub?.submitted_at && (
                              <span className="text-xs text-white/50 ml-2">{format(new Date(sub.submitted_at), 'MMM d, h:mma')}</span>
                            )}
                          </td>
                          <td className="py-2 pr-3">
                            <label className="inline-flex items-center gap-2 px-2 py-1 rounded border border-white/10 bg-white/5 cursor-pointer text-xs">
                              {sub ? <Check size={12} /> : <UploadCloud size={12} />}
                              {sub ? 'Replace file' : 'Upload'}
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => submitForStudent({ homework_id: hw.id, student_id: s.id, file: e.target.files?.[0] })}
                                accept="image/*,.pdf"
                              />
                            </label>
                          </td>
                          <td className="py-2 pr-3">
                            <div className="flex gap-2 items-center">
                              <input
                                defaultValue={sub?.comments || ''}
                                onBlur={(e) =>
                                  submitForStudent({
                                    homework_id: hw.id,
                                    student_id: s.id,
                                    comments: e.target.value,
                                  })
                                }
                                placeholder="Notes / remarks"
                                className="w-full rounded bg-[#0F162B] text-white border border-white/10 px-2 py-2 text-xs"
                              />
                            </div>
                          </td>
                          <td className="py-2 pr-3">
                            <div className="flex gap-2 text-xs">
                              {(['pending', 'submitted', 'graded'] as const).map((st) => (
                                <button
                                  key={st}
                                  onClick={() =>
                                    submitForStudent({
                                      homework_id: hw.id,
                                      student_id: s.id,
                                      status: st,
                                    })
                                  }
                                  className={`px-2 py-1 rounded border ${
                                    sub?.status === st
                                      ? 'border-accent text-accent bg-accent/10'
                                      : 'border-white/10 text-white/70 hover:bg-white/5'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
