import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { AdminClassAssignments } from '@/components/admin-class-assign'
import { getServerSupabase } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export default async function AdminClassesPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/sign-in')
  const role = (session.user.user_metadata as any)?.role || 'teacher'
  if (role !== 'admin') redirect('/')

  const serverSupabase = getServerSupabase()
  const [{ data: classes }, { data: profiles }, { data: mappings }] = await Promise.all([
    serverSupabase.from('classes').select('*').order('name'),
    serverSupabase.from('profiles').select('user_id, full_name, role').eq('role', 'teacher').order('full_name'),
    serverSupabase.from('teacher_classes').select('*'),
  ])

  return (
    <main className="min-h-screen bg-midnight text-white p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Admin • Teacher assignments</p>
          <h1 className="text-2xl font-semibold">Classes & teacher mapping</h1>
        </div>
        <a href="/" className="text-accent text-sm underline">Back to dashboard</a>
      </div>

      <AdminClassAssignments
        classes={classes || []}
        teachers={profiles || []}
        mappings={mappings || []}
      />
    </main>
  )
}
