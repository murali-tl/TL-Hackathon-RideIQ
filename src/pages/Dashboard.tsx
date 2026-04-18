import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardAiTips } from '../components/DashboardAiTips'
import { BikeSelectDropdown } from '../components/BikeSelectDropdown'
import { Badge } from '../components/ui/Badge'
import { useRide } from '../hooks/useRide'
import { RsCard } from '../components/ui/RsCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { StatTile } from '../components/ui/StatTile'
import { TipCard } from '../components/ui/TipCard'
import { speedZones } from '../data/tipsContent'
import { documentExpiryState, formatIsoDate } from '../utils/docDisplay'
import { formatEngineCcDisplay, formatEngineCcLabel } from '../utils/bikeCc'

const zoneClass: Record<string, string> = {
  accent: 'bg-[rgba(255,92,26,0.09)] text-[var(--rs-accent)]',
  green: 'border border-[rgba(34,201,122,0.4)] bg-[rgba(34,201,122,0.15)] text-[var(--rs-green)]',
  amber: 'bg-[rgba(255,160,64,0.09)] text-[var(--rs-accent2)]',
  red: 'bg-[rgba(220,50,50,0.08)] text-[var(--rs-red)]',
}

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n,
  )
}

function formatKmL(v: number | null) {
  if (v == null) return '—'
  return `${v}`
}

