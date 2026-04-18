import type { ReactNode } from 'react'

type RsCardProps = {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

/** RideSmart-style elevated panel. */
export function RsCard({ title, subtitle, action, children, className = '' }: RsCardProps) {
  return (
    <section
      className={`mb-3 rounded-[var(--rs-radius)] border border-[var(--rs-border)] bg-[var(--rs-surface)] p-4 ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="mb-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              {title ? (
                <h3 className="font-[family-name:var(--rs-font-head)] text-sm font-semibold tracking-tight text-[var(--rs-text)]">
                  {title}
                </h3>
              ) : null}
              {subtitle ? <p className="mt-1 text-xs text-[var(--rs-muted)]">{subtitle}</p> : null}
            </div>
            {action}
          </div>
        </div>
      )}
      {children}
    </section>
  )
}
