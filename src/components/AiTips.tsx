import { Sparkles } from './icons'
import { useRide } from '../hooks/useRide'
import { getSmartTips } from '../utils/aiTips'
import { RsCard } from './ui/RsCard'

type AiTipsProps = {
  /** When set, avoids repeating “AI smart tips” if the page already uses that section title. */
  embedded?: boolean
}

export function AiTips({ embedded = false }: AiTipsProps) {
  const { mileageStats } = useRide()
  const tips = getSmartTips(mileageStats)

  return (
    <RsCard
      title={embedded ? 'Personalized for your bike' : 'AI smart tips'}
      subtitle="On-device rules from your km/L — no cloud calls."
      className="border-[rgba(255,92,26,0.3)] bg-gradient-to-br from-[rgba(255,92,26,0.12)] to-[rgba(255,160,64,0.06)]"
    >
      <ul className="space-y-3">
        {tips.map((tip, i) => (
          <li key={i} className="flex gap-3 text-xs leading-relaxed text-[var(--rs-text)]">
            <span className="mt-0.5 shrink-0 text-[var(--rs-accent)]" aria-hidden>
              <Sparkles className="h-5 w-5" />
            </span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </RsCard>
  )
}
