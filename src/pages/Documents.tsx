import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, Select, TextInput } from '../components/Form'
import { useRide } from '../hooks/useRide'
import { Button } from '../components/ui/Button'
import { RsCard } from '../components/ui/RsCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { VaultDocument } from '../types'
import { DocumentProcessError, extractDocumentFields } from '../utils/documentExtraction'
import { inferDocumentCategory } from '../utils/documentCategory'
import { documentExpiryState, extractionSummary } from '../utils/docDisplay'
import { emptyExtraction } from '../utils/storage'

function friendlyType(mime: string) {
  if (!mime) return 'Unknown'
  const [main, sub] = mime.split('/')
  if (main === 'application' && sub) return sub.toUpperCase()
  if (main === 'image') return 'Image'
  return mime
}

function docEmoji(cat: VaultDocument['category']) {
  switch (cat) {
    case 'license':
      return '🪪'
    case 'rc':
      return '📋'
    case 'insurance':
      return '🛡️'
    case 'puc':
      return '🌫️'
    default:
      return '📎'
  }
}

function statusPill(doc: VaultDocument) {
  const s = documentExpiryState(doc)
  const cls =
    s.tone === 'green'
      ? 'bg-[rgba(34,201,122,0.12)] text-[var(--rs-green)]'
      : s.tone === 'amber'
        ? 'bg-[rgba(255,160,64,0.15)] text-[var(--rs-accent2)]'
        : s.tone === 'red'
          ? 'bg-[rgba(255,85,85,0.15)] text-[var(--rs-red)]'
          : 'bg-[rgba(255,92,26,0.15)] text-[var(--rs-accent)]'
  return <span className={`ml-auto shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${cls}`}>{s.label}</span>
}

type ExEdit = { holderName: string; documentNumber: string; expiryDateIso: string }

