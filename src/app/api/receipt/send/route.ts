import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json().catch(() => null)
  const invoiceId = body?.invoiceId as string | undefined

  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
  }

  // Log as best-effort activity entry
  await supabase.from('activity_logs').insert({
    action: 'receipt_sent',
    entity: 'invoice',
    entity_id: invoiceId,
    meta: { via: 'manual-send' },
  })

  // Stubbed email; extend with real email integration if desired
  return NextResponse.json({ ok: true })
}
