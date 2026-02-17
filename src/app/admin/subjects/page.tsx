import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { getServerSupabase } from '@/lib/supabaseServer'
import { SubjectsManager } from '@/components/subjects-manager'

export const dynamic = 'force-dynamic'

export default async function SubjectsPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/sign-in')
  const role = (session.user.user_metadata as any)?.role || 'teacher'
  if (role !== 'admin') redirect('/')

  const serverSupabase = getServerSupabase()
  const { data: classes } = await serverSupabase.from('classes').select('*').order('name')
  const { data: subjects } = await serverSupabase.from('subjects').select('*')

  return (
    <main className="min-h-screen bg-midnight text-white p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Admin • Subjects</p>
          <h1 className="text-2xl font-semibold">Subject management</h1>
        </div>
        <a href="/" className="text-accent text-sm underline">Back to dashboard</a>
      </div>
      <SubjectsManager classes={classes || []} subjects={subjects || []} />
    </main>
  )
}
