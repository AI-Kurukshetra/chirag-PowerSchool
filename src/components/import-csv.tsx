'use client'

import { useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabaseClient'
import { Loader2, Upload } from 'lucide-react'

export function ImportCsv() {
  const supabase = getBrowserSupabase()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parseCsv = (text: string) => {
    const lines = text.trim().split(/\r?\n/)
    const headers = lines.shift()?.split(',').map((h) => h.trim()) || []
    return lines.map((line) => {
      const cells = line.split(',')
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => (obj[h] = cells[i]?.trim()))
      return obj
    })
  }

  const handleImport = async (file: File, kind: 'students' | 'classes') => {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (!rows.length) throw new Error('No rows found')

      if (kind === 'classes') {
        const payload = rows.map((r) => ({
          name: r.name,
          grade: r.grade || '1',
          teacher_name: r.teacher_name || 'TBD',
        }))
        const { error } = await supabase.from('classes').upsert(payload)
        if (error) throw error
      } else {
        const payload = rows.map((r) => ({
          full_name: r.full_name,
          email: r.email || null,
          guardian_name: r.guardian_name || null,
          guardian_email: r.guardian_email || null,
          class_id: r.class_id || null,
        }))
        const { error } = await supabase.from('students').upsert(payload)
        if (error) throw error
      }
      setMessage(`Imported ${rows.length} rows into ${kind}.`)
    } catch (e: any) {
      setError(e?.message || 'Import failed')
    }
    setLoading(false)
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>, kind: 'students' | 'classes') => {
    const file = e.target.files?.[0]
    if (file) handleImport(file, kind)
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">CSV import</p>
          <p className="text-lg font-semibold">Classes & students</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <label className="flex flex-col gap-2 border border-white/10 rounded-lg p-3 hover:border-white/20 cursor-pointer">
          <span className="font-medium">Import classes</span>
          <span className="text-white/60 text-xs">Headers: name, grade, teacher_name</span>
          <div className="flex items-center gap-2 text-accent text-xs">
            <Upload size={14} /> Choose CSV
          </div>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => onFile(e, 'classes')} />
        </label>
        <label className="flex flex-col gap-2 border border-white/10 rounded-lg p-3 hover:border-white/20 cursor-pointer">
          <span className="font-medium">Import students</span>
          <span className="text-white/60 text-xs">Headers: full_name, email, guardian_name, guardian_email, class_id</span>
          <div className="flex items-center gap-2 text-accent text-xs">
            <Upload size={14} /> Choose CSV
          </div>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => onFile(e, 'students')} />
        </label>
      </div>
      {loading && <p className="text-white/60 text-sm inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Importing...</p>}
      {message && <p className="text-success text-sm">{message}</p>}
      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  )
}
