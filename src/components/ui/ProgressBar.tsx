type ProgressBarProps = {
  value: number
  fillClass?: string
  labelLeft?: string
  labelRight?: string
}

export function ProgressBar({
  value,
  fillClass = 'bg-[var(--rs-accent)]',
  labelLeft,
  labelRight,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="my-2">
      {(labelLeft || labelRight) && (
        <div className="mb-1.5 flex justify-between text-xs text-[var(--rs-muted)]">
          <span>{labelLeft}</span>
          <span>{labelRight}</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded bg-[var(--rs-surface2)]">
        <div className={`h-full rounded transition-[width] duration-500 ease-out ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
