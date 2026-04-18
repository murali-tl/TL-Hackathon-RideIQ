import type { ReactNode } from 'react'

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2.5 mt-5 font-[family-name:var(--rs-font-head)] text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--rs-muted)] first:mt-0">
      {children}
    </h2>
  )
}
