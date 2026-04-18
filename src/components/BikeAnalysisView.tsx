import type { MileageSuggestion } from '../types/bikeAnalysis'
import { asBikeAnalysis, featureList } from '../types/bikeAnalysis'

function formatLabel(s: string | null | undefined): string | null {
  if (s == null) return null
  const t = String(s).trim()
  return t.length ? t : null
}

function impactPill(impact: string | undefined): string {
  const i = (impact || '').toLowerCase()
  if (i === 'high')
    return 'border-[rgba(34,201,122,0.45)] bg-[rgba(34,201,122,0.12)] text-[var(--rs-green)]'
  if (i === 'medium')
    return 'border-[rgba(255,160,64,0.45)] bg-[rgba(255,160,64,0.12)] text-[var(--rs-accent2)]'
  return 'border-[var(--rs-border)] bg-[var(--rs-surface2)] text-[var(--rs-muted)]'
}

function SuggestionCard({ s, index }: { s: MileageSuggestion; index: number }) {
  const title = formatLabel(s.title) ?? `Suggestion ${index + 1}`
  const detail = formatLabel(s.detail)
  const imp = formatLabel(s.expected_impact) ?? '—'
  return (
    <article className="rounded-[var(--rs-radius-sm)] border border-[var(--rs-border)] bg-[var(--rs-surface2)] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-[family-name:var(--rs-font-head)] text-sm font-semibold leading-snug text-[var(--rs-text)]">
          {title}
        </h4>
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${impactPill(s.expected_impact)}`}
        >
          {imp}
        </span>
      </div>
      {detail ? <p className="mt-2 text-[13px] leading-relaxed text-[var(--rs-muted)]">{detail}</p> : null}
    </article>
  )
}

export function BikeAnalysisView({
  analysis,
  model,
  mime_type,
}: {
  analysis: unknown
  model: string
  mime_type: string
}) {
  const parsed = asBikeAnalysis(analysis)

  if (parsed?.parse_error) {
    return (
      <div className="rounded-lg border border-[var(--rs-accent2)]/30 bg-[rgba(255,160,64,0.08)] p-3">
        <p className="text-sm text-[var(--rs-accent2)]">{parsed.note ?? 'Could not parse model output as JSON.'}</p>
        {parsed.fallback_text ? (
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-[var(--rs-border)] bg-[var(--rs-surface)] p-2 font-mono text-xs text-[var(--rs-text)]">
            {parsed.fallback_text}
          </pre>
        ) : null}
      </div>
    )
  }

  if (!parsed) {
    return (
      <div className="rounded-lg border border-[var(--rs-border)] bg-[var(--rs-surface2)] p-3">
        <p className="text-sm text-[var(--rs-muted)]">Unexpected response shape.</p>
        <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-[var(--rs-border)] bg-[var(--rs-surface)] p-2 font-mono text-xs">
          {JSON.stringify(analysis, null, 2)}
        </pre>
      </div>
    )
  }

  const brand = formatLabel(parsed.identified_details?.brand_guess)
  const modelGuess = formatLabel(parsed.identified_details?.model_guess)
  const cc = formatLabel(parsed.identified_details?.approx_engine_cc_or_equivalent)
  const features = featureList(parsed.identified_details)
  const tips = Array.isArray(parsed.mileage_improvement_suggestions) ? parsed.mileage_improvement_suggestions : []
  const disclaimer = formatLabel(parsed.disclaimer)

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--rs-muted)]">
        Ollama <code className="text-[var(--rs-text)]">{model}</code> · {mime_type}
      </p>

      <div className="flex flex-wrap gap-2">
        {parsed.vehicle_type ? (
          <span className="rounded-full border border-[rgba(255,92,26,0.45)] bg-[rgba(255,92,26,0.12)] px-3 py-1 text-xs font-semibold text-[var(--rs-accent)]">
            {parsed.vehicle_type.replace(/\s*\|\s*/g, ' · ')}
          </span>
        ) : null}
        {parsed.image_assessment ? (
          <span className="rounded-full border border-[var(--rs-border)] bg-[var(--rs-surface2)] px-3 py-1 text-xs font-medium text-[var(--rs-muted)]">
            {parsed.image_assessment}
          </span>
        ) : null}
      </div>

      <section className="rounded-[var(--rs-radius)] border border-[var(--rs-border)] bg-[var(--rs-surface)] p-4">
        <h3 className="font-[family-name:var(--rs-font-head)] text-sm font-semibold text-[var(--rs-text)]">
          Identified from your photo
        </h3>
        <dl className="mt-3 grid grid-cols-[minmax(6rem,32%)_1fr] gap-x-3 gap-y-2 text-sm">
          {brand ? (
            <>
              <dt className="text-[var(--rs-muted)]">Brand</dt>
              <dd className="font-semibold text-[var(--rs-text)]">{brand}</dd>
            </>
          ) : null}
          {modelGuess ? (
            <>
              <dt className="text-[var(--rs-muted)]">Model</dt>
              <dd className="font-semibold text-[var(--rs-text)]">{modelGuess}</dd>
            </>
          ) : null}
          {cc ? (
            <>
              <dt className="text-[var(--rs-muted)]">Engine / size</dt>
              <dd className="font-semibold text-[var(--rs-text)]">{cc}</dd>
            </>
          ) : null}
        </dl>
        {!brand && !modelGuess && !cc ? (
          <p className="mt-2 text-sm text-[var(--rs-muted)]">No clear brand or model read from the image.</p>
        ) : null}
        {features.length > 0 ? (
          <>
            <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--rs-muted)]">
              Visible details
            </p>
            <ul className="flex flex-wrap gap-2">
              {features.map((f) => (
                <li
                  key={f}
                  className="rounded-lg border border-[rgba(77,166,255,0.35)] bg-[rgba(77,166,255,0.1)] px-2.5 py-1 text-xs text-[var(--rs-blue)]"
                >
                  {f}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="rounded-[var(--rs-radius)] border border-[var(--rs-border)] bg-[var(--rs-surface)] p-4">
        <h3 className="font-[family-name:var(--rs-font-head)] text-sm font-semibold text-[var(--rs-text)]">
          Mileage &amp; efficiency tips
        </h3>
        {tips.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2.5">
            {tips.map((s, i) => (
              <SuggestionCard key={`${s.title}-${i}`} s={s} index={i} />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--rs-muted)]">No suggestions returned for this run.</p>
        )}
      </section>

      {disclaimer ? (
        <p className="rounded-lg border border-dashed border-[var(--rs-border)] bg-[var(--rs-surface2)] px-3 py-2 text-xs leading-relaxed text-[var(--rs-muted)]">
          {disclaimer}
        </p>
      ) : null}
    </div>
  )
}
