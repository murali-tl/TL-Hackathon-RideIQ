import { DotLottieReact } from '@lottiefiles/dotlottie-react'

type Props = {
  className?: string
  label?: string
}

/** Full-area racing bike animation for route and async loading states. */
export function LottieBikeLoading({ className = '', label = 'Loading…' }: Props) {
  return (
    <div
      className={`flex min-h-[40vh] flex-col items-center justify-center gap-4 py-12 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="h-40 w-40 sm:h-48 sm:w-48">
        <DotLottieReact src="/Bike.lottie" loop autoplay className="h-full w-full" />
      </div>
      <p className="text-sm font-medium text-[var(--rs-muted)]">{label}</p>
    </div>
  )
}
