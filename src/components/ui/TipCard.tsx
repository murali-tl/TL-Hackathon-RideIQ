import type { ReactNode } from 'react'

type TipCardProps = {
  emoji: ReactNode
  title: string
  description: string
  iconBg?: string
}

export function TipCard({ emoji, title, description, iconBg = 'rgba(255,92,26,0.12)' }: TipCardProps) {
  return (
    <div className="mb-2 flex gap-3 rounded-[10px] border border-[var(--rs-border)] bg-[var(--rs-surface2)] p-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
        style={{ background: iconBg }}
        aria-hidden
      >
        {emoji}
      </div>
      <div>
        <div className="text-[13px] font-medium text-[var(--rs-text)]">{title}</div>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--rs-muted)]">{description}</p>
      </div>
    </div>
  )
}
