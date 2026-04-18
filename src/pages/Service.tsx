import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, TextInput } from '../components/Form'
import { useRide } from '../hooks/useRide'
import { Button } from '../components/ui/Button'
import { RsCard } from '../components/ui/RsCard'
import { SectionHeading } from '../components/ui/SectionHeading'

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n,
  )
}

export default function Service() {
  const { selectedBike: bikeFromCtx, serviceForSelectedBike, addServiceRecord, deleteServiceRecord } = useRide()
  const bike = bikeFromCtx
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [cost, setCost] = useState('')
  const [odo, setOdo] = useState('')

  if (!bike) {
    return (
      <p className="text-center text-sm text-[var(--rs-muted)]">
        <Link className="text-[var(--rs-accent)]" to="/bikes">
          Add a bike
        </Link>{' '}
        to track service.
      </p>
    )
  }

  function onAdd(e: FormEvent) {
    e.preventDefault()
    if (!bike) return
    const c = parseFloat(cost)
    const o = odo.trim() === '' ? null : parseFloat(odo)
    if (!title.trim() || !Number.isFinite(c) || c < 0) return
    addServiceRecord({
      bikeId: bike.id,
      date,
      title: title.trim(),
      notes: notes.trim(),
      cost: c,
      odoKm: o != null && Number.isFinite(o) ? o : null,
    })
    setTitle('')
    setNotes('')
    setCost('')
    setOdo('')
    setDate(new Date().toISOString().slice(0, 10))
  }

  const sorted = [...serviceForSelectedBike].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <div>
      <p className="mb-3 text-xs text-[var(--rs-muted)]">
        Service history for <span className="font-medium text-[var(--rs-text)]">{bike.brand}</span>{' '}
        <span className="font-medium text-[var(--rs-text)]">{bike.model}</span> — switch bikes from the strip
        above or in <Link to="/bikes">Garage</Link>.
      </p>

      <RsCard title="Log service">
        <form onSubmit={onAdd} className="space-y-2">
          <Field label="Date" htmlFor="sd">
            <TextInput id="sd" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Title" htmlFor="st">
            <TextInput id="st" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Oil change, brake pads…" required />
          </Field>
          <Field label="Odometer (km)" htmlFor="so">
            <TextInput id="so" inputMode="decimal" value={odo} onChange={(e) => setOdo(e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Cost (₹)" htmlFor="sc">
            <TextInput id="sc" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} required />
          </Field>
          <Field label="Notes" htmlFor="sn">
            <TextInput id="sn" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Parts used, garage name…" />
          </Field>
          <Button type="submit" className="w-full" disabled={!title.trim()}>
            Save entry
          </Button>
        </form>
      </RsCard>

      <SectionHeading>History</SectionHeading>
      {sorted.length === 0 ? (
        <p className="text-xs text-[var(--rs-muted)]">No services logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-2 rounded-[10px] border border-[var(--rs-border)] bg-[var(--rs-surface2)] p-3"
            >
              <div>
                <div className="text-[13px] font-medium text-[var(--rs-text)]">{s.title}</div>
                <div className="mt-0.5 text-[11px] text-[var(--rs-muted)]">
                  {s.date}
                  {s.odoKm != null ? ` · ${s.odoKm.toLocaleString()} km` : ''}
                </div>
                {s.notes ? <p className="mt-1 text-xs text-[var(--rs-muted)]">{s.notes}</p> : null}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-[var(--rs-green)]">{formatMoney(s.cost)}</div>
                <button
                  type="button"
                  className="mt-1 text-[10px] text-[var(--rs-accent)] hover:underline"
                  onClick={() => {
                    if (window.confirm('Remove this service record?')) deleteServiceRecord(s.id)
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