export default function Documents() {
  const { documentsForSelectedBike, selectedBike, addDocument, updateDocument } = useRide()
  const [busy, setBusy] = useState(false)
  const [ocrPct, setOcrPct] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = documentsForSelectedBike.find((d) => d.id === selectedId)
  const [exEdit, setExEdit] = useState<ExEdit>({ holderName: '', documentNumber: '', expiryDateIso: '' })

  useEffect(() => {
    if (!selectedId) return
    const d = documentsForSelectedBike.find((x) => x.id === selectedId)
    if (!d) return
    setExEdit({
      holderName: d.extraction.holderName ?? '',
      documentNumber: d.extraction.documentNumber ?? '',
      expiryDateIso: d.extraction.expiryDateIso ?? '',
    })
  }, [selectedId, documentsForSelectedBike])

  async function onPick(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file || !selectedBike) return
    setError(null)
    setOcrPct(null)
    setBusy(true)
    const mime = file.type || inferMimeFromName(file.name)
    const category = inferDocumentCategory(file.name)
    try {
      const extraction = await extractDocumentFields(file, (p) => setOcrPct(p))
      addDocument({
        bikeId: selectedBike.id,
        name: file.name,
        type: mime,
        category,
        extraction,
      })
    } catch (err) {
      const msg =
        err instanceof DocumentProcessError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Something went wrong processing this file.'
      addDocument({
        bikeId: selectedBike.id,
        name: file.name,
        type: mime,
        category,
        extraction: emptyExtraction(),
        extractionError: msg,
      })
      setError(msg)
    } finally {
      setBusy(false)
      setOcrPct(null)
    }
  }

  function onSaveExtraction(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    updateDocument(selected.id, {
      extraction: {
        ...selected.extraction,
        holderName: exEdit.holderName.trim() || null,
        documentNumber: exEdit.documentNumber.trim() || null,
        expiryDateIso: exEdit.expiryDateIso.trim() || null,
        confidence: 'high',
        source: selected.extraction.source,
      },
      extractionError: undefined,
    })
  }

  if (!selectedBike) {
    return (
      <p className="text-center text-sm text-[var(--rs-muted)]">
        <Link to="/bikes" className="text-[var(--rs-accent)]">
          Add a bike
        </Link>{' '}
        to attach documents.
      </p>
    )
  }

  return (
    <div>
      <p className="mb-2 text-[11px] text-[var(--rs-muted)]">
        Documents for <span className="font-medium text-[var(--rs-text)]">{selectedBike.registrationNumber}</span> ·{' '}
        <Link to="/bikes" className="text-[var(--rs-accent)]">
          Edit bike in Garage
        </Link>
      </p>

      <SectionHeading>My documents</SectionHeading>

      {error ? (
        <div
          className="mb-3 rounded-[var(--rs-radius)] border border-[rgba(255,85,85,0.35)] bg-[rgba(220,50,50,0.08)] px-3 py-2 text-xs text-[var(--rs-text)]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {documentsForSelectedBike.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => setSelectedId(d.id === selectedId ? null : d.id)}
          className="mb-2 flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-[var(--rs-border)] bg-[var(--rs-surface2)] p-3 text-left transition hover:border-[var(--rs-accent)]"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
            style={{ background: 'rgba(77,166,255,0.1)' }}
            aria-hidden
          >
            {docEmoji(d.category)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-[var(--rs-text)]">{d.name}</div>
            <div className="mt-0.5 truncate text-[11px] text-[var(--rs-muted)]">{extractionSummary(d.extraction)}</div>
            {d.extractionError ? (
              <div className="mt-1 text-[11px] text-[var(--rs-accent)]">Issue: {d.extractionError}</div>
            ) : null}
          </div>
          {statusPill(d)}
        </button>
      ))}

      {selected ? (
        <>
          <RsCard title="Document details" subtitle={selected.name}>
            <dl className="mb-3 grid gap-2 text-xs">
              <div className="flex justify-between gap-2 border-b border-[var(--rs-border)] py-1">
                <dt className="text-[var(--rs-muted)]">Category</dt>
                <dd className="text-right font-medium capitalize text-[var(--rs-text)]">{selected.category}</dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-[var(--rs-border)] py-1">
                <dt className="text-[var(--rs-muted)]">File type</dt>
                <dd className="text-right font-medium text-[var(--rs-text)]">{friendlyType(selected.type)}</dd>
              </div>
              <div className="flex justify-between gap-2 py-1">
                <dt className="text-[var(--rs-muted)]">Parse confidence</dt>
                <dd className="text-right font-medium capitalize text-[var(--rs-text)]">{selected.extraction.confidence}</dd>
              </div>
            </dl>

            <form onSubmit={onSaveExtraction} className="space-y-2 border-t border-[var(--rs-border)] pt-3">
              <p className="text-[11px] text-[var(--rs-muted)]">Correct OCR / PDF fields manually if needed.</p>
              <Field label="Name on document" htmlFor="ex-name">
                <TextInput
                  id="ex-name"
                  value={exEdit.holderName}
                  onChange={(ev) => setExEdit((x) => ({ ...x, holderName: ev.target.value }))}
                />
              </Field>
              <Field label="Document number" htmlFor="ex-num">
                <TextInput
                  id="ex-num"
                  value={exEdit.documentNumber}
                  onChange={(ev) => setExEdit((x) => ({ ...x, documentNumber: ev.target.value }))}
                />
              </Field>
              <Field label="Expiry (yyyy-mm-dd)" htmlFor="ex-exp">
                <TextInput
                  id="ex-exp"
                  placeholder="2027-12-31"
                  value={exEdit.expiryDateIso}
                  onChange={(ev) => setExEdit((x) => ({ ...x, expiryDateIso: ev.target.value }))}
                />
              </Field>
              <Field label="Category override" htmlFor="ex-cat">
                <Select
                  id="ex-cat"
                  value={selected.category}
                  onChange={(ev) =>
                    updateDocument(selected.id, { category: ev.target.value as VaultDocument['category'] })
                  }
                  aria-label="Document category"
                >
                  <option value="license">License</option>
                  <option value="rc">RC</option>
                  <option value="insurance">Insurance</option>
                  <option value="puc">PUC</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Button type="submit" className="w-full">
                Save extracted fields
              </Button>
            </form>
          </RsCard>
        </>
      ) : null}

      <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-[var(--rs-radius)] border border-dashed border-[var(--rs-border)] bg-[var(--rs-surface)] px-4 py-4 transition hover:border-[var(--rs-accent)]">
        <span className="text-lg" aria-hidden>
          📎
        </span>
        <div>
          <div className="text-[13px] font-medium text-[var(--rs-text)]">
            {busy ? `Processing${ocrPct != null ? ` · OCR ${ocrPct}%` : '…'}` : 'Upload new document'}
          </div>
          <div className="text-[11px] text-[var(--rs-muted)]">PDF, PNG, JPG, WEBP — max 10 MB · processed locally</div>
        </div>
        <input type="file" className="sr-only" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={onPick} disabled={busy} />
      </label>
    </div>
  )
}

function inferMimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  return 'application/octet-stream'
}
