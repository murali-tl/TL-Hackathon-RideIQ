import { useCallback, useEffect, useMemo, useState } from 'react'
import { BUNK_PLACES } from '../data/bunks'
import { IconTrash } from '../components/icons'
import { Button } from '../components/ui/Button'
import { RsCard } from '../components/ui/RsCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Field, TextArea, TextInput } from '../components/Form'
import type { BunkComment, BunkPlace } from '../types'
import {
  addBunkCommentApi,
  createBunkApi,
  deleteBunkApi,
  fetchAllBunkComments,
  fetchBunks,
  rateBunkApi,
} from '../api/bunksApi'
import {
  appendBunkComment,
  loadBunkComments,
  loadBunkRatings,
  loadCustomBunks,
  removeBunkRating,
  removeCommentsForBunk,
  saveCustomBunks,
  setBunkRating,
} from '../utils/bunkStorage'

const SEED_BUNK_IDS = new Set(BUNK_PLACES.map((b) => b.id))

/** Maps search: name + area so Google targets the bunk, not only the neighbourhood. */
function googleMapsSearchQuery(b: Pick<BunkPlace, 'name' | 'location'>): string {
  const name = b.name.trim()
  const loc = b.location.trim()
  if (!name && !loc) return ''
  if (!loc) return name
  if (!name) return loc
  return `${name} ${loc}`.replace(/\s+/g, ' ')
}

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

function formatCommentTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function Bunks() {
  const [q, setQ] = useState('')
  const [custom, setCustom] = useState<BunkPlace[]>(() => loadCustomBunks())
  const [ratings, setRatings] = useState<Record<string, number>>(() => loadBunkRatings())

  const [serverList, setServerList] = useState<BunkPlace[] | null>(null)
  const [useApi, setUseApi] = useState<boolean | null>(null)

  const [addName, setAddName] = useState('')
  const [addLocation, setAddLocation] = useState('')
  const [addStars, setAddStars] = useState(4)
  const [addInitialComment, setAddInitialComment] = useState('')

  const [comments, setComments] = useState<BunkComment[]>([])
  const [draftComment, setDraftComment] = useState<Record<string, string>>({})

  const [rateForId, setRateForId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchBunks()
      .then((rows) => {
        if (!cancelled) {
          setServerList(rows)
          setUseApi(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerList(null)
          setUseApi(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (useApi !== true) return
    let cancelled = false
    fetchAllBunkComments()
      .then((rows) => {
        if (!cancelled) setComments(rows)
      })
      .catch(() => {
        if (!cancelled) setComments([])
      })
    return () => {
      cancelled = true
    }
  }, [useApi])

  useEffect(() => {
    if (useApi !== false) return
    setComments(loadBunkComments())
  }, [useApi])

  const persistCustom = useCallback((next: BunkPlace[]) => {
    setCustom(next)
    saveCustomBunks(next)
  }, [])

  const merged = useMemo(() => {
    const base = useApi && serverList ? serverList : [...BUNK_PLACES, ...custom]
    const withUser =
      useApi === true
        ? base
        : base.map((b) => {
            const user = ratings[b.id]
            return user !== undefined ? { ...b, stars: user } : b
          })
    return withUser.sort((a, b) => a.rank - b.rank)
  }, [useApi, serverList, custom, ratings])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return merged
    return merged.filter((b) => b.name.toLowerCase().includes(s) || b.location.toLowerCase().includes(s))
  }, [q, merged])

  const canRemove = useCallback(
    (b: BunkPlace) => {
      if (useApi === true) return !SEED_BUNK_IDS.has(b.id)
      return b.id.startsWith('user-')
    },
    [useApi],
  )

  const submitNewBunk = async () => {
    const name = addName.trim()
    const location = addLocation.trim()
    if (!name || !location) return
    const initial = addInitialComment.trim()

    if (useApi === true) {
      try {
        const row = await createBunkApi({
          name,
          location,
          stars: addStars,
          initialComment: initial || undefined,
        })
        setServerList((prev) =>
          prev ? [...prev, row].sort((a, b) => a.rank - b.rank) : [row],
        )
        const nextComments = await fetchAllBunkComments()
        setComments(nextComments)
        setAddName('')
        setAddLocation('')
        setAddStars(4)
        setAddInitialComment('')
        return
      } catch {
        /* fall through to local */
      }
    }

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
    if (initial) {
      appendBunkComment({
        id: `local-${crypto.randomUUID()}`,
        bunkId: id,
        text: initial.slice(0, 2000),
        createdAt: new Date().toISOString(),
      })
      setComments(loadBunkComments())
    }
    setAddName('')
    setAddLocation('')
    setAddStars(4)
    setAddInitialComment('')
  }

  const postCommentOnBunk = async (bunkId: string) => {
    const raw = (draftComment[bunkId] ?? '').trim()
    if (!raw) return
    const text = raw.slice(0, 2000)

    if (useApi === true) {
      try {
        const created = await addBunkCommentApi(bunkId, text)
        setComments((prev) => [...prev, created])
        setDraftComment((d) => ({ ...d, [bunkId]: '' }))
        return
      } catch {
        /* local fallback */
      }
    }
    appendBunkComment({
      id: `local-${crypto.randomUUID()}`,
      bunkId,
      text,
      createdAt: new Date().toISOString(),
    })
    setComments(loadBunkComments())
    setDraftComment((d) => ({ ...d, [bunkId]: '' }))
  }

  const submitRating = async (bunkId: string, stars: number) => {
    if (useApi === true) {
      try {
        const updated = await rateBunkApi(bunkId, stars)
        setServerList((prev) => (prev ? prev.map((b) => (b.id === updated.id ? updated : b)) : prev))
        setRateForId(null)
        return
      } catch {
        /* local fallback */
      }
    }
    setBunkRating(bunkId, stars)
    setRatings((r) => ({ ...r, [bunkId]: stars }))
    setRateForId(null)
  }

  const removeUserBunk = async (b: BunkPlace) => {
    if (!canRemove(b)) return
    if (!confirm(`Remove “${b.name}” from your saved bunks?`)) return

    if (useApi === true) {
      try {
        await deleteBunkApi(b.id)
        setServerList((prev) => (prev ? prev.filter((x) => x.id !== b.id) : prev))
        setComments((prev) => prev.filter((c) => c.bunkId !== b.id))
        removeBunkRating(b.id)
        setRatings((r) => {
          const next = { ...r }
          delete next[b.id]
          return next
        })
        if (rateForId === b.id) setRateForId(null)
        return
      } catch {
        /* fall through */
      }
    }

    persistCustom(custom.filter((x) => x.id !== b.id))
    removeCommentsForBunk(b.id)
    setComments(loadBunkComments())
    removeBunkRating(b.id)
    setRatings((r) => {
      const next = { ...r }
      delete next[b.id]
      return next
    })
    if (rateForId === b.id) setRateForId(null)
  }

  const storageHint =
    useApi === null
      ? 'Checking bunks API…'
      : useApi === true
        ? 'Listings sync with the RideIQ bunks API when the backend is running.'
        : 'API unavailable — new bunks and ratings stay on this device only.'

  return (
    <div>
      <RsCard className="space-y-3">
        <h2 className="font-[family-name:var(--rs-font-head)] text-base font-semibold text-[var(--rs-text)]">
          Add a bunk (manual location)
        </h2>
        <p className="text-xs text-[var(--rs-muted)]">{storageHint}</p>
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
        <Field label="Comment (optional)" htmlFor="bunk-add-comment" hint="Shown with this bunk for everyone on this device; with API on, shared via backend.">
          <TextArea
            id="bunk-add-comment"
            value={addInitialComment}
            onChange={(e) => setAddInitialComment(e.target.value)}
            placeholder="e.g. Good pressure, accepts UPI…"
            maxLength={2000}
            rows={3}
          />
        </Field>
        <Button type="button" className="!py-2.5" onClick={() => void submitNewBunk()} disabled={!addName.trim() || !addLocation.trim()}>
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

      {list.map((b) => {
        const thread = comments
          .filter((c) => c.bunkId === b.id)
          .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())
        return (
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
            <Stars n={Math.min(5, Math.max(0, Math.round(b.stars)))} />
            {useApi === true && b.averageRating != null && (b.ratingCount ?? 0) > 0 ? (
              <p className="mt-1 text-[11px] text-[var(--rs-muted)]">
                Community avg <span className="font-semibold text-[var(--rs-text)]">{b.averageRating.toFixed(2)}</span>★
                from {b.ratingCount} rating{(b.ratingCount ?? 0) === 1 ? '' : 's'}
                {b.commentCount != null ? ` · ${b.commentCount} comment${b.commentCount === 1 ? '' : 's'}` : ''}
              </p>
            ) : null}
            {useApi !== true && ratings[b.id] !== undefined && (
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

          <div className="mt-3 border-t border-[var(--rs-border)] pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--rs-muted)]">Comments</p>
            {thread.length > 0 ? (
              <ul className="mb-3 max-h-48 space-y-2 overflow-y-auto text-xs">
                {thread.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-[var(--rs-border)] bg-[var(--rs-surface2)] px-2.5 py-2 text-[var(--rs-text)]"
                  >
                    <p className="whitespace-pre-wrap break-words">{c.text}</p>
                    <p className="mt-1 text-[10px] text-[var(--rs-muted)]">{formatCommentTime(c.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-2 text-[11px] text-[var(--rs-muted)]">No comments yet — add one below.</p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label htmlFor={`bunk-cmt-${b.id}`} className="sr-only">
                  Add comment for {b.name}
                </label>
                <TextArea
                  id={`bunk-cmt-${b.id}`}
                  placeholder="Share a tip or experience…"
                  value={draftComment[b.id] ?? ''}
                  onChange={(e) => setDraftComment((d) => ({ ...d, [b.id]: e.target.value }))}
                  rows={2}
                  maxLength={2000}
                  className="!py-2 !text-xs"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="!shrink-0 !py-2.5 !text-xs"
                onClick={() => void postCommentOnBunk(b.id)}
                disabled={!(draftComment[b.id] ?? '').trim()}
              >
                Post comment
              </Button>
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
              onClick={() => {
                const query = googleMapsSearchQuery(b)
                if (!query) return
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
                  '_blank',
                )
              }}
            >
              Open in Maps
            </Button>
            {canRemove(b) ? (
              <Button
                type="button"
                variant="muted"
                className="!inline-flex !items-center !gap-1.5 !border-[rgba(255,85,85,0.45)] !py-2.5 !text-xs !text-[var(--rs-red)] hover:!bg-[rgba(255,85,85,0.1)]"
                onClick={() => void removeUserBunk(b)}
              >
                <IconTrash className="h-3.5 w-3.5" />
                Remove
              </Button>
            ) : null}
          </div>

          {rateForId === b.id && (
            <div className="mt-3 rounded-[var(--rs-radius-sm)] border border-[var(--rs-accent)] bg-[rgba(255,92,26,0.08)] p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-[var(--rs-text)]">Your rating for {b.name}</p>
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-1 text-[var(--rs-muted)] transition hover:bg-[var(--rs-surface)] hover:text-[var(--rs-text)]"
                  aria-label="Close rating"
                  onClick={() => setRateForId(null)}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    ×
                  </span>
                </button>
              </div>
              <div className="mt-2">
                <Stars
                  n={useApi === true ? Math.min(5, Math.max(1, Math.round(b.stars))) : ratings[b.id] ?? Math.round(b.stars)}
                  interactive
                  onPick={(s) => void submitRating(b.id, s)}
                />
              </div>
              <Button type="button" variant="muted" className="mt-2 !py-2 !text-xs" onClick={() => setRateForId(null)}>
                Done
              </Button>
            </div>
          )}
        </article>
        )
      })}

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
