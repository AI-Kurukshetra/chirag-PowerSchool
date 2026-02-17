'use client'

import { useState, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'teacher',
    invite: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  const inviteCode = process.env.NEXT_PUBLIC_SIGNUP_INVITE_CODE

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (inviteCode && form.invite.trim() !== inviteCode) {
      setError('Invalid invite code. Contact an admin for access.')
      return
    }

    setStatus('loading')
    const { error: signErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, role: form.role },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (signErr) {
      setStatus('error')
      setError(signErr.message)
      return
    }

    setStatus('success')
    router.replace('/')
  }

  return (
    <div className="relative min-h-screen bg-midnight text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-success/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,179,255,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(69,212,131,0.18),transparent_32%),linear-gradient(135deg,rgba(22,31,61,0.9),rgba(11,16,33,0.95))]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
              <Sparkles size={14} className="text-accent" />
              Join PowerSchool Workspace
            </div>
            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">Create your staff account.</h1>
            <p className="text-white/70 text-lg max-w-2xl">
              Invite-only access for school staff. Use your work email to request entry. New accounts can be
              given admin, teacher, or finance roles.
            </p>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <UserPlus size={16} className="text-accent" />
              <span>Already have an account? <Link href="/sign-in" className="text-accent hover:underline">Sign in</Link></span>
            </div>
          </div>

          <div className="card p-6 lg:p-8 backdrop-blur bg-twilight/80 border border-white/10 shadow-2xl">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm text-white/70 mb-1">Full name</label>
                <input
                  className="w-full rounded-lg bg-[#0F162B] text-white placeholder:text-white/50 border border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/30 px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Work email</label>
                <input
                  type="email"
                  className="w-full rounded-lg bg-[#0F162B] text-white placeholder:text-white/50 border border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/30 px-3 py-2"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full rounded-lg bg-[#0F162B] text-white placeholder:text-white/50 border border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/30 px-3 py-2"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Role</label>
                <select
                  className="w-full rounded-lg bg-[#0F162B] text-white border border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/30 px-3 py-2"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="teacher">Teacher</option>
                  <option value="finance">Finance</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Invite code</label>
                <input
                  className="w-full rounded-lg bg-[#0F162B] text-white placeholder:text-white/50 border border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/30 px-3 py-2"
                  value={form.invite}
                  onChange={(e) => setForm({ ...form, invite: e.target.value })}
                  placeholder={inviteCode ? 'Enter provided code' : 'Optional'}
                  required={Boolean(inviteCode)}
                />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}
              {status === 'success' && <p className="text-sm text-success">Account created. Redirecting...</p>}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-midnight font-semibold px-4 py-3 hover:bg-accent/90 disabled:opacity-60"
              >
                {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                {status === 'loading' ? 'Creating...' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
