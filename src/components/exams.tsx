'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Loader2, Plus, UploadCloud, Download } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabaseClient'
import { logAction } from '@/lib/log'

function letterFromScore(score: number, max: number) {
  const pct = (score / (max || 100)) * 100
  if (pct >= 90) return 'A'
  if (pct >= 80) return 'B'
  if (pct >= 70) return 'C'
  if (pct >= 60) return 'D'
  return 'F'
}

type Exam = {
  id: string
  class_id: string
  name: string
  exam_type: string
  term: string
  exam_date: string
  max_score: number
}

type ExamScore = {
  id: string
  exam_id: string
  student_id: string
  score: number
  grade: string | null
  comments: string | null
}

type Props = {
  classes: any[]
  students: any[]
  exams: Exam[]
  scores: ExamScore[]
}

export function ExamsBoard({ classes, students, exams, scores }: Props) {
  const supabase = useMemo(() => getBrowserSupabase(), [])
  const [examList, setExamList] = useState(exams)
  const [examScores, setExamScores] = useState(scores)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    class_id: classes[0]?.id || '',
    name: '',
    exam_type: 'unit',
    term: 'Term 1',
    exam_date: format(new Date(), 'yyyy-MM-dd'),
    max_score: 100,
  })
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '')

  const createExam = async () => {
    if (!form.name || !form.class_id) return
    setSaving(true)
    setError(null)
    const { data, error } = await supabase.from('exams').insert(form).select().single()
    if (error) setError(error.message)
    else if (data) {
      setExamList((e) => [data, ...e])
      setSelectedExamId(data.id)
      logAction({ action: 'exam_created', entity: 'exam', entity_id: data.id, meta: { class_id: data.class_id } })
      setForm({ ...form, name: '', exam_date: format(new Date(), 'yyyy-MM-dd') })
    }
    setSaving(false)
  }

  const currentExam = examList.find((e) => e.id === selectedExamId)
  const classStudents = currentExam ? students.filter((s) => s.class_id === currentExam.class_id) : []

  const upsertScores = async () => {
    if (!currentExam) return
    setSaving(true)
    setError(null)
    const payload = classStudents.map((s) => {
      const existing = examScores.find((sc) => sc.exam_id === currentExam.id && sc.student_id === s.id)
      const scoreVal = existing?.score ?? 0
      const grade = letterFromScore(scoreVal, currentExam.max_score)
      return {
        exam_id: currentExam.id,
        student_id: s.id,
        score: scoreVal,
        grade,
        comments: existing?.comments || null,
      }
    })
    const { error } = await supabase.from('exam_scores').upsert(payload)
    if (error) setError(error.message)
    else logAction({ action: 'exam_scores_saved', entity: 'exam', entity_id: currentExam.id, meta: { count: payload.length } })
    setSaving(false)
  }

  const updateScore = (student_id: string, score: number) => {
    setExamScores((prev) => {
      const existing = prev.find((p) => p.exam_id === selectedExamId && p.student_id === student_id)
      const grade = currentExam ? letterFromScore(score, currentExam.max_score) : null
      if (existing) return prev.map((p) => (p === existing ? { ...p, score, grade } : p))
      return [...prev, { id: `${selectedExamId}-${student_id}`, exam_id: selectedExamId, student_id, score, grade, comments: null }]
    })
  }

  const updateComment = (student_id: string, comments: string) => {
    setExamScores((prev) => {
      const existing = prev.find((p) => p.exam_id === selectedExamId && p.student_id === student_id)
      if (existing) return prev.map((p) => (p === existing ? { ...p, comments } : p))
      return [...prev, { id: `${selectedExamId}-${student_id}`, exam_id: selectedExamId, student_id, score: 0, grade: null, comments }]
    })
  }

  const currentScores = examScores.filter((s) => s.exam_id === selectedExamId)
  const ranked = [...currentScores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

  const exportCsv = () => {
    if (!currentExam) return
    const header = 'Student,Score,Grade,Comments\n'
    const rows = classStudents.map((s) => {
      const sc = currentScores.find((x) => x.student_id === s.id)
      return `${s.full_name},${sc?.score ?? ''},${sc?.grade ?? ''},"${(sc?.comments || '').replace(/"/g, '""')}"`
    })
    const csv = header + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentExam.name}-scores.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const printReport = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="card p-4 space-y-3">
        <p className="text-sm text-white/60">Create exam</p>
        <div className="flex flex-wrap gap-2 text-sm items-center">
          <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2">
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2 min-w-[200px]" />
          <select value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2">
            <option value="unit">Unit</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
            <option value="quiz">Quiz</option>
          </select>
          <input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2" />
          <input type="number" min={1} value={form.max_score} onChange={(e) => setForm({ ...form, max_score: Number(e.target.value) })} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2 w-24" />
          <button onClick={createExam} disabled={saving || !form.name} className="inline-flex items-center gap-2 rounded-lg bg-accent text-midnight font-semibold px-3 py-2 hover:bg-accent/90 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add exam
          </button>
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2">
            {examList.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name} • {ex.term}</option>
            ))}
          </select>
          {currentExam && (
            <>
              <span className="text-white/60">{currentExam.exam_type} • {currentExam.max_score} pts • {format(new Date(currentExam.exam_date), 'MMM d')}</span>
              <button onClick={exportCsv} className="inline-flex items-center gap-2 px-3 py-2 rounded border border-white/10 bg-white/5 text-xs">
                <Download size={14} /> Export CSV
              </button>
              <button onClick={printReport} className="inline-flex items-center gap-2 px-3 py-2 rounded border border-white/10 bg-white/5 text-xs">
                <Download size={14} /> Download PDF
              </button>
            </>
          )}
          <button onClick={upsertScores} disabled={saving || !currentExam} className="inline-flex items-center gap-2 rounded-lg bg-accent text-midnight font-semibold px-3 py-2 hover:bg-accent/90 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            Save scores
          </button>
        </div>

        {currentExam ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/60 border-b border-white/5">
                <tr className="text-left">
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Score</th>
                  <th className="py-2 pr-3">Grade</th>
                  <th className="py-2 pr-3">Comments</th>
                  <th className="py-2 pr-3">Rank</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s) => {
                  const sc = currentScores.find((x) => x.student_id === s.id)
                  const rank = ranked.findIndex((r) => r.student_id === s.id) + 1 || ''
                  const grade = sc?.grade || (sc ? letterFromScore(sc.score, currentExam.max_score) : '')
                  return (
                    <tr key={s.id} className="table-row">
                      <td className="py-2 pr-3 text-white">{s.full_name}</td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          value={sc?.score ?? ''}
                          onChange={(e) => updateScore(s.id, Number(e.target.value))}
                          className="w-24 rounded bg-[#0F162B] text-white border border-white/10 px-2 py-2"
                          min={0}
                          max={currentExam.max_score}
                        />
                      </td>
                      <td className="py-2 pr-3 text-white/80">{grade}</td>
                      <td className="py-2 pr-3">
                        <input
                          defaultValue={sc?.comments || ''}
                          onBlur={(e) => updateComment(s.id, e.target.value)}
                          className="w-full rounded bg-[#0F162B] text-white border border-white/10 px-2 py-2"
                          placeholder="Remarks"
                        />
                      </td>
                      <td className="py-2 pr-3 text-white/70">{rank || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-white/60">Create or select an exam to enter scores.</p>
        )}
      </div>
    </div>
  )
}
