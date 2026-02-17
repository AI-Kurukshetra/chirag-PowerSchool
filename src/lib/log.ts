import { getBrowserSupabase } from '@/lib/supabaseClient'

export async function logAction(params: {
  action: string
  entity?: string
  entity_id?: string
  meta?: Record<string, any>
}) {
  const supabase = getBrowserSupabase()
  const { error } = await supabase.from('activity_logs').insert({
    action: params.action,
    entity: params.entity || null,
    entity_id: params.entity_id || null,
    meta: params.meta || null,
  })
  if (error) console.warn('logAction error', error)
}
