'use client'

import {
  LogOut,
  School,
  LayoutGrid,
  CalendarCheck,
  Receipt,
  GraduationCap,
  NotebookPen,
  CalendarClock,
  ClipboardList,
  Users,
  ActivitySquare,
  HeartPulse,
  Import,
  Shield,
  Lock,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabase } from '@/lib/supabaseClient'

export function NavBar({ email, role }: { email?: string; role?: string }) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = getBrowserSupabase()
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  const navLinks = [
    { label: 'Dashboard', href: '/', icon: LayoutGrid, roles: ['admin', 'teacher', 'finance'] },
    { label: 'Attendance', href: '/attendance', icon: CalendarCheck, roles: ['admin', 'teacher'] },
    { label: 'Fees', href: '/fees', icon: Receipt, roles: ['admin', 'finance'] },
    { label: 'Grades', href: '/grades', icon: GraduationCap, roles: ['admin', 'teacher'] },
    { label: 'Homework', href: '/homework', icon: NotebookPen, roles: ['admin', 'teacher'] },
    { label: 'Timetable', href: '/timetable', icon: CalendarClock, roles: ['admin', 'teacher'] },
    { label: 'Exams', href: '/exams', icon: ClipboardList, roles: ['admin', 'teacher'] },
    { label: 'Students', href: '/admin/students', icon: Users, roles: ['admin'] },
    { label: 'Class assignments', href: '/admin/classes', icon: ClipboardList, roles: ['admin'] },
    { label: 'Subjects', href: '/admin/subjects', icon: NotebookPen, roles: ['admin'] },
    { label: 'Activity log', href: '/admin/activity', icon: ActivitySquare, roles: ['admin'] },
    { label: 'Health', href: '/admin/health', icon: HeartPulse, roles: ['admin'] },
    { label: 'Imports', href: '/admin/import', icon: Import, roles: ['admin'] },
    { label: 'Users', href: '/admin/users', icon: Shield, roles: ['admin'] },
    { label: 'Locks', href: '/admin/locks', icon: Lock, roles: ['admin'] },
  ].filter((l) => (role ? l.roles.includes(role) : true))

  return (
    <aside className="w-64 min-h-screen bg-twilight/80 border-r border-white/5 backdrop-blur px-4 py-6 flex flex-col gap-6 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-accent/20 text-accent flex items-center justify-center">
          <School size={20} />
        </div>
        <div className="leading-tight">
          <p className="text-xs text-white/60">PowerSchool</p>
          <p className="text-lg font-semibold">School Admin</p>
        </div>
      </div>
      <div className="space-y-1 text-sm">
        {navLinks.map((link) => {
          const Icon = link.icon || LayoutGrid
          return (
          <a
            key={link.href}
            href={link.href}
            className="flex items-center justify-between px-3 py-2 rounded-lg border border-transparent text-white/80 hover:border-white/10 hover:bg-white/5"
          >
            <span className="inline-flex items-center gap-2">
              <Icon size={16} />
              {link.label}
            </span>
          </a>
        )})}
      </div>
      <div className="mt-auto pt-4 border-t border-white/5 text-sm text-white/80 space-y-2">
        <div className="flex items-center gap-2">
          {role && <span className="badge bg-white/10 border-white/20 capitalize">{role}</span>}
          <span className="truncate">{email || 'admin@example.com'}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
