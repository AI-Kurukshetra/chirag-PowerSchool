import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const getServerSupabase = cache(() => createServerComponentClient({ cookies }))
