import { useCallback, useMemo, useState } from 'react'
import { postDashboardTips } from '../api/aiTipsApi'
import { ApiError } from '../api/http'
import { useRide } from '../hooks/useRide'
import { Button } from './ui/Button'
import { RsCard } from './ui/RsCard'
import { TipCard } from './ui/TipCard'
import type { AiDashboardTip, AiDashboardTipsResult } from '../types/aiDashboardTips'

function categoryEmoji(cat: string | undefined) {
  const c = (cat ?? '').toLowerCase()
  if (c.includes('fuel')) return '⛽'
  if (c.includes('maint')) return '🔧'
  if (c.includes('safe')) return '🪖'
  if (c.includes('mile')) return '📈'
  if (c.includes('rid')) return '🏍️'
  return '✨'
}

export function DashboardAiTips() {
  const { selectedBike, mileageStats, fuelForSelectedBike, serviceForSelectedBike } = useRide()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [payload, setPayload] = useState<AiDashboardTipsResult | null>(null)

  const statsBlock = useMemo(() => {
    const fuel = fuelForSelectedBike
    const last = fuel[0]
    const totalKm = fuel.reduce((s, e) => s + e.distanceKm, 0)
    const totalServiceSpend = serviceForSelectedBike.reduce(
      (s, r) => s + (Number.isFinite(r.cost) ? r.cost : 0),
      0,
    )
    const { average, best, worst, totalFuelCost, totalLiters } = mileageStats
    const estRangeKm =
      last && average != null
        ? Math.round(last.fuelLiters * average)
        : last && selectedBike
          ? Math.round(last.fuelLiters * (selectedBike.claimedMileageKmL ?? 45))
          : null
    return {
      averageKmL: average,
      bestKmL: best,
      worstKmL: worst,
      totalFuelCost,
      totalLiters,
      totalKm,
      fillCount: fuel.length,
      totalServiceSpend,
      lastFillLiters: last?.fuelLiters ?? null,
      estRangeKm,
    }
  }, [fuelForSelectedBike, mileageStats, selectedBike, serviceForSelectedBike])

  const run = useCallback(async () => {
    if (!selectedBike) return
    setBusy(true)
    setError(null)
    try {
      const img = selectedBike.image?.trim()
      const res = await postDashboardTips({
        bike: {
          brand: selectedBike.brand,
          model: selectedBike.model,
          year: selectedBike.year,
          registrationNumber: selectedBike.registrationNumber,
          fuelType: selectedBike.fuelType,
          engineCc: selectedBike.engineCc,
          category: selectedBike.category,
          claimedMileageKmL: selectedBike.claimedMileageKmL,
          fuelSystem: selectedBike.fuelSystem,
        },
        stats: statsBlock,
        imageBase64: img && img.length > 80 ? img : undefined,
      })
      setModel(res.model)
      setPayload(res.tips && typeof res.tips === 'object' ? res.tips : null)
    } catch (e) {
      setPayload(null)
      setModel(null)
      if (e instanceof ApiError && e.status === 503) {
        setError(
          `${e.message} Add GEMINI_API_KEY (and optionally GEMINI_MODEL) to the RideIQ backend .env, then restart the API.`,
        )
      } else {
        setError(e instanceof Error ? e.message : 'Could not load AI tips')
      }
    } finally {
      setBusy(false)
    }
  }, [selectedBike, statsBlock])

  const tipsList: AiDashboardTip[] = Array.isArray(payload?.tips) ? payload.tips : []

  return (
    <RsCard
      title="Personalized tips (Google Gemini)"
      subtitle="Uses your bike, logged mileage, spend, and your garage photo when set. The backend calls Google Gemini (GEMINI_MODEL) — not local Ollama."
      className="border-[rgba(77,166,255,0.25)] bg-gradient-to-br from-[rgba(77,166,255,0.08)] to-transparent"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="primary" className="!py-2.5 !text-xs" disabled={busy} onClick={() => void run()}>
          {busy ? 'Generating…' : payload ? 'Refresh AI tips' : 'Generate AI tips'}
        </Button>
        {model ? (
          <span className="text-[11px] text-[var(--rs-muted)]">
            Model <code className="text-[var(--rs-text)]">{model}</code>
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-[rgba(255,85,85,0.35)] bg-[rgba(255,85,85,0.08)] px-3 py-2 text-xs text-[var(--rs-red)]">
          {error}
        </p>
      ) : null}

      {payload && !error ? (
        <div className="mt-4 space-y-3">
          {payload.summary ? (
            <p className="text-sm font-medium leading-relaxed text-[var(--rs-text)]">{payload.summary}</p>
          ) : null}
          {payload.from_photo ? (
            <p className="text-xs leading-relaxed text-[var(--rs-muted)]">
              <span className="font-semibold text-[var(--rs-accent2)]">From your photo:</span> {payload.from_photo}
            </p>
          ) : null}
          <div className="space-y-2">
            {tipsList.map((t, i) => (
              <TipCard
                key={`${t.title}-${i}`}
                emoji={categoryEmoji(t.category)}
                title={t.title || `Tip ${i + 1}`}
                description={t.body || ''}
              />
            ))}
          </div>
          {payload.disclaimer ? <p className="text-[11px] leading-relaxed text-[var(--rs-muted)]">{payload.disclaimer}</p> : null}
        </div>
      ) : !busy && !error ? (
        <p className="mt-3 text-xs text-[var(--rs-muted)]">
          Tap generate for riding and maintenance tips tailored to this dashboard (requires GEMINI_API_KEY on the
          server).
        </p>
      ) : null}
    </RsCard>
  )
}
