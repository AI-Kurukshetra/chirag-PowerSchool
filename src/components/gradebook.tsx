'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Grade } from '@/types'
import { Loader2, Download } from 'lucide-react'

export default function Gradebook({ classes, students, subjects, grades }: {
  classes: any[]
  students: any[]
  subjects: any[]
  grades: Grade[]
}) {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [classId, setClassId] = useState(classes[0]?.id || '')
  const [term, setTerm] = useState('Annual')
  const [localGrades, setLocalGrades] = useState<Grade[]>(grades)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const classSubjects = subjects.filter((s) => s.class_id === classId)
  const classStudents = students.filter((s) => s.class_id === classId)
  const classGrades = localGrades.filter((g) => classSubjects.find((s) => s.id === g.subject_id) && g.term === term)

  const letterFromScore = (score: number, max = 100) => {
    const pct = (score / max) * 100
    if (pct >= 90) return 'A'
    if (pct >= 80) return 'B'
    if (pct >= 70) return 'C'
    if (pct >= 60) return 'D'
    return 'F'
  }

  const getGrade = (studentId: string, subjectId: string) =>
    classGrades.find((g) => g.student_id === studentId && g.subject_id === subjectId)

  const saveGrade = async (student_id: string, subject_id: string, score: number, comments?: string) => {
    setSaving(true)
    setError(null)
    setMessage(null)
    const max_score = 100
    const letter = letterFromScore(score, max_score)
    const payload = { student_id, subject_id, term, score, max_score, letter, comments: comments || null }
    const { data, error } = await supabase.from('grades').upsert(payload).select().single()
    if (error) {
      setError(error.message)
    } else if (data) {
      setLocalGrades((prev) => {
        const without = prev.filter((g) => !(g.student_id === student_id && g.subject_id === subject_id && g.term === term))
        return [data as Grade, ...without]
      })
      setMessage('Saved grade')
    }
    setSaving(false)
  }

  const exportCsv = () => {
    const headers = ['student', 'subject', 'term', 'score', 'max', 'letter', 'comments']
    const rows = classGrades.map((g) => {
      const s = students.find((st) => st.id === g.student_id)
      const subj = subjects.find((sub) => sub.id === g.subject_id)
      return [
        s?.full_name || '',
        subj?.name || '',
        g.term,
        g.score,
        g.max_score,
        g.letter || '',
        (g.comments || '').replace(/,/g, ';'),
      ].join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'grades.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2"
          >
            <option value="Annual">Annual</option>
            <option value="Semi 1">Semi 1</option>
            <option value="Semi 2">Semi 2</option>
          </select>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">Grades</p>
            <p className="text-lg font-semibold">{classStudents.length} students</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge">{classGrades.length} records</span>
            <button
              onClick={exportCsv}
              className="text-xs rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white hover:bg-white/10"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full">
            <thead className="text-white/60 border-b border-white/5">
              <tr className="text-left">
                <th className="py-2 pr-3">Student</th>
                {classSubjects.map((subj) => (
                  <th key={subj.id} className="py-2 pr-3">
                    <div className="flex flex-col">
                      <span>{subj.name}</span>
                      <span className="text-xs text-white/40">Score / Letter</span>
                    </div>
                  </th>
                ))}
                <th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s) => (
                <tr key={s.id} className="table-row">
                  <td className="py-3 pr-3 text-white">{s.full_name}</td>
                  {classSubjects.map((subj) => {
                    const existing = getGrade(s.id, subj.id)
                    return (
                      <td key={subj.id} className="py-3 pr-3 text-white/80">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            defaultValue={existing?.score || ''}
                            placeholder="Score"
                            className="w-20 rounded bg-[#0F162B] text-white border border-white/10 px-2 py-1"
                            onBlur={(e) => {
                              const val = Number(e.target.value)
                              if (!val) return
                              saveGrade(s.id, subj.id, val, existing?.comments || undefined)
                            }}
                          />
                          <span className="badge bg-white/5 border-white/10 text-white/80">
                            {existing?.letter || '-'}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                  <td className="py-3 pr-3 text-right">
                    <button
                      onClick={() => {
                        const studentGrades = classGrades.filter((g) => g.student_id === s.id)
                        const html = `
                          <html><head><meta charset="utf-8"><style>
                            body { font-family: Arial, sans-serif; padding: 24px; color:#0b1021; }
                            table { width:100%; border-collapse: collapse; margin-top:12px; }
                            th, td { border:1px solid #e5e7eb; padding:8px; font-size:14px; }
                            th { background:#f3f4f6; text-align:left; }
                          </style></head><body>
                            <h1>Report Card</h1>
                            <p><strong>Student:</strong> ${s.full_name}</p>
                            <p><strong>Class:</strong> ${classes.find((c) => c.id === classId)?.name || ''}</p>
                            <p><strong>Term:</strong> ${term}</p>
                            <table>
                              <tr><th>Subject</th><th>Score</th><th>Max</th><th>Letter</th><th>Comments</th></tr>
                              ${studentGrades.map(g => {
                                const subj = classSubjects.find(sub => sub.id === g.subject_id)
                                return `<tr><td>${subj?.name || ''}</td><td>${g.score}</td><td>${g.max_score}</td><td>${g.letter || ''}</td><td>${g.comments || ''}</td></tr>`
                              }).join('')}
                            </table>
                          </body></html>
                        `
                        const blob = new Blob([html], { type: 'text/html' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `report-card-${s.full_name || 'student'}.html`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-xs hover:bg-white/10"
                    >
                      <Download size={14} /> Report card
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {saving && <p className="text-white/60 text-sm inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving...</p>}
        {message && <p className="text-success text-sm">{message}</p>}
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>
    </div>
  )
}
