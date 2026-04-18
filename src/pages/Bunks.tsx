import { useCallback, useMemo, useState } from 'react'
import { BUNK_PLACES } from '../data/bunks'
import { IconTrash } from '../components/icons'
import { Button } from '../components/ui/Button'
import { RsCard } from '../components/ui/RsCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Field, TextInput } from '../components/Form'
import type { BunkPlace } from '../types'
import {
  loadBunkRatings,
  loadCustomBunks,
  removeBunkRating,
  saveCustomBunks,
  setBunkRating,
} from '../utils/bunkStorage'

function Stars({ n, interactive, onPick }: { n: number; interactive?: boolean; onPick?: (s: number) => void }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < n
        const cls = `text-sm ${filled ? 'text-[var(--rs-accent2)]' : 'text-[var(--rs-surface2)]'} ${
          interactive ? 'cursor-pointer transition hover:scale-110' : ''
        }`
        if (interactive && onPick) {
          return (
            <button key={i} type="button" className={cls} onClick={() => onPick(i + 1)}>
              ★
            </button>
          )
        }
        return (
          <span key={i} className={cls}>
            ★
          </span>
        )
      })}
    </div>
  )
}

function nextRank(seed: BunkPlace[], custom: BunkPlace[]) {
  const max = Math.max(0, ...seed.map((b) => b.rank), ...custom.map((b) => b.rank))
  return max + 1
}

export default function Bunks() {
  const [q, setQ] = useState('')
  const [custom, setCustom] = useState<BunkPlace[]>(() => loadCustomBunks())
  const [ratings, setRatings] = useState<Record<string, number>>(() => loadBunkRatings())

  const [addName, setAddName] = useState('')
  const [addLocation, setAddLocation] = useState('')
  const [addStars, setAddStars] = useState(4)

  const [rateForId, setRateForId] = useState<string | null>(null)

  const persistCustom = useCallback((next: BunkPlace[]) => {
    setCustom(next)
    saveCustomBunks(next)
  }, [])

  const merged = useMemo(() => {
    const withUser = [...BUNK_PLACES, ...custom].map((b) => {
      const user = ratings[b.id]
      return user !== undefined ? { ...b, stars: user } : b
    })
    return withUser.sort((a, b) => a.rank - b.rank)
  }, [custom, ratings])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return merged
    return merged.filter((b) => b.name.toLowerCase().includes(s) || b.location.toLowerCase().includes(s))
  }, [q, merged])

  const submitNewBunk = () => {
    const name = addName.trim()
    const location = addLocation.trim()
    if (!name || !location) return
    const id = `user-${crypto.randomUUID()}`
    const row: BunkPlace = {
      id,
      rank: nextRank(BUNK_PLACES, custom),
      name,
      location,
      stars: addStars,
      trust: '—',
      boost: '—',
      reviews: 1,
      accentRank: 'outline',
    }
    persistCustom([...custom, row])
    setBunkRating(id, addStars)
    setRatings((r) => ({ ...r, [id]: addStars }))
    setAddName('')
    setAddLocation('')
    setAddStars(4)
  }

  const submitRating = (bunkId: string, stars: number) => {
    setBunkRating(bunkId, stars)
    setRatings((r) => ({ ...r, [bunkId]: stars }))
    setRateForId(null)
  }

  const removeUserBunk = (b: BunkPlace) => {
    if (!b.id.startsWith('user-')) return
    if (!confirm(`Remove “${b.name}” from your saved bunks?`)) return
    persistCustom(custom.filter((x) => x.id !== b.id))
    removeBunkRating(b.id)
    setRatings((r) => {
      const next = { ...r }
      delete next[b.id]
      return next
    })
    if (rateForId === b.id) setRateForId(null)
  }

  return (
    <div>
      <RsCard className="space-y-3">
        <h2 className="font-[family-name:var(--rs-font-head)] text-base font-semibold text-[var(--rs-text)]">
          Add a bunk (manual location)
        </h2>
        <p className="text-xs text-[var(--rs-muted)]">
          Name the bunk and enter the area or address. Your entry is saved on this device only.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Bunk name" htmlFor="bunk-add-name">
            <TextInput
              id="bunk-add-name"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. HP Petrol Pump"
            />
          </Field>
          <Field label="Location" htmlFor="bunk-add-location">
            <TextInput
              id="bunk-add-location"
              value={addLocation}
              onChange={(e) => setAddLocation(e.target.value)}
              placeholder="Area, street, or landmark"
            />
          </Field>
        </div>
        <div>
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[var(--rs-muted)]">
            Initial rating
          </span>
          <Stars n={addStars} interactive onPick={setAddStars} />
        </div>
        <Button type="button" className="!py-2.5" onClick={submitNewBunk} disabled={!addName.trim() || !addLocation.trim()}>
          Save bunk
        </Button>
      </RsCard>

      <RsCard className="mt-4">
        <label htmlFor="bq" className="sr-only">
          Search bunk
        </label>
        <TextInput
          id="bq"
          placeholder="Search by name or area…"
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
            {ratings[b.id] !== undefined && (
              <p className="mt-1 text-[11px] text-[var(--rs-muted)]">Includes your rating ({ratings[b.id]}★)</p>
            )}
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
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="!min-w-[8rem] !py-2.5 !text-xs" onClick={() => setRateForId(b.id)}>
              Rate this bunk
            </Button>
            <Button
              type="button"
              variant="muted"
              className="!min-w-[8rem] !py-2.5 !text-xs"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.location)}`, '_blank')}
            >
              Open in Maps
            </Button>
            {b.id.startsWith('user-') ? (
              <Button
                type="button"
                variant="muted"
                className="!inline-flex !items-center !gap-1.5 !border-[rgba(255,85,85,0.45)] !py-2.5 !text-xs !text-[var(--rs-red)] hover:!bg-[rgba(255,85,85,0.1)]"
                onClick={() => removeUserBunk(b)}
              >
                <IconTrash className="h-3.5 w-3.5" />
                Remove
              </Button>
            ) : null}
          </div>

          {rateForId === b.id && (
            <div className="mt-3 rounded-[var(--rs-radius-sm)] border border-[var(--rs-accent)] bg-[rgba(255,92,26,0.08)] p-3">
              <p className="text-xs font-medium text-[var(--rs-text)]">Your rating for {b.name}</p>
              <div className="mt-2">
                <Stars n={ratings[b.id] ?? b.stars} interactive onPick={(s) => submitRating(b.id, s)} />
              </div>
              <Button type="button" variant="muted" className="mt-2 !py-2 !text-xs" onClick={() => setRateForId(null)}>
                Done
              </Button>
            </div>
          )}
        </article>
      ))}

      <button
        type="button"
        className="mt-2 w-full cursor-pointer rounded-[var(--rs-radius)] border border-dashed border-[var(--rs-border)] bg-[var(--rs-surface)] p-4 text-center transition hover:border-[var(--rs-accent)]"
        onClick={() => {
          document.getElementById('bunk-add-name')?.focus()
        }}
      >
        <div className="text-xl" aria-hidden>
          📍
        </div>
        <div className="mt-1 font-[family-name:var(--rs-font-head)] text-sm font-semibold text-[var(--rs-text)]">
          Tag a new bunk
        </div>
        <p className="mt-1 text-xs text-[var(--rs-muted)]">Use the form above with a manual location and rating.</p>
      </button>
    </div>
  )
}
