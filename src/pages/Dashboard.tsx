import { Link } from 'react-router-dom'
import { AiTips } from '../components/AiTips'
import { useRide } from '../hooks/useRide'
import { SectionHeading } from '../components/ui/SectionHeading'
import { StatTile } from '../components/ui/StatTile'
import { TipCard } from '../components/ui/TipCard'
import { documentExpiryState, formatIsoDate } from '../utils/docDisplay'

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
  const { mileageStats, selectedBike, fuelForSelectedBike, documentsForSelectedBike } = useRide()
  const { average, best, totalFuelCost } = mileageStats
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
    <div>
      <h1 className="sr-only">RideIQ home</h1>

      <div className="relative mb-3 overflow-hidden rounded-[var(--rs-radius)] border border-[var(--rs-border)] bg-[var(--rs-surface)] px-5 py-6 text-center">
        <div
          className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full opacity-100"
          style={{ background: 'radial-gradient(circle, rgba(255,92,26,0.12) 0%, transparent 70%)' }}
          aria-hidden
        />
        <div className="text-5xl" aria-hidden>
          🏍️
        </div>
        <div className="mt-2 font-[family-name:var(--rs-font-head)] text-lg font-extrabold text-[var(--rs-text)]">
          {selectedBike.brand} {selectedBike.model}
        </div>
        <div className="mt-1 text-[13px] tracking-wide text-[var(--rs-muted)]">{selectedBike.registrationNumber}</div>
        <div className="mt-2 text-[11px] text-[var(--rs-muted)]">
          {selectedBike.year} · {selectedBike.engineCc} cc · {selectedBike.fuelType} · {selectedBike.category}
        </div>
      </div>

      <div className="mb-1 grid grid-cols-2 gap-2.5">
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
        <div className="col-span-2">
          <StatTile
            label="Est. range (last fill)"
            value={last ? `${(last.fuelLiters * (average ?? selectedBike.claimedMileageKmL ?? 45)).toFixed(0)}` : '—'}
            unit="km"
            footnote={estRange}
            footTone="muted"
          />
        </div>
      </div>

      <SectionHeading>Documents & renewals</SectionHeading>
      <div className="mb-3 space-y-2">
        {['insurance', 'puc', 'license', 'rc'].map((cat) => {
          const doc = documentsForSelectedBike.find((d) => d.category === cat)
          const label =
            cat === 'insurance' ? 'Insurance' : cat === 'puc' ? 'PUC' : cat === 'license' ? 'Driving licence' : 'RC'
          if (!doc) {
            return (
              <div
                key={cat}
                className="flex items-center justify-between rounded-[10px] border border-[var(--rs-border)] bg-[var(--rs-surface2)] px-3 py-2 text-xs text-[var(--rs-muted)]"
              >
                <span>{label}</span>
                <Link to="/documents" className="text-[var(--rs-accent)]">
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
            <div key={doc.id} className={`flex items-center justify-between rounded-[10px] border ${border} bg-[var(--rs-surface2)] px-3 py-2`}>
              <div>
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

      <SectionHeading>Today&apos;s alerts</SectionHeading>
      <TipCard
        emoji="⚡"
        title="Optimal speed zone: 45–55 km/h"
        description="Your commuter gives best mileage in this band. Avoid sustained highway speeds above 70 km/h when you can."
        iconBg="rgba(255,92,26,0.12)"
      />
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

      <SectionHeading>Efficiency coach</SectionHeading>
      <AiTips />
    </div>
  )
}
