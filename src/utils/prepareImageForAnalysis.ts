const MAX_EDGE = 768
const JPEG_QUALITY = 0.82

/**
 * Downscale + JPEG before upload so local vision models run faster.
 */
export async function prepareImageForAnalysis(file: File): Promise<File> {
  if (!/^image\//i.test(file.type)) return file

  try {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('decode'))
      img.src = url
    })

    const iw = img.naturalWidth
    const ih = img.naturalHeight
    URL.revokeObjectURL(url)
    if (!iw || !ih) return file

    const scale = Math.min(1, MAX_EDGE / Math.max(iw, ih))
    const w = Math.max(1, Math.round(iw * scale))
    const h = Math.max(1, Math.round(ih * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, w, h)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob'))),
        'image/jpeg',
        JPEG_QUALITY,
      )
    })

    const base = file.name.replace(/\.[^.]+$/i, '') || 'bike'
    return new File([blob], `${base}-rideiq.jpg`, { type: 'image/jpeg' })
  } catch {
    return file
  }
}
