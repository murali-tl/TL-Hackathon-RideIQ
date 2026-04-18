import { AiTips } from '../components/AiTips'
import { Badge } from '../components/ui/Badge'
import { RsCard } from '../components/ui/RsCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { TipCard } from '../components/ui/TipCard'
import { speedZones, staticSmartTips } from '../data/tipsContent'

const zoneClass: Record<string, string> = {
  accent: 'bg-[rgba(255,92,26,0.09)] text-[var(--rs-accent)]',
  green: 'border border-[rgba(34,201,122,0.4)] bg-[rgba(34,201,122,0.15)] text-[var(--rs-green)]',
  amber: 'bg-[rgba(255,160,64,0.09)] text-[var(--rs-accent2)]',
  red: 'bg-[rgba(220,50,50,0.08)] text-[var(--rs-red)]',
}

export default function Tips() {
  return (
    <div>
      <RsCard title="Best speed for mileage" action={<Badge tone="accent">125cc bike</Badge>}>
        <div className="flex gap-1.5">
          {speedZones.map((z) => (
            <div
              key={z.range}
              className={`flex-1 rounded-lg px-1.5 py-2 text-center text-[11px] font-medium ${zoneClass[z.tone]} ${
                z.highlight ? 'ring-1 ring-[var(--rs-green)]' : ''
              }`}
            >
              <div className="font-[family-name:var(--rs-font-head)] text-[15px] font-extrabold">{z.range}</div>
              <div>{z.unit}</div>
              <div className={`mt-1 text-[10px] ${z.tone === 'green' ? 'font-bold' : 'text-[var(--rs-muted)]'}`}>
                {z.hint}
              </div>
            </div>
          ))}
        </div>
      </RsCard>

      <SectionHeading>Smart riding tips</SectionHeading>
      {staticSmartTips.map((t) => (
        <TipCard key={t.title} emoji={t.emoji} title={t.title} description={t.body} />
      ))}

      <SectionHeading>Your data</SectionHeading>
      <AiTips />
    </div>
  )
}
