import type { ReactNode } from 'react'

type Tone = 'accent' | 'green' | 'blue' | 'purple'

const map: Record<Tone, string> = {
  accent: 'bg-[rgba(255,92,26,0.15)] text-[var(--rs-accent2)]',
  green: 'bg-[rgba(34,201,122,0.12)] text-[var(--rs-green)]',
  blue: 'bg-[rgba(77,166,255,0.12)] text-[var(--rs-blue)]',
  purple: 'bg-[rgba(167,139,250,0.12)] text-[var(--rs-purple)]',
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${map[tone]}`}>{children}</span>
  )
}
