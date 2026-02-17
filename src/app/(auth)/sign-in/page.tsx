'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Shield, Sparkles } from 'lucide-react'

export default function SignInPage() {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const router = useRouter()

  useEffect(() => {
    // If already signed in, leave immediately
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  return (
    <div className="relative min-h-screen bg-midnight text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-success/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,179,255,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(69,212,131,0.18),transparent_32%),linear-gradient(135deg,rgba(22,31,61,0.9),rgba(11,16,33,0.95))]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
              <Sparkles size={14} className="text-accent" />
              PowerSchool Admin Workspace
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">
                Run attendance, fees, and reports from one clean dashboard.
              </h1>
              <p className="text-white/70 text-lg max-w-2xl">
                Secure control panel for admins, teachers, and finance teams. Sign in to review the latest
                classes, student attendance, and payment status in minutes.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: 'Always on', icon: <Shield size={16} />, desc: 'Protected access for staff' },
                { title: 'Instant login', icon: <CheckCircle2 size={16} />, desc: 'Magic links & passwords' },
                { title: 'Preloaded data', icon: <Sparkles size={16} />, desc: 'Classes & invoices ready' },
              ].map((item) => (
                <div key={item.title} className="card p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <span className="text-accent">{item.icon}</span>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <p className="text-xs text-white/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 lg:p-8 backdrop-blur bg-twilight/80 border border-white/10 shadow-2xl">
            <div className="space-y-2 mb-6">
              <p className="text-sm text-white/60">Secure access</p>
              <h2 className="text-2xl font-semibold">Sign in to continue</h2>
              <p className="text-sm text-white/60">
                Use your school admin email for a magic link or password sign-in.
              </p>
            </div>
            <Auth
              supabaseClient={supabase}
              providers={[]}
              magicLink
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#4FB3FF',
                      brandAccent: '#45D483',
                      inputBackground: '#0F162B',
                      inputBorder: '#23304d',
                      inputText: '#E8ECF7',
                      inputPlaceholder: '#9FB0C8',
                      inputLabelText: '#D9E2F1',
                    },
                  },
                },
                className: {
                  input: 'bg-[#0F162B] text-white placeholder:text-white/50 border border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/30',
                  label: 'text-white/80',
                  button: 'bg-accent text-midnight font-semibold hover:bg-accent/90 rounded-lg',
                },
              }}
              redirectTo="/"
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Work email',
                    password_label: 'Password (if enabled)',
                  },
                },
              }}
            />
            <div className="mt-6 space-y-2 text-xs text-white/60">
              <p>Tip: invite teammates by email from your admin console.</p>
              <p>
                Need an account?{' '}
                <Link href="/sign-up" className="text-accent hover:underline">
                  Request access
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
