import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Field, Select, TextInput } from '../components/Form'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { RsCard } from '../components/ui/RsCard'

type Person = { name: string; km: string }

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n,
  )
}

const defaultNames = ['Arjun', 'Priya', 'Ravi', 'Sneha', 'Kiran']
const defaultKm = ['40', '30', '30', '20', '20']

export default function Split() {
  const [total, setTotal] = useState('850')
  const [n, setN] = useState(3)
  const [people, setPeople] = useState<Person[]>(() =>
    Array.from({ length: 3 }, (_, i) => ({ name: defaultNames[i] ?? '', km: defaultKm[i] ?? '0' })),
  )
  const [show, setShow] = useState(false)

  const shares = useMemo(() => {
    const totalNum = parseFloat(total) || 0
    const parsed = people.map((p, i) => ({
      name: p.name.trim() || `Person ${i + 1}`,
      km: parseFloat(p.km) || 0,
    }))
    const sumKm = parsed.reduce((s, p) => s + p.km, 0)
    return parsed.map((p) => ({
      ...p,
      share: sumKm > 0 ? Math.round((p.km / sumKm) * totalNum) : Math.round(totalNum / parsed.length),
    }))
  }, [people, total, show])

  function updateCount(next: number) {
    setN(next)
    setPeople((prev) =>
      Array.from({ length: next }, (_, i) => prev[i] ?? { name: defaultNames[i] ?? '', km: defaultKm[i] ?? '0' }),
    )
    setShow(false)
  }

  function onCalc(e: FormEvent) {
    e.preventDefault()
    setShow(true)
  }

  return (
    <div>
      <RsCard title="Split bike expenses" action={<Badge tone="purple">Group ride</Badge>}>
        <form onSubmit={onCalc}>
          <Field label="Total trip cost (₹)" htmlFor="tot">
            <TextInput id="tot" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} />
          </Field>
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
          <Button type="submit" className="mt-2 w-full">
            Split fairly by distance
          </Button>
        </form>
      </RsCard>

      {show ? (
        <RsCard title="Split breakdown" action={<Badge tone="green">Fair by km</Badge>}>
          <div className="divide-y divide-[var(--rs-border)]">
            {shares.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 first:pt-0">
                <div>
                  <div className="text-[13px] font-medium text-[var(--rs-text)]">{s.name}</div>
                  <div className="text-[11px] text-[var(--rs-muted)]">{s.km} km ridden</div>
                </div>
                <div className="font-[family-name:var(--rs-font-head)] text-[15px] font-bold text-[var(--rs-green)]">
                  {formatMoney(s.share)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-[var(--rs-border)] pt-2.5 text-xs text-[var(--rs-muted)]">
            <span>Proportional to distance ridden</span>
            <span className="font-[family-name:var(--rs-font-head)] text-[13px] font-bold text-[var(--rs-text)]">
              Total {formatMoney(parseFloat(total) || 0)}
            </span>
          </div>
        </RsCard>
      ) : null}
    </div>
  )
}
