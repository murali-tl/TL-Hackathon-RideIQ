import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Field, Select, TextInput } from '../components/Form'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { RsCard } from '../components/ui/RsCard'

type SplitMode = 'group' | 'pillion'

type Person = { name: string; km: string }

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n,
  )
}

const defaultNames = ['Arjun', 'Priya', 'Ravi', 'Sneha', 'Kiran']
const defaultKm = ['40', '30', '30', '20', '20']

type ShareRow = {
  name: string
  share: number
  detail: string
}

function badgeForMode(mode: SplitMode): { label: string; tone: 'accent' | 'green' | 'blue' | 'purple' } {
  if (mode === 'pillion') return { label: 'Pillion (two-up)', tone: 'purple' }
  return { label: 'Group ride', tone: 'purple' }
}

function breakdownBadge(mode: SplitMode, pillionEqual: boolean): { label: string; tone: 'accent' | 'green' | 'blue' | 'purple' } {
  if (mode === 'pillion') return { label: pillionEqual ? '50 / 50' : 'Custom %', tone: 'green' }
  return { label: 'Fair by km', tone: 'green' }
}

export default function Split() {
  const [splitMode, setSplitMode] = useState<SplitMode>('group')
  const [total, setTotal] = useState('850')
  const [n, setN] = useState(3)
  const [people, setPeople] = useState<Person[]>(() =>
    Array.from({ length: 3 }, (_, i) => ({ name: defaultNames[i] ?? '', km: defaultKm[i] ?? '0' })),
  )
  const [riderName, setRiderName] = useState('Rider')
  const [pillionName, setPillionName] = useState('Pillion')
  const [pillionEqual, setPillionEqual] = useState(true)
  /** Rider’s share of the bill when custom (0–100); pillion gets the rest. */
  const [riderPercent, setRiderPercent] = useState('50')
  const [show, setShow] = useState(false)

  const shares = useMemo((): ShareRow[] => {
    const totalNum = Math.max(0, parseFloat(total) || 0)

    if (splitMode === 'pillion') {
      const rName = riderName.trim() || 'Rider'
      const pName = pillionName.trim() || 'Pillion'
      if (pillionEqual) {
        const half = Math.floor(totalNum / 2)
        const other = totalNum - half
        return [
          { name: rName, share: half, detail: 'Half (equal split)' },
          { name: pName, share: other, detail: 'Half (equal split)' },
        ]
      }
      let rp = parseFloat(riderPercent)
      if (!Number.isFinite(rp)) rp = 50
      rp = Math.min(100, Math.max(0, rp))
      const riderShare = Math.round((totalNum * rp) / 100)
      const pillionShare = totalNum - riderShare
      return [
        { name: rName, share: riderShare, detail: `${rp}% of trip` },
        { name: pName, share: pillionShare, detail: `${100 - rp}% of trip` },
      ]
    }

    const parsed = people.map((p, i) => ({
      name: p.name.trim() || `Person ${i + 1}`,
      km: parseFloat(p.km) || 0,
    }))
    const sumKm = parsed.reduce((s, p) => s + p.km, 0)
    return parsed.map((p) => ({
      name: p.name,
      share:
        sumKm > 0 ? Math.round((p.km / sumKm) * totalNum) : Math.round(totalNum / Math.max(1, parsed.length)),
      detail: `${p.km} km ridden`,
    }))
  }, [splitMode, total, people, riderName, pillionName, pillionEqual, riderPercent])

  function updateCount(next: number) {
    setN(next)
    setPeople((prev) =>
      Array.from({ length: next }, (_, i) => prev[i] ?? { name: defaultNames[i] ?? '', km: defaultKm[i] ?? '0' }),
    )
    setShow(false)
  }

  function onModeChange(mode: SplitMode) {
    setSplitMode(mode)
    setShow(false)
  }

  function onCalc(e: FormEvent) {
    e.preventDefault()
    setShow(true)
  }

  const headerBadge = badgeForMode(splitMode)
  const resultBadge = breakdownBadge(splitMode, pillionEqual)
  const totalNum = parseFloat(total) || 0

  const submitLabel =
    splitMode === 'group' ? 'Split fairly by distance' : 'Calculate split'

  const footerHint =
    splitMode === 'group'
      ? 'Proportional to distance ridden'
      : pillionEqual
        ? 'Equal split between rider and pillion'
        : 'Split by custom percentage'

  return (
    <div>
      <RsCard
        title="Split bike expenses"
        action={<Badge tone={headerBadge.tone}>{headerBadge.label}</Badge>}
      >
        <form onSubmit={onCalc} className="space-y-1">
          <Field label="Riding category" htmlFor="split-mode">
            <Select
              id="split-mode"
              value={splitMode}
              onChange={(e) => onModeChange(e.target.value as SplitMode)}
              aria-label="Riding category"
            >
              <option value="group">Group ride — split by km each person rode</option>
              <option value="pillion">Pillion (two-up) — rider + passenger, same bike</option>
            </Select>
          </Field>

          <Field label="Total trip cost (₹)" htmlFor="tot">
            <TextInput id="tot" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} />
          </Field>

          {splitMode === 'pillion' ? (
            <>
              <div className="mb-2 grid gap-2.5 sm:grid-cols-2">
                <Field label="Rider" htmlFor="rid-n">
                  <TextInput id="rid-n" value={riderName} onChange={(e) => setRiderName(e.target.value)} />
                </Field>
                <Field label="Pillion" htmlFor="pil-n">
                  <TextInput id="pil-n" value={pillionName} onChange={(e) => setPillionName(e.target.value)} />
                </Field>
              </div>
              <Field label="How to split" htmlFor="pil-split">
                <Select
                  id="pil-split"
                  value={pillionEqual ? 'equal' : 'custom'}
                  onChange={(e) => {
                    setPillionEqual(e.target.value === 'equal')
                    setShow(false)
                  }}
                  aria-label="Pillion split type"
                >
                  <option value="equal">Equal — 50% / 50%</option>
                  <option value="custom">Custom — rider pays a set %</option>
                </Select>
              </Field>
              {!pillionEqual ? (
                <Field
                  label="Rider pays (% of total)"
                  htmlFor="rid-pct"
                  hint="Pillion pays the remainder automatically."
                >
                  <TextInput
                    id="rid-pct"
                    inputMode="decimal"
                    placeholder="e.g. 60"
                    value={riderPercent}
                    onChange={(e) => setRiderPercent(e.target.value)}
                  />
                </Field>
              ) : null}
            </>
          ) : null}

          {splitMode === 'group' ? (
            <>
              <Field label="Number of people" htmlFor="np">
                <Select
                  id="np"
                  value={String(n)}
                  onChange={(e) => updateCount(Number(e.target.value))}
                  aria-label="Number of people"
                >
                  {[2, 3, 4, 5].map((c) => (
                    <option key={c} value={c}>
                      {c} people
                    </option>
                  ))}
                </Select>
              </Field>
              {people.map((p, i) => (
                <div key={i} className="mb-2 flex gap-2.5">
                  <Field label={`Person ${i + 1}`} htmlFor={`n-${i}`}>
                    <TextInput
                      id={`n-${i}`}
                      placeholder="Name"
                      value={p.name}
                      onChange={(e) => {
                        const next = [...people]
                        next[i] = { ...next[i], name: e.target.value }
                        setPeople(next)
                      }}
                    />
                  </Field>
                  <Field label="Km ridden" htmlFor={`k-${i}`}>
                    <TextInput
                      id={`k-${i}`}
                      inputMode="decimal"
                      placeholder="km"
                      value={p.km}
                      onChange={(e) => {
                        const next = [...people]
                        next[i] = { ...next[i], km: e.target.value }
                        setPeople(next)
                      }}
                    />
                  </Field>
                </div>
              ))}
            </>
          ) : null}

          <Button type="submit" className="mt-2 w-full">
            {submitLabel}
          </Button>
        </form>
      </RsCard>

      {show ? (
        <RsCard title="Split breakdown" action={<Badge tone={resultBadge.tone}>{resultBadge.label}</Badge>}>
          <div className="divide-y divide-[var(--rs-border)]">
            {shares.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 first:pt-0">
                <div>
                  <div className="text-[13px] font-medium text-[var(--rs-text)]">{s.name}</div>
                  <div className="text-[11px] text-[var(--rs-muted)]">{s.detail}</div>
                </div>
                <div className="font-[family-name:var(--rs-font-head)] text-[15px] font-bold text-[var(--rs-green)]">
                  {formatMoney(s.share)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-1 border-t border-[var(--rs-border)] pt-2.5 text-xs text-[var(--rs-muted)] sm:flex-row sm:items-center sm:justify-between">
            <span>{footerHint}</span>
            <span className="font-[family-name:var(--rs-font-head)] text-[13px] font-bold text-[var(--rs-text)]">
              Total {formatMoney(totalNum)}
            </span>
          </div>
        </RsCard>
      ) : null}
    </div>
  )
}
