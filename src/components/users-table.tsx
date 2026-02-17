'use client'

import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, ShieldCheck, UploadCloud, XCircle, Check } from 'lucide-react'
import { logAction } from '@/lib/log'

type Profile = {
  user_id: string
  full_name: string | null
  role: string | null
  designation?: string | null
  department?: string | null
  salary_cents?: number | null
  staff_doc_url?: string | null
  resume_url?: string | null
  created_at: string
}

const roleOptions = ['admin', 'teacher', 'finance']

export default function UsersTable({ profiles, staffAttendance }: { profiles: Profile[]; staffAttendance: any[] }) {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [rows, setRows] = useState(profiles)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'teacher', password: 'Welcome123!' })
  const [creating, setCreating] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState(
    () => staffAttendance.reduce((acc, a) => ({ ...acc, [a.user_id]: a.status }), {})
  )
  const uploadRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<{ user_id: string; field: 'staff_doc_url' | 'resume_url' } | null>(null)

  const updateRole = async (user_id: string, role: string) => {
    setSaving(user_id)
    setError(null)
    const { error } = await supabase.from('profiles').update({ role }).eq('user_id', user_id)
    if (error) {
      setError(error.message)
    } else {
      setRows((r) => r.map((p) => (p.user_id === user_id ? { ...p, role } : p)))
      logAction({ action: 'role_updated', entity: 'user', entity_id: user_id, meta: { role } })
    }
    setSaving(null)
  }

  const deactivateUser = async (user_id: string) => {
    setSaving(user_id)
    setError(null)
    const res = await fetch(`/api/admin/users?user_id=${user_id}`, { method: 'DELETE' })
    if (!res.ok) {
      const { error } = await res.json()
      setError(error || 'Failed to deactivate')
    }
    setSaving(null)
  }

  const createUser = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create user')
      const id = json.user?.id
      setRows((r) => [{ user_id: id, full_name: newUser.full_name, role: newUser.role, created_at: new Date().toISOString() }, ...r])
      setNewUser({ email: '', full_name: '', role: 'teacher', password: 'Welcome123!' })
      logAction({ action: 'user_created', entity: 'user', entity_id: id, meta: { role: newUser.role } })
    } catch (e: any) {
      setError(e.message)
    }
    setCreating(false)
  }

  const updateProfile = async (user_id: string, data: Partial<Profile>) => {
    setSaving(user_id)
    setError(null)
    const { error } = await supabase.from('profiles').update(data).eq('user_id', user_id)
    if (error) setError(error.message)
    else setRows((r) => r.map((p) => (p.user_id === user_id ? { ...p, ...data } : p)))
    setSaving(null)
  }

  const markAttendance = async (user_id: string, status: string) => {
    setSaving(user_id)
    setError(null)
    const today = new Date().toISOString().slice(0, 10)
    const payload = { user_id, attendance_date: today, status }
    const { error } = await supabase.from('staff_attendance').upsert(payload, { onConflict: 'user_id,attendance_date' })
    if (error) setError(error.message)
    else setTodayAttendance((a) => ({ ...a, [user_id]: status }))
    setSaving(null)
  }

  const triggerUpload = (user_id: string, field: 'staff_doc_url' | 'resume_url') => {
    setUploadTarget({ user_id, field })
    uploadRef.current?.click()
  }

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadTarget) return
    setSaving(uploadTarget.user_id)
    setError(null)
    const path = `${uploadTarget.user_id}/${uploadTarget.field}-${Date.now()}-${file.name}`
    const { data, error: uploadError } = await supabase.storage.from('staff-docs').upload(path, file, { upsert: true })
    if (uploadError) {
      setError(uploadError.message)
      setSaving(null)
      return
    }
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ [uploadTarget.field]: data?.path || path })
      .eq('user_id', uploadTarget.user_id)
      .select()
      .single()
    if (updateError) setError(updateError.message)
    else if (updated) setRows((r) => r.map((p) => (p.user_id === updated.user_id ? { ...p, ...updated } : p)))
    setSaving(null)
    setUploadTarget(null)
    e.target.value = ''
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Manage staff</p>
          <p className="text-lg font-semibold">Roles & status</p>
        </div>
        <span className="badge">{rows.length} users</span>
      </div>
      <div className="grid sm:grid-cols-4 gap-2 text-sm">
        <input
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
        />
        <input
          placeholder="Full name"
          value={newUser.full_name}
          onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
          className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
        />
        <select
          value={newUser.role}
          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          className="rounded bg-[#0F162B] text-white border border-white/10 px-3 py-2"
        >
          {roleOptions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          onClick={createUser}
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-midnight font-semibold px-3 py-2 hover:bg-accent/90 disabled:opacity-60"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : 'Create user'}
        </button>
      </div>
      {error && <p className="text-danger text-sm">{error}</p>}
      <div className="overflow-x-auto text-sm">
        <table className="min-w-full">
          <thead className="text-white/60 border-b border-white/5">
            <tr className="text-left">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">User ID</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Dept / Title</th>
              <th className="py-2 pr-3">Salary</th>
              <th className="py-2 pr-3">Attendance today</th>
              <th className="py-2 pr-3">Docs</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.user_id} className="table-row">
                <td className="py-3 pr-3 text-white">{p.full_name || '—'}</td>
                <td className="py-3 pr-3 text-white/70 text-xs">{p.user_id}</td>
                <td className="py-3 pr-3">
                  <select
                    value={p.role || 'teacher'}
                    onChange={(e) => updateRole(p.user_id, e.target.value)}
                    disabled={saving === p.user_id}
                    className="rounded-lg bg-[#0F162B] text-white border border-white/10 px-2 py-1 text-xs"
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 pr-3 text-white/80">
                  <div className="flex flex-col gap-1">
                    <input
                      defaultValue={p.department || ''}
                      onBlur={(e) => updateProfile(p.user_id, { department: e.target.value })}
                      placeholder="Department"
                      className="rounded bg-[#0F162B] text-white border border-white/10 px-2 py-1 text-xs"
                    />
                    <input
                      defaultValue={p.designation || ''}
                      onBlur={(e) => updateProfile(p.user_id, { designation: e.target.value })}
                      placeholder="Title"
                      className="rounded bg-[#0F162B] text-white border border-white/10 px-2 py-1 text-xs"
                    />
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <input
                    type="number"
                    defaultValue={p.salary_cents || ''}
                    onBlur={(e) => updateProfile(p.user_id, { salary_cents: Number(e.target.value || 0) })}
                    className="w-28 rounded bg-[#0F162B] text-white border border-white/10 px-2 py-1 text-xs"
                    placeholder="cents"
                  />
                </td>
                <td className="py-3 pr-3">
                  <div className="flex gap-1">
                    {['present', 'absent', 'leave'].map((status) => (
                      <button
                        key={status}
                        onClick={() => markAttendance(p.user_id, status)}
                        disabled={saving === p.user_id}
                        className={`px-2 py-1 rounded text-xs border ${
                          todayAttendance[p.user_id] === status
                            ? 'border-accent text-accent bg-accent/10'
                            : 'border-white/10 text-white/70 hover:bg-white/5'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <div className="flex gap-2 flex-wrap">
                    {(['staff_doc_url', 'resume_url'] as const).map((field) => {
                      const label = field === 'staff_doc_url' ? 'ID/Doc' : 'Resume'
                      const has = Boolean((p as any)[field])
                      return (
                        <button
                          key={field}
                          onClick={() => triggerUpload(p.user_id, field)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-xs"
                        >
                          {has ? <Check size={12} /> : <UploadCloud size={12} />}
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </td>
                <td className="py-3 pr-3 flex items-center gap-2">
                  <a
                    href="https://supabase.com/dashboard/project"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent inline-flex items-center gap-1"
                  >
                    <ShieldCheck size={14} /> Reset password
                  </a>
                  <button
                    onClick={() => deactivateUser(p.user_id)}
                    disabled={saving === p.user_id}
                    className="text-xs inline-flex items-center gap-1 text-danger"
                  >
                    {saving === p.user_id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <input ref={uploadRef} type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf" />
    </div>
  )
}
