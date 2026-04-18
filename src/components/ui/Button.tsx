import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'muted'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rs-accent)] disabled:pointer-events-none disabled:opacity-50'

const styles: Record<Variant, string> = {
  primary: `${base} bg-[var(--rs-accent)] text-white hover:opacity-[0.92] active:scale-[0.99] font-[family-name:var(--rs-font-head)] tracking-wide`,
  outline: `${base} border border-[var(--rs-accent)] bg-transparent text-[var(--rs-accent)] hover:bg-[rgba(255,92,26,0.08)]`,
  muted: `${base} border border-[var(--rs-border)] bg-[var(--rs-surface2)] text-[var(--rs-text)] hover:border-[var(--rs-accent)]`,
}

/** Primary actions match RideSmart pill CTA styling. */
export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={`${styles[variant]} ${className}`} {...props} />
}
