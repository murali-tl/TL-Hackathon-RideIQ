import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

const fieldClass =
  'w-full rounded-lg border border-[var(--rs-border)] bg-[var(--rs-surface2)] px-3 py-2.5 text-[13px] text-[var(--rs-text)] outline-none transition focus:border-[var(--rs-accent)]'

type FieldProps = {
  label: string
  htmlFor?: string
  hint?: string
  children: ReactNode
}

export function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <div className="mb-2.5 flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-[11px] text-[var(--rs-muted)]">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-[var(--rs-muted)]">{hint}</p> : null}
    </div>
  )
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldClass} ${className}`} {...props} />
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldClass} appearance-none ${className}`} {...props} />
}
