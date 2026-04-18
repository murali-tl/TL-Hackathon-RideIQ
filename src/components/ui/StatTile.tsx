import type { ReactNode } from 'react'

type StatTileProps = {
  label: string
  value: ReactNode
  unit?: string
  footnote?: ReactNode
  footTone?: 'default' | 'green' | 'accent' | 'muted'
}

const foot: Record<NonNullable<StatTileProps['footTone']>, string> = {
  default: 'text-[var(--rs-muted)]',
  green: 'text-[var(--rs-green)]',
  accent: 'text-[var(--rs-accent)]',
  muted: 'text-[var(--rs-muted)]',
}

export function StatTile({ label, value, unit, footnote, footTone = 'default' }: StatTileProps) {
  return (
    <div className="rounded-[10px] border border-[var(--rs-border)] bg-[var(--rs-surface2)] p-3">
      <div className="text-[11px] text-[var(--rs-muted)]">{label}</div>
      <div className="mt-1 font-[family-name:var(--rs-font-head)] text-xl font-bold text-[var(--rs-text)]">
        {value}
        {unit ? <span className="ml-0.5 text-[11px] font-normal text-[var(--rs-muted)]">{unit}</span> : null}
      </div>
      {footnote ? <div className={`mt-1 text-[11px] ${foot[footTone]}`}>{footnote}</div> : null}
    </div>
  )
}