export default function Dashboard() {
  const [dashTab, setDashTab] = useState<'overview' | 'expenses'>('overview')
  const {
    mileageStats,
    selectedBike,
    bikes,
    fuelForSelectedBike,
    documentsForSelectedBike,
    serviceForSelectedBike,
  } = useRide()
  const { average, best, totalFuelCost } = mileageStats
  const totalServiceSpend = useMemo(
    () => serviceForSelectedBike.reduce((s, r) => s + (Number.isFinite(r.cost) ? r.cost : 0), 0),
    [serviceForSelectedBike],
  )
  const totalExpenses = totalFuelCost + totalServiceSpend
  const totalKm = fuelForSelectedBike.reduce((s, e) => s + e.distanceKm, 0)
  const last = fuelForSelectedBike[0]
  const estRange =
    last && average != null ? `~${Math.round(last.fuelLiters * average)} km range` : '~322 km range'

  const insurance = documentsForSelectedBike.find((d) => d.category === 'insurance')
  const puc = documentsForSelectedBike.find((d) => d.category === 'puc')
  const insState = insurance ? documentExpiryState(insurance) : null
  const pucState = puc ? documentExpiryState(puc) : null

  if (!selectedBike) {
    return (
      <div className="rounded-[var(--rs-radius)] border border-[var(--rs-border)] bg-[var(--rs-surface)] p-6 text-center text-sm text-[var(--rs-muted)]">
        Add a bike in{' '}
        <Link to="/bikes" className="font-medium text-[var(--rs-accent)]">
          Garage
        </Link>{' '}
        to see this dashboard.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <h1 className="sr-only">RideIQ home</h1>

      {bikes.length > 1 ? (
        <BikeSelectDropdown id="dash-bike" label="Dashboard for bike" className="max-w-md" />
      ) : null}

      <div
        className="flex max-w-md gap-1 rounded-full border border-[var(--rs-border)] bg-[var(--rs-surface2)] p-1"
        role="tablist"
        aria-label="Dashboard view"
      >
        <button
          type="button"
          role="tab"
          aria-selected={dashTab === 'overview'}
          className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold transition ${
            dashTab === 'overview'
              ? 'bg-[var(--rs-surface)] text-[var(--rs-text)] shadow-sm'
              : 'text-[var(--rs-muted)] hover:text-[var(--rs-text)]'
          }`}
          onClick={() => setDashTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={dashTab === 'expenses'}
          className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold transition ${
            dashTab === 'expenses'
              ? 'bg-[var(--rs-surface)] text-[var(--rs-text)] shadow-sm'
              : 'text-[var(--rs-muted)] hover:text-[var(--rs-text)]'
          }`}
          onClick={() => setDashTab('expenses')}
        >
          Expenses
        </button>
      </div>

      {dashTab === 'expenses' ? (
        <section className="space-y-4" aria-label="Fuel and service expenses">
          <SectionHeading>Spending · this bike</SectionHeading>
          <p className="text-xs text-[var(--rs-muted)]">
            Totals combine fuel logged under Fuel and workshop costs under Service for{' '}
            <span className="font-medium text-[var(--rs-text)]">
              {selectedBike.brand} {selectedBike.model}
            </span>
            .
          </p>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <StatTile
              label="Fuel (log)"
              value={formatMoney(totalFuelCost)}
              footnote="All fill-ups for this bike"
              footTone="muted"
            />
            <StatTile
              label="Service & parts"
              value={formatMoney(totalServiceSpend)}
              footnote="Sum of service records"
              footTone="muted"
            />
            <StatTile
              label="Total"
              value={formatMoney(totalExpenses)}
              footnote="Fuel + service"
              footTone="accent"
            />
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link to="/fuel" className="font-medium text-[var(--rs-accent)]">
              Open fuel log →
            </Link>
            <Link to="/service" className="font-medium text-[var(--rs-accent)]">
              Open service log →
            </Link>
          </div>
        </section>
      ) : null}

      {dashTab === 'overview' ? (
        <>
      {/* Hero + stats — side by side from lg; stats widen to 4 columns on xl */}
      <section className="grid gap-5 lg:grid-cols-12 lg:items-stretch lg:gap-6 xl:gap-8" aria-labelledby="dash-hero-heading">
        <div id="dash-hero-heading" className="sr-only">
          Bike overview
        </div>
        <div className="relative flex min-h-0 flex-col justify-center overflow-hidden rounded-[var(--rs-radius)] border border-[var(--rs-border)] bg-[var(--rs-surface)] px-5 py-6 text-center sm:px-6 sm:py-7 lg:col-span-5 lg:text-left xl:col-span-4">
          <div
            className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full opacity-100 lg:right-0 lg:top-1/2 lg:h-72 lg:w-72 lg:-translate-y-1/2"
            style={{ background: 'radial-gradient(circle, rgba(255,92,26,0.12) 0%, transparent 70%)' }}
            aria-hidden
          />
          <div className="relative flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4 lg:flex-col lg:items-start xl:flex-row xl:items-center">
            {selectedBike.image ? (
              <img
                src={selectedBike.image}
                alt=""
                className="h-20 w-20 shrink-0 rounded-2xl border border-[var(--rs-border)] object-cover shadow-sm sm:h-24 sm:w-24"
              />
            ) : (
              <div className="text-5xl sm:text-[3.25rem]" aria-hidden>
                🏍️
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-[family-name:var(--rs-font-head)] text-lg font-extrabold text-[var(--rs-text)] sm:text-xl">
                {selectedBike.brand} {selectedBike.model}
              </div>
              <div className="mt-1 text-[13px] tracking-wide text-[var(--rs-muted)]">{selectedBike.registrationNumber}</div>
              <div className="mt-2 text-[11px] leading-relaxed text-[var(--rs-muted)]">
                {selectedBike.year} · {formatEngineCcDisplay(selectedBike.engineCc)} · {selectedBike.fuelType} ·{' '}
                {selectedBike.category}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-7 xl:col-span-8">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
            <StatTile
              label="Current mileage"
              value={formatKmL(average)}
              unit="km/L"
              footnote={best != null ? `↑ vs best ${best} km/L` : 'Log fill-ups to track'}
              footTone="green"
            />
            <StatTile
              label="Fuel spend (log)"
              value={formatMoney(totalFuelCost)}
              footnote="This bike · all time"
              footTone="muted"
            />
            <StatTile label="Total KMs (log)" value={totalKm.toLocaleString()} unit="km" footnote="Sum of distances" />
            <StatTile
              label="Tyre pressure"
              value="32"
              unit="psi"
              footnote="⚠ Check soon"
              footTone="accent"
            />
          </div>
          <div className="mt-2.5 sm:mt-3">
            <StatTile
              label="Est. range (last fill)"
              value={last ? `${(last.fuelLiters * (average ?? selectedBike.claimedMileageKmL ?? 45)).toFixed(0)}` : '—'}
              unit="km"
              footnote={estRange}
              footTone="muted"
            />
          </div>
        </div>
      </section>

      {/* Documents + alerts — two columns from lg */}
      <section className="grid gap-8 lg:grid-cols-12 lg:gap-8 xl:gap-10" aria-label="Documents and alerts">
        <div className="min-w-0 lg:col-span-5 xl:col-span-4">
          <SectionHeading>Documents & renewals</SectionHeading>
          <div className="mt-3 space-y-2 sm:space-y-2.5">
            {['insurance', 'puc', 'license', 'rc'].map((cat) => {
              const doc = documentsForSelectedBike.find((d) => d.category === cat)
              const label =
                cat === 'insurance' ? 'Insurance' : cat === 'puc' ? 'PUC' : cat === 'license' ? 'Driving licence' : 'RC'
              if (!doc) {
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between rounded-[10px] border border-[var(--rs-border)] bg-[var(--rs-surface2)] px-3 py-2.5 text-xs text-[var(--rs-muted)] sm:px-4"
                  >
                    <span>{label}</span>
                    <Link to="/documents" className="font-medium text-[var(--rs-accent)]">
                      Add
                    </Link>
                  </div>
                )
              }
              const st = documentExpiryState(doc)
              const border =
                st.tone === 'red'
                  ? 'border-[rgba(255,85,85,0.45)]'
                  : st.tone === 'accent' || st.tone === 'amber'
                    ? 'border-[rgba(255,160,64,0.35)]'
                    : 'border-[var(--rs-border)]'
              return (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between gap-3 rounded-[10px] border ${border} bg-[var(--rs-surface2)] px-3 py-2.5 sm:px-4`}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[var(--rs-text)]">{label}</div>
                    <div className="text-[11px] text-[var(--rs-muted)]">
                      {doc.extraction.expiryDateIso ? `Expiry: ${formatIsoDate(doc.extraction.expiryDateIso)}` : 'No expiry on file'}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      st.tone === 'green'
                        ? 'bg-[rgba(34,201,122,0.12)] text-[var(--rs-green)]'
                        : st.tone === 'amber'
                          ? 'bg-[rgba(255,160,64,0.15)] text-[var(--rs-accent2)]'
                          : st.tone === 'red'
                            ? 'bg-[rgba(255,85,85,0.15)] text-[var(--rs-red)]'
                            : 'bg-[rgba(255,92,26,0.15)] text-[var(--rs-accent)]'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="min-w-0 space-y-3 lg:col-span-7 xl:col-span-8">
          <SectionHeading>Today&apos;s alerts</SectionHeading>
          <TipCard
            emoji="🔧"
            title="Service window"
            description="Log odometer readings under Service after each visit to correlate with fuel data."
            iconBg="rgba(34,201,122,0.1)"
          />
          {insurance?.extraction.expiryDateIso ? (
            <TipCard
              emoji="🛡️"
              title="Insurance renewal"
              description={`Expires ${formatIsoDate(insurance.extraction.expiryDateIso)}${insState ? ` · ${insState.label}` : ''}.`}
              iconBg="rgba(77,166,255,0.1)"
            />
          ) : (
            <TipCard
              emoji="🛡️"
              title="Insurance renewal"
              description="Add your policy under My Docs to surface renewal dates here."
              iconBg="rgba(77,166,255,0.1)"
            />
          )}
          {puc?.extraction.expiryDateIso && pucState ? (
            <TipCard
              emoji="🌫️"
              title="PUC validity"
              description={`Valid till ${formatIsoDate(puc.extraction.expiryDateIso)} · ${pucState.label}.`}
              iconBg="rgba(34,201,122,0.1)"
            />
          ) : null}
        </div>
      </section>

      <section className="min-w-0 space-y-4" aria-label="AI smart tips">
        <SectionHeading>AI smart tips</SectionHeading>

        <RsCard
          title="Best speed for mileage"
          action={<Badge tone="accent">{formatEngineCcLabel(selectedBike.engineCc)}</Badge>}
        >
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

        <DashboardAiTips />
      </section>
        </>
      ) : null}
    </div>
  )
}
