import type { ChangeEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useState } from 'react'
import { IconEye, IconEyeOff } from './icons'

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

export function TextArea({ className = '', rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={`${fieldClass} min-h-[4.5rem] resize-y ${className}`} {...props} />
}

export type PasswordFieldProps = {
  id: string
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  autoComplete: string
  required?: boolean
  minLength?: number
}

export function PasswordField({ id, label, value, onChange, autoComplete, required, minLength }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <Field label={label} htmlFor={id}>
      <div className="relative">
        <TextInput
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          className="pr-11"
        />
        <button
          type="button"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--rs-muted)] transition hover:bg-[var(--rs-surface2)] hover:text-[var(--rs-text)]"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <IconEyeOff className="h-[18px] w-[18px]" /> : <IconEye className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </Field>
  )
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldClass} appearance-none ${className}`} {...props} />
}
