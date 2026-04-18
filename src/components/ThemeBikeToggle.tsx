import { IconBikeTheme } from './icons'

type Props = {
  onClick: () => void
  className?: string
  iconClassName?: string
  'aria-label'?: string
}

const btnBase =
  'group relative flex shrink-0 touch-manipulation items-center justify-center rounded-2xl border border-[var(--rs-border)] bg-[var(--rs-surface)] text-[var(--rs-text)] shadow-[0_1px_0_rgba(0,0,0,0.06)] transition [transition-property:transform,background-color,border-color,box-shadow] hover:border-[var(--rs-accent)]/50 hover:bg-[var(--rs-surface2)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:scale-[0.96] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)] dark:hover:shadow-[0_2px_12px_rgba(0,0,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rs-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rs-bg)] ' +
  'h-11 min-h-[2.75rem] w-11 min-w-[2.75rem] sm:h-12 sm:min-h-[3rem] sm:w-12 sm:min-w-[3rem]'

const iconBase = 'h-[1.35rem] w-[1.35rem] sm:h-6 sm:w-6'

/** Theme control with a crisp bicycle glyph; avoids heavy filled shapes that read like blobs on dark UI. */
export function ThemeBikeToggle({
  onClick,
  className = btnBase,
  iconClassName = iconBase,
  'aria-label': ariaLabel = 'Toggle light or dark theme',
}: Props) {
  return (
    <button type="button" onClick={onClick} className={className} aria-label={ariaLabel}>
      <IconBikeTheme className={`${iconClassName} text-[var(--rs-text)]`} />
    </button>
  )
}
