import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { extractDocumentWithGemini } from '../api/aiApi'
import { BikeSelectDropdown } from '../components/BikeSelectDropdown'
import { Field, Select, TextInput } from '../components/Form'
import { IconTrash } from '../components/icons'
import { useRide } from '../hooks/useRide'
import { Button } from '../components/ui/Button'
import { RsCard } from '../components/ui/RsCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { DocumentExtraction, VaultDocument } from '../types'
import { DocumentProcessError, extractDocumentFields, validateUpload } from '../utils/documentExtraction'
import { inferDocumentCategory } from '../utils/documentCategory'
import { documentExpiryState, extractionSummary } from '../utils/docDisplay'
import { fileToDataUrl } from '../utils/fileToBase64'
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
  const { bikes, documentsForSelectedBike, selectedBike, addDocument, updateDocument, deleteDocument, apiReady } =
    useRide()
  const [busy, setBusy] = useState(false)
  const [ocrPct, setOcrPct] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = documentsForSelectedBike.find((d) => d.id === selectedId)
  const [exEdit, setExEdit] = useState<ExEdit>({ holderName: '', documentNumber: '', expiryDateIso: '' })

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)

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

  const processDocument = useCallback(
    async (file: File, displayName: string) => {
      if (!selectedBike || !apiReady) return
      const nameForMeta = displayName.trim() || file.name
      setError(null)
      setOcrPct(null)
      setBusy(true)
      try {
        validateUpload(file)
      } catch (err) {
        setBusy(false)
        const msg = err instanceof DocumentProcessError ? err.message : 'Invalid file.'
        setError(msg)
        return
      }
      const mime = file.type || inferMimeFromName(file.name)
      const category = inferDocumentCategory(nameForMeta)
      let extraction: DocumentExtraction
      let extractionError: string | undefined
      let dataUrl: string
      try {
        dataUrl = await fileToDataUrl(file)
      } catch {
        setBusy(false)
        setError('Could not read this file.')
        return
      }
      try {
        const g = await extractDocumentWithGemini({
          imageBase64: dataUrl,
          mimeType: mime,
          fileName: nameForMeta,
          category,
        })
        extraction = {
          holderName: g.holderName,
          documentNumber: g.documentNumber,
          expiryDateIso: g.expiryDateIso,
          confidence: g.confidence,
          source: 'gemini',
        }
      } catch {
        try {
          extraction = await extractDocumentFields(file, (p) => setOcrPct(p))
        } catch (err) {
          const msg =
            err instanceof DocumentProcessError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Something went wrong processing this file.'
          extraction = emptyExtraction('none')
          extractionError = msg
          setError(msg)
        }
      }
      try {
        await addDocument({
          bikeId: selectedBike.id,
          name: nameForMeta,
          type: mime,
          category,
          extraction,
          extractionError,
          image: dataUrl,
        })
      } catch {
        setError((prev) => prev ?? 'Could not save document to the server.')
      } finally {
        setBusy(false)
        setOcrPct(null)
      }
    },
    [addDocument, apiReady, selectedBike],
  )

  function openUploadModal() {
    setUploadName('')
    setPendingFile(null)
    setError(null)
    setUploadOpen(true)
  }

  function onModalFile(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0] ?? null
    setPendingFile(file)
    if (file && !uploadName.trim()) {
      setUploadName(file.name.replace(/\.[^.]+$/, '') || file.name)
    }
  }

  async function onModalSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pendingFile) {
      setError('Choose a file to upload.')
      return
    }
    const label = uploadName.trim() || pendingFile.name
    setUploadOpen(false)
    await processDocument(pendingFile, label)
    setPendingFile(null)
    setUploadName('')
  }

  async function onDeleteDocument(doc: VaultDocument) {
    if (!confirm(`Delete “${doc.name}”? This cannot be undone.`)) return
    try {
      await deleteDocument(doc.id)
      if (selectedId === doc.id) setSelectedId(null)
    } catch {
      /* syncError */
    }
  }

  async function onSaveExtraction(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    try {
      await updateDocument(selected.id, {
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
    } catch {
      /* context syncError */
    }
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
      <div className="mb-4 max-w-md space-y-3">
        {bikes.length > 1 ? <BikeSelectDropdown id="docs-bike" label="Documents for bike" /> : null}
        <p className="text-[11px] text-[var(--rs-muted)]">
          Showing docs for{' '}
          <span className="font-medium text-[var(--rs-text)]">{selectedBike.registrationNumber}</span> ·{' '}
          <Link to="/bikes" className="text-[var(--rs-accent)]">
            Garage
          </Link>
        </p>
      </div>

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
        <div
          key={d.id}
          className="mb-2 flex items-center gap-2 rounded-[10px] border border-[var(--rs-border)] bg-[var(--rs-surface2)] p-2 pl-3 transition hover:border-[var(--rs-accent)]"
        >
          <button
            type="button"
            onClick={() => setSelectedId(d.id === selectedId ? null : d.id)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg py-1 text-left"
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
          <button
            type="button"
            className="shrink-0 rounded-lg p-2.5 text-[var(--rs-muted)] transition hover:bg-[rgba(255,85,85,0.12)] hover:text-[var(--rs-red)]"
            aria-label={`Delete ${d.name}`}
            onClick={() => void onDeleteDocument(d)}
          >
            <IconTrash className="h-5 w-5" />
          </button>
        </div>
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
              <p className="text-[11px] text-[var(--rs-muted)]">Correct OCR / PDF / Gemini fields manually if needed.</p>
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
                  onChange={(ev) => {
                    const cat = ev.target.value as VaultDocument['category']
                    void updateDocument(selected.id, { category: cat }).catch(() => {})
                  }}
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
              <Button
                type="button"
                variant="muted"
                className="w-full !border-[rgba(255,85,85,0.45)] !text-[var(--rs-red)] hover:!bg-[rgba(255,85,85,0.1)]"
                onClick={() => void onDeleteDocument(selected)}
              >
                <IconTrash className="h-4 w-4 shrink-0" />
                Delete document
              </Button>
            </form>
          </RsCard>
        </>
      ) : null}

      <button
        type="button"
        disabled={busy || !apiReady}
        onClick={openUploadModal}
        className="mb-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rs-radius)] border border-dashed border-[var(--rs-border)] bg-[var(--rs-surface)] px-4 py-4 text-left transition hover:border-[var(--rs-accent)] disabled:pointer-events-none disabled:opacity-50"
      >
        <span className="text-lg" aria-hidden>
          📎
        </span>
        <div>
          <div className="text-[13px] font-medium text-[var(--rs-text)]">
            {busy ? `Processing${ocrPct != null ? ` · OCR ${ocrPct}%` : '…'}` : 'Upload new document'}
          </div>
          <div className="text-[11px] text-[var(--rs-muted)]">
            PDF, PNG, JPG, WEBP — max 10 MB · Name your document before upload
          </div>
        </div>
      </button>

      {uploadOpen ? (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/55 p-4 sm:items-center"
          role="presentation"
          onClick={() => !busy && setUploadOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-doc-title"
            className="w-full max-w-md rounded-[var(--rs-radius)] border border-[var(--rs-border)] bg-[var(--rs-surface)] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="upload-doc-title" className="font-[family-name:var(--rs-font-head)] text-lg font-bold text-[var(--rs-text)]">
              Upload document
            </h2>
            <p className="mt-1 text-xs text-[var(--rs-muted)]">Enter a display name and choose a file for {selectedBike.registrationNumber}.</p>
            <form onSubmit={onModalSubmit} className="mt-4 space-y-3">
              <Field label="Document name" htmlFor="upload-doc-name">
                <TextInput
                  id="upload-doc-name"
                  placeholder="e.g. Insurance policy 2025"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  autoFocus
                />
              </Field>
              <Field label="File" htmlFor="upload-doc-file">
                <input
                  id="upload-doc-file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={onModalFile}
                  className="w-full rounded-lg border border-[var(--rs-border)] bg-[var(--rs-surface2)] px-3 py-2 text-[13px] text-[var(--rs-text)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--rs-accent)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                />
              </Field>
              {pendingFile ? (
                <p className="text-[11px] text-[var(--rs-muted)]">
                  Selected: <span className="text-[var(--rs-text)]">{pendingFile.name}</span>
                </p>
              ) : null}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="muted"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => !busy && setUploadOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={busy || !pendingFile}>
                  {busy ? 'Processing…' : 'Upload & extract'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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
