import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BikeSelectDropdown } from '../components/BikeSelectDropdown'
import { Field, Select, TextInput } from '../components/Form'
import { IconTrash } from '../components/icons'
import { useRide } from '../hooks/useRide'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { RsCard } from '../components/ui/RsCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { StatTile } from '../components/ui/StatTile'
import { engineCcToFuelCalculatorType } from '../utils/bikeCc'
import type { BikeType, RidingStyle } from '../utils/fuelCalculator'
import { bikeDefaults, calculateFuelEstimate } from '../utils/fuelCalculator'

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n,
  )
}

function sumThisMonth(entries: { date: string; cost: number }[]) {
  const now = new Date()
  return entries
    .filter((e) => {
      const d = new Date(e.date + 'T12:00:00')
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, e) => s + e.cost, 0)
}

export default function Fuel() {
  const { bikes, fuelForSelectedBike, selectedBike, addFuelEntry, deleteFuelEntry, mileageStats } = useRide()
  const [tab, setTab] = useState<'calc' | 'log'>('calc')

  const [bikeType, setBikeType] = useState<BikeType>('125cc')
  const [fuelFilled, setFuelFilled] = useState('4.5')
  const [fuelPrice, setFuelPrice] = useState('103')
  const [ridingStyle, setRidingStyle] = useState<RidingStyle>('normal')
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (selectedBike?.engineCc) {
      setBikeType(engineCcToFuelCalculatorType(selectedBike.engineCc))
    }
  }, [selectedBike?.id, selectedBike?.engineCc])

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [fuelLiters, setFuelLiters] = useState('')
  const [cost, setCost] = useState('')
  const [distanceKm, setDistanceKm] = useState('')

  const calcResult = useMemo(() => {
    const filled = parseFloat(fuelFilled)
    const price = parseFloat(fuelPrice)
    if (!Number.isFinite(filled) || !Number.isFinite(price)) return null
    return calculateFuelEstimate({
      bikeType,
      fuelFilled: filled,
      fuelPricePerLiter: price,
      ridingStyle,
    })
  }, [bikeType, fuelFilled, fuelPrice, ridingStyle])

  const previewMileage = useMemo(() => {
    const f = parseFloat(fuelLiters)
    const d = parseFloat(distanceKm)
    if (!Number.isFinite(f) || !Number.isFinite(d) || f <= 0) return null
    return Math.round((d / f) * 100) / 100
  }, [fuelLiters, distanceKm])

  const monthSpend = useMemo(() => sumThisMonth(fuelForSelectedBike), [fuelForSelectedBike])
  const prevMonth = useMemo(() => {
    const ref = new Date()
    ref.setMonth(ref.getMonth() - 1)
    return fuelForSelectedBike
      .filter((e) => {
        const d = new Date(e.date + 'T12:00:00')
        return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
      })
      .reduce((s, e) => s + e.cost, 0)
  }, [fuelForSelectedBike])

  function runCalc() {
    setShowResult(true)
  }

  function onSubmitLog(e: FormEvent) {
    e.preventDefault()
    const f = parseFloat(fuelLiters)
    const c = parseFloat(cost)
    const d = parseFloat(distanceKm)
    if (!date || !Number.isFinite(f) || !Number.isFinite(c) || !Number.isFinite(d) || f <= 0 || d < 0 || c < 0) {
      return
    }
    addFuelEntry({ date, fuelLiters: f, cost: c, distanceKm: d })
    setFuelLiters('')
    setCost('')
    setDistanceKm('')
    setDate(new Date().toISOString().slice(0, 10))
  }

  const comparePct = prevMonth > 0 ? Math.min(100, Math.round((monthSpend / prevMonth) * 100)) : 0

  if (!selectedBike) {
    return (
      <p className="text-center text-sm text-[var(--rs-muted)]">
        <Link to="/bikes" className="text-[var(--rs-accent)]">
          Add a bike
        </Link>{' '}
        to log fuel.
      </p>
    )
  }

  return (
    <div>
      {bikes.length > 1 ? (
        <div className="mb-4 max-w-md">
          <BikeSelectDropdown id="fuel-bike" label="Fuel data for bike" />
        </div>
      ) : null}
      <div className="mb-4 flex rounded-full border border-[var(--rs-border)] bg-[var(--rs-surface2)] p-1">
        <button
          type="button"
          className={`flex-1 rounded-full py-2 text-xs font-medium transition ${
            tab === 'calc' ? 'bg-[var(--rs-accent)] text-white' : 'text-[var(--rs-muted)]'
          }`}
          onClick={() => setTab('calc')}
        >
          Fuel calc
        </button>
        <button
          type="button"
          className={`flex-1 rounded-full py-2 text-xs font-medium transition ${
            tab === 'log' ? 'bg-[var(--rs-accent)] text-white' : 'text-[var(--rs-muted)]'
          }`}
          onClick={() => setTab('log')}
        >
          Fuel log
        </button>
      </div>

      {tab === 'calc' ? (
        <>
          <RsCard
            title="Fuel & mileage calculator"
            action={<Badge tone="accent">By bike type</Badge>}
          >
            <Field label="Bike type" htmlFor="bikeType">
              <Select
                id="bikeType"
                value={bikeType}
                onChange={(ev) => setBikeType(ev.target.value as BikeType)}
                aria-label="Bike type"
              >
                <option value="100cc">100cc commuter</option>
                <option value="125cc">125cc</option>
                <option value="150cc">150cc</option>
                <option value="200cc">200cc+</option>
                <option value="scooter">Scooter</option>
                <option value="premium">Premium</option>
              </Select>
            </Field>
            <div className="flex gap-2.5">
              <Field label="Fuel filled (L)" htmlFor="ff">
                <TextInput id="ff" inputMode="decimal" value={fuelFilled} onChange={(e) => setFuelFilled(e.target.value)} />
              </Field>
              <Field label="Fuel price (₹/L)" htmlFor="fp">
                <TextInput id="fp" inputMode="decimal" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} />
              </Field>
            </div>
            <Field label="Riding style" htmlFor="rs">
              <Select
                id="rs"
                value={ridingStyle}
                onChange={(e) => setRidingStyle(e.target.value as RidingStyle)}
                aria-label="Riding style"
              >
                <option value="eco">Eco</option>
                <option value="normal">Normal</option>
                <option value="sport">Sport</option>
              </Select>
            </Field>
            <Button type="button" className="mt-2 w-full" onClick={runCalc}>
              Calculate mileage & range
            </Button>

            {showResult && calcResult ? (
              <div className="mt-3 rounded-xl border border-[rgba(255,92,26,0.3)] bg-gradient-to-br from-[rgba(255,92,26,0.12)] to-[rgba(255,160,64,0.06)] p-3.5">
                <div className="mb-3 flex justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-[var(--rs-muted)]">Total cost</div>
                    <div className="font-[family-name:var(--rs-font-head)] text-2xl font-extrabold text-[var(--rs-accent2)]">
                      {formatMoney(calcResult.totalCost)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-[var(--rs-muted)]">Est. mileage</div>
                    <div className="font-[family-name:var(--rs-font-head)] text-2xl font-extrabold text-[var(--rs-accent2)]">
                      {calcResult.estimatedMileage} km/L
                    </div>
                  </div>
                </div>
                <ProgressBar
                  value={calcResult.tankFillPercent}
                  labelLeft="Tank level"
                  labelRight={`${calcResult.tankFillPercent}% of ${bikeDefaults[bikeType].tank} L`}
                />
                <p className="mt-2 border-t border-[var(--rs-border)] pt-2 text-xs text-[var(--rs-muted)]">
                  Estimated range with this fill: ~{calcResult.estimatedRangeKm} km
                </p>
                <p className="mt-1 text-xs text-[var(--rs-muted)]">{calcResult.compareLine}</p>
              </div>
            ) : null}
          </RsCard>

          <RsCard title="Monthly fuel spend" action={<Badge tone="green">From log</Badge>}>
            <div className="grid grid-cols-2 gap-2.5">
              <StatTile label="This month" value={formatMoney(monthSpend)} />
              <StatTile
                label="Per day avg"
                value={formatMoney(Math.round(monthSpend / Math.max(1, new Date().getDate())))}
              />
            </div>
            <ProgressBar
              value={comparePct}
              fillClass="bg-[var(--rs-green)]"
              labelLeft={prevMonth ? `vs last month ${formatMoney(prevMonth)}` : 'No last month data'}
              labelRight={
                prevMonth && monthSpend <= prevMonth
                  ? `Saved ${formatMoney(prevMonth - monthSpend)}`
                  : prevMonth
                    ? `+${formatMoney(monthSpend - prevMonth)}`
                    : ''
              }
            />
          </RsCard>
        </>
      ) : (
        <>
          <RsCard title="Add entry" subtitle="Distance is kilometers since last full tank.">
            <form onSubmit={onSubmitLog} className="space-y-1">
              <Field label="Date" htmlFor="date">
                <TextInput id="date" type="date" value={date} onChange={(ev) => setDate(ev.target.value)} required />
              </Field>
              <Field label="Fuel (liters)" htmlFor="fuel">
                <TextInput
                  id="fuel"
                  inputMode="decimal"
                  placeholder="e.g. 4.2"
                  value={fuelLiters}
                  onChange={(ev) => setFuelLiters(ev.target.value)}
                  required
                />
              </Field>
              <Field label="Cost" htmlFor="cost">
                <TextInput
                  id="cost"
                  inputMode="decimal"
                  placeholder="e.g. 520"
                  value={cost}
                  onChange={(ev) => setCost(ev.target.value)}
                  required
                />
              </Field>
              <Field label="Distance (km)" htmlFor="dist">
                <TextInput
                  id="dist"
                  inputMode="decimal"
                  placeholder="e.g. 185"
                  value={distanceKm}
                  onChange={(ev) => setDistanceKm(ev.target.value)}
                  required
                />
              </Field>
              <div className="mb-2 rounded-lg border border-dashed border-[var(--rs-border)] bg-[var(--rs-surface2)] px-3 py-2 text-xs text-[var(--rs-muted)]">
                Mileage preview:{' '}
                <span className="font-semibold text-[var(--rs-text)]">
                  {previewMileage != null ? `${previewMileage} km/L` : 'Enter fuel & distance'}
                </span>
              </div>
              <Button type="submit" className="w-full">
                Save entry
              </Button>
            </form>
          </RsCard>

          <RsCard title="Entries" subtitle={`${fuelForSelectedBike.length} logged · ${selectedBike.registrationNumber}`}>
            {fuelForSelectedBike.length === 0 ? (
              <p className="text-xs text-[var(--rs-muted)]">No entries yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--rs-border)]">
                {fuelForSelectedBike.map((e) => (
                  <li key={e.id} className="flex flex-col gap-1 py-3 first:pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-[var(--rs-text)]">{e.date}</div>
                        <p className="mt-0.5 text-xs text-[var(--rs-muted)]">
                          {e.fuelLiters} L · {formatMoney(e.cost)} · {e.distanceKm} km
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-[family-name:var(--rs-font-head)] text-base font-bold text-[var(--rs-accent)]">
                          {e.mileage} km/L
                        </span>
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-[var(--rs-muted)] transition hover:bg-[rgba(255,85,85,0.12)] hover:text-[var(--rs-red)]"
                          aria-label={`Delete fuel log ${e.date}`}
                          onClick={() => {
                            if (confirm(`Remove the fuel entry from ${e.date}?`)) deleteFuelEntry(e.id)
                          }}
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </RsCard>

          <SectionHeading>Mileage analytics</SectionHeading>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Avg" value={mileageStats.average == null ? '—' : `${mileageStats.average}`} unit="km/L" />
            <StatTile
              label="Best"
              value={mileageStats.best == null ? '—' : `${mileageStats.best}`}
              unit="km/L"
              footTone="green"
            />
            <StatTile
              label="Worst"
              value={mileageStats.worst == null ? '—' : `${mileageStats.worst}`}
              unit="km/L"
              footTone="accent"
            />
          </div>
        </>
      )}
    </div>
  )
}
