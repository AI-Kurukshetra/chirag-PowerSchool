import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function BackButton({ href = '/', label = 'Back to dashboard' }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:border-white/20 hover:bg-white/10 transition"
    >
      <ArrowLeft size={14} />
      {label}
    </Link>
  )
}
