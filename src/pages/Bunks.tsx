import { useMemo, useState } from 'react'
import { BUNK_PLACES } from '../data/bunks'
import { Button } from '../components/ui/Button'
import { RsCard } from '../components/ui/RsCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { TextInput } from '../components/Form'

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-sm ${i < n ? 'text-[var(--rs-accent2)]' : 'text-[var(--rs-surface2)]'}`}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function Bunks() {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return BUNK_PLACES
    return BUNK_PLACES.filter((b) => b.name.toLowerCase().includes(s) || b.location.toLowerCase().includes(s))
  }, [q])

  return (
    <div>
      <RsCard>
        <label htmlFor="bq" className="sr-only">
          Search bunk
        </label>
        <TextInput
          id="bq"
          placeholder="Search bunk by name or area…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search bunk by name or area"
        />
      </RsCard>

      <SectionHeading>Community rated · Hyderabad</SectionHeading>

      {list.map((b) => (
        <article
          key={b.id}
          className="relative mb-2.5 rounded-[var(--rs-radius)] border border-[var(--rs-border)] bg-[var(--rs-surface)] p-3.5"
        >
          <div
            className={`absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full font-[family-name:var(--rs-font-head)] text-[13px] font-extrabold text-white ${
              b.accentRank === 'accent'
                ? 'bg-[var(--rs-accent)]'
                : b.accentRank === 'muted'
                  ? 'bg-[var(--rs-muted)]'
                  : 'border border-[var(--rs-border)] bg-[var(--rs-surface2)] text-[var(--rs-muted)]'
            }`}
            aria-label={`Rank ${b.rank}`}
          >
            {b.rank}
          </div>
          <h3 className="pr-12 font-[family-name:var(--rs-font-head)] text-[15px] font-bold text-[var(--rs-text)]">
            {b.name}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--rs-muted)]">📍 {b.location}</p>
          <div className="mt-2">
            <Stars n={b.stars} />
          </div>
          <div className="mt-2.5 flex gap-3.5 text-xs">
            <div>
              {b.trust}
              <span className="mt-0.5 block text-[11px] text-[var(--rs-muted)]">Trust score</span>
            </div>
            <div className="text-[var(--rs-green)]">
              {b.boost}
              <span className="mt-0.5 block text-[11px] text-[var(--rs-muted)]">Mileage boost</span>
            </div>
            <div>
              {b.reviews}
              <span className="mt-0.5 block text-[11px] text-[var(--rs-muted)]">Reviews</span>
            </div>
          </div>
          <div className="mt-2.5 flex gap-2">
            <Button type="button" variant="outline" className="!flex-1 !py-2.5 !text-xs" onClick={() => alert(`Rate ${b.name}`)}>
              Rate this bunk
            </Button>
            <Button type="button" variant="muted" className="!flex-1 !py-2.5 !text-xs" onClick={() => alert(`Navigate to ${b.name}`)}>
              📍 Navigate
            </Button>
          </div>
        </article>
      ))}

      <button
        type="button"
        className="w-full cursor-pointer rounded-[var(--rs-radius)] border border-dashed border-[var(--rs-border)] bg-[var(--rs-surface)] p-4 text-center transition hover:border-[var(--rs-accent)]"
        onClick={() => alert('Tag a new petrol bunk on the community map!')}
      >
        <div className="text-xl" aria-hidden>
          📍
        </div>
        <div className="mt-1 font-[family-name:var(--rs-font-head)] text-sm font-semibold text-[var(--rs-text)]">
          Tag a new bunk
        </div>
        <p className="mt-1 text-xs text-[var(--rs-muted)]">Help riders find trusted fuel near you.</p>
      </button>
    </div>
  )
}
