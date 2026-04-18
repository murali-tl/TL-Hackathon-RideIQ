import type { ChangeEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { BikeAnalysisView } from '../components/BikeAnalysisView'
import { Button } from '../components/ui/Button'
import { RsCard } from '../components/ui/RsCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { apiPath } from '../utils/apiBase'
import { prepareImageForAnalysis } from '../utils/prepareImageForAnalysis'

type ModelsPayload = {
  bike_scan_provider?: 'ollama'
  gemini_configured?: boolean
  gemini_model?: string
  ollama_url?: string
  configured_vision_model?: string
  models?: { name?: string }[]
  hint?: string
}

type AnalyzePayload = {
  model: string
  vision_provider?: 'ollama'
  mime_type: string
  analysis: unknown
  raw_model_text: string
}

type Envelope<T> = { success: boolean; data?: T; message?: string }

export default function BikeScan() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [modelsInfo, setModelsInfo] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzePayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadModels = useCallback(async () => {
    try {
      const res = await fetch(apiPath('/api/ai/models'), { credentials: 'include' })
      const body = (await res.json()) as Envelope<ModelsPayload>
      if (!res.ok || !body.success || !body.data) {
        setModelsInfo(body.message ?? 'Could not load model list.')
        return
      }
      const n = body.data.models?.length ?? 0
      const ollamaLine = `${n} model(s) on ${body.data.ollama_url ?? 'Ollama'}. Bike scan uses: ${body.data.configured_vision_model ?? '—'}.`
      const hint = body.data.hint ? ` ${body.data.hint}` : ''
      setModelsInfo(`${ollamaLine}${hint}`)
    } catch {
      setModelsInfo('Could not reach backend or Ollama for /api/ai/models.')
    }
  }, [])

  useEffect(() => {
    void loadModels()
  }, [loadModels])

  const onPick = (ev: ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0] ?? null
    ev.target.value = ''
    setError(null)
    setResult(null)
    setFile(f)
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return f ? URL.createObjectURL(f) : null
    })
  }

  const runAnalyze = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const imageToSend = await prepareImageForAnalysis(file)
      const fd = new FormData()
      fd.append('image', imageToSend)
      const res = await fetch(apiPath('/api/ai/analyze-bike-image'), {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      const body = (await res.json()) as Envelope<AnalyzePayload>
      if (!res.ok || !body.success || !body.data) {
        setError(body.message ?? `Request failed (${res.status})`)
        return
      }
      setResult(body.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <RsCard title="Bike photo AI" action={null}>
        <p className="text-sm leading-relaxed text-[var(--rs-muted)]">
          Upload a photo of your bike. This page always uses your machine&apos;s <strong>Ollama</strong> vision model (
          <code className="text-[var(--rs-text)]">OLLAMA_VISION_MODEL</code>). Documents and dashboard tips use{' '}
          <strong>Gemini</strong> when <code className="text-[var(--rs-text)]">GEMINI_API_KEY</code> is set on the
          server. Photos are resized in the browser before upload.
        </p>
        {modelsInfo ? <p className="mt-2 text-xs text-[var(--rs-muted)]">{modelsInfo}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-lg border border-[var(--rs-border)] bg-[var(--rs-surface2)] px-3 py-2 text-sm font-medium text-[var(--rs-text)] hover:border-[var(--rs-accent)]">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onPick} />
            Choose image
          </label>
          <Button type="button" variant="primary" disabled={!file || busy} onClick={() => void runAnalyze()}>
            {busy ? 'Analyzing…' : 'Analyze'}
          </Button>
          <Button type="button" variant="muted" disabled={busy} onClick={() => void loadModels()}>
            Refresh models
          </Button>
        </div>
        {preview ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-[var(--rs-border)] bg-black/20">
            <img src={preview} alt="" className="max-h-[min(420px,50vh)] w-full object-contain" />
          </div>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-lg border border-[var(--rs-red)]/40 bg-[rgba(255,85,85,0.08)] px-3 py-2 text-sm text-[var(--rs-red)]">
            {error}
          </p>
        ) : null}
      </RsCard>

      {result ? (
        <>
          <SectionHeading>Analysis</SectionHeading>
          <RsCard title="Analysis" action={null}>
            <BikeAnalysisView analysis={result.analysis} model={result.model} mime_type={result.mime_type} />
            <details className="mt-4 text-sm text-[var(--rs-muted)]">
              <summary className="cursor-pointer font-medium text-[var(--rs-text)]">Raw JSON</summary>
              <pre className="mt-2 max-h-[min(360px,45vh)] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--rs-border)] bg-[var(--rs-surface2)] p-3 font-mono text-xs text-[var(--rs-text)]">
                {JSON.stringify(result.analysis, null, 2)}
              </pre>
            </details>
            <details className="mt-2 text-sm text-[var(--rs-muted)]">
              <summary className="cursor-pointer font-medium text-[var(--rs-text)]">Raw model text</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs">{result.raw_model_text}</pre>
            </details>
          </RsCard>
        </>
      ) : null}
    </div>
  )
}
