import * as pdfjs from 'pdfjs-dist'
// Vite resolves the worker as a separate asset URL.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { DocumentExtraction } from '../types'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'])

function inferMime(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  return ''
}

export class DocumentProcessError extends Error {
  code: 'file_too_large' | 'unsupported_type' | 'pdf_read' | 'ocr_failed' | 'empty_text'

  constructor(message: string, code: DocumentProcessError['code']) {
    super(message)
    this.name = 'DocumentProcessError'
    this.code = code
  }
}

export function validateUpload(file: File): void {
  if (file.size > MAX_BYTES) {
    throw new DocumentProcessError('File is larger than 10 MB.', 'file_too_large')
  }
  const mime = file.type || inferMime(file.name)
  if (!ALLOWED.has(mime)) {
    throw new DocumentProcessError('Use PDF, PNG, JPG, or WEBP (max 10 MB).', 'unsupported_type')
  }
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const data = new Uint8Array(await file.arrayBuffer())
    const pdf = await pdfjs.getDocument({ data }).promise
    let out = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      for (const item of content.items) {
        if (item && typeof item === 'object' && 'str' in item) {
          const s = (item as { str?: string }).str
          if (typeof s === 'string' && s) out += `${s} `
        }
      }
      out += '\n'
    }
    return out.replace(/\s+/g, ' ').trim()
  } catch {
    throw new DocumentProcessError('Could not read this PDF.', 'pdf_read')
  }
}

async function extractImageText(file: File, onProgress?: (p: number) => void): Promise<string> {
  try {
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng', undefined, {
      logger: (m) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          onProgress?.(Math.round(m.progress * 100))
        }
      },
    })
    const url = URL.createObjectURL(file)
    try {
      const ret = await worker.recognize(url)
      return ret.data.text.replace(/\s+/g, ' ').trim()
    } finally {
      URL.revokeObjectURL(url)
      await worker.terminate()
    }
  } catch {
    throw new DocumentProcessError('OCR could not read this image.', 'ocr_failed')
  }
}

function parseIsoDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  const mm = String(m).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

/** Try common date shapes found on IDs and certificates. */
function extractExpiryDate(text: string): string | null {
  const t = text.replace(/\u00a0/g, ' ')
  const label = /(?:valid|expiry|expires?|validity|upto|until)\s*(?:till|thru|through|on|date)?\s*[:\-]?\s*([0-3]?\d[\/\-][01]?\d[\/\-]\d{2,4})/i
  const m1 = t.match(label)
  if (m1?.[1]) {
    const iso = looseDateToIso(m1[1])
    if (iso) return iso
  }
  const isoLike = t.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/)
  if (isoLike) return isoLike[0]
  const dmy = t.match(/\b([0-3]?\d)[\/\-]([01]?\d)[\/\-](\d{2,4})\b/g)
  if (dmy?.length) {
    const last = dmy[dmy.length - 1]
    const iso = looseDateToIso(last)
    if (iso) return iso
  }
  return null
}

function looseDateToIso(raw: string): string | null {
  const p = raw.trim().split(/[\/\-]/)
  if (p.length !== 3) return null
  let d = Number(p[0])
  let mo = Number(p[1])
  let y = Number(p[2])
  if (y < 100) y += y >= 70 ? 1900 : 2000
  if (y < 1950 || y > 2100) return null
  if (d > 12 && mo <= 12) {
    const tmp = d
    d = mo
    mo = tmp
  }
  return parseIsoDate(y, mo, d)
}

/** Indian DL-style and generic long alphanumeric IDs. */
function extractDocumentNumber(text: string): string | null {
  const compact = text.replace(/\s+/g, '').toUpperCase()
  const dl = compact.match(/\b([A-Z]{2}\d{2}(?:19|20)\d{9,11})\b/)
  if (dl) return dl[1]
  const spaced = text.toUpperCase().match(/\b([A-Z]{2}\s?\d{2}\s?(?:19|20)\d{2}\s?\d{7,8})\b/)
  if (spaced) return spaced[1].replace(/\s+/g, '')
  const generic = text.match(/\b([A-Z0-9]{8,20})\b/)
  return generic ? generic[1] : null
}

function extractHolderName(text: string): string | null {
  const patterns = [
    /(?:name|holder|name\s*of\s*holder)\s*[:\-]\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4})/i,
    /(?:son|daughter)\s*(?:of|\/)\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1]) {
      const name = m[1].trim()
      if (name.length > 2 && name.length < 80) return name
    }
  }
  return null
}

export function parseFieldsFromText(text: string, source: DocumentExtraction['source']): DocumentExtraction {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) {
    return {
      holderName: null,
      documentNumber: null,
      expiryDateIso: null,
      confidence: 'low',
      source,
    }
  }
  const holderName = extractHolderName(cleaned)
  const documentNumber = extractDocumentNumber(cleaned)
  const expiryDateIso = extractExpiryDate(cleaned)
  const hits = [holderName, documentNumber, expiryDateIso].filter(Boolean).length
  const confidence: DocumentExtraction['confidence'] =
    hits >= 2 ? 'high' : hits === 1 ? 'medium' : 'low'
  return { holderName, documentNumber, expiryDateIso, confidence, source }
}

export async function extractDocumentFields(
  file: File,
  onOcrProgress?: (pct: number) => void,
): Promise<DocumentExtraction> {
  validateUpload(file)
  const mime = file.type || inferMime(file.name)
  let raw = ''
  if (mime === 'application/pdf') {
    raw = await extractPdfText(file)
    if (!raw) throw new DocumentProcessError('No selectable text found in this PDF.', 'empty_text')
    return parseFieldsFromText(raw, 'pdf-text')
  }
  if (mime.startsWith('image/')) {
    raw = await extractImageText(file, onOcrProgress)
    if (!raw) throw new DocumentProcessError('No text detected in this image.', 'empty_text')
    return parseFieldsFromText(raw, 'ocr')
  }
  throw new DocumentProcessError('Unsupported file type.', 'unsupported_type')
}
