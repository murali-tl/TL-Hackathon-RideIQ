import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Field, Select, TextInput } from '../components/Form'
import { BIKE_BRAND_OPTIONS, BIKE_CATEGORY_OPTIONS, buildYearOptions, TYPICAL_KMPL_PRESET_NUMS } from '../data/bikeFormOptions'
import { useRide } from '../hooks/useRide'
import { Button } from '../components/ui/Button'
import { RsCard } from '../components/ui/RsCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { Bike, BikeFuelType } from '../types'
import { lookupBikeModel } from '../utils/bikeLookup'

const YEAR_OPTIONS = buildYearOptions()
const KMPL_PRESET_VALUES: string[] = [...TYPICAL_KMPL_PRESET_NUMS]

type Draft = {
  brand: string
  model: string
  year: string
  registrationNumber: string
  fuelType: BikeFuelType
  engineCc: string
  category: string
  claimedMileageKmL: string
  fuelSystem: Bike['fuelSystem']
}

function emptyDraft(): Draft {
  return {
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    registrationNumber: '',
    fuelType: 'Petrol',
    engineCc: '',
    category: 'Commuter',
    claimedMileageKmL: '45',
    fuelSystem: 'Fuel Injected',
  }
}

export default function Garage() {
  const { bikes, selectedBikeId, setSelectedBikeId, addBike, updateBike, deleteBike } = useRide()
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modelQuery, setModelQuery] = useState('')
  const [lookupBusy, setLookupBusy] = useState(false)
  const [lookupHint, setLookupHint] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)

  const brandSelectOptions = useMemo(() => {
    const base = [...BIKE_BRAND_OPTIONS] as string[]
    if (draft.brand && !base.includes(draft.brand)) {
      return [draft.brand, ...base]
    }
    return base
  }, [draft.brand])

  const categorySelectOptions = useMemo(() => {
    const base = [...BIKE_CATEGORY_OPTIONS] as string[]
    if (draft.category && !base.includes(draft.category)) {
      return [draft.category, ...base]
    }
    return base
  }, [draft.category])

  const yearSelectOptions = useMemo(() => {
    if (draft.year && !YEAR_OPTIONS.includes(draft.year)) {
      return [draft.year, ...YEAR_OPTIONS]
    }
    return YEAR_OPTIONS
  }, [draft.year])

  const kmplSelectValue =
    draft.claimedMileageKmL === 'Custom' ||
    (draft.claimedMileageKmL !== '' && !KMPL_PRESET_VALUES.includes(draft.claimedMileageKmL))
      ? 'Custom'
      : draft.claimedMileageKmL || '45'

  function openAdd() {
    setMode('add')
    setEditingId(null)
    setDraft(emptyDraft())
    setModelQuery('')
    setLookupHint(null)
  }

  function openEdit(b: Bike) {
    setMode('edit')
    setEditingId(b.id)
    setDraft({
      brand: b.brand,
      model: b.model,
      year: b.year,
      registrationNumber: b.registrationNumber,
      fuelType: b.fuelType,
      engineCc: b.engineCc,
      category: b.category,
      claimedMileageKmL: String(b.claimedMileageKmL ?? ''),
      fuelSystem: b.fuelSystem,
    })
    setModelQuery(`${b.brand} ${b.model}`)
    setLookupHint(null)
  }

  async function runLookup() {
    setLookupBusy(true)
    setLookupHint(null)
    try {
      const res = await lookupBikeModel(modelQuery || `${draft.brand} ${draft.model}`.trim())
      if (res.ok) {
        setDraft((d) => ({
          ...d,
          brand: res.draft.brand,
          model: res.draft.model,
          engineCc: res.draft.engineCc,
          category: res.draft.category,
          claimedMileageKmL: String(res.draft.claimedMileageKmL),
          fuelType: res.draft.fuelType,
          fuelSystem: res.draft.fuelSystem,
        }))
        setLookupHint(`Auto-filled from ${res.source} lookup — review and add registration.`)
      } else {
        setLookupHint(res.message)
      }
    } catch {
      setLookupHint('Lookup failed (network). Enter details manually.')
    } finally {
      setLookupBusy(false)
    }
  }

  function onSave(e: FormEvent) {
    e.preventDefault()
    const km = parseFloat(draft.claimedMileageKmL)
    const payload: Omit<Bike, 'id' | 'createdAt'> = {
      brand: draft.brand.trim(),
      model: draft.model.trim(),
      year: draft.year.trim(),
      registrationNumber: draft.registrationNumber.trim(),
      fuelType: draft.fuelType,
      engineCc: draft.engineCc.trim() || '—',
      category: draft.category.trim() || 'Motorcycle',
      claimedMileageKmL: Number.isFinite(km) ? km : undefined,
      fuelSystem: draft.fuelSystem,
    }
    if (!payload.brand || !payload.model || !payload.registrationNumber) return
    if (mode === 'edit' && editingId) {
      updateBike(editingId, payload)
      setMode('list')
      return
    }
    addBike(payload)
    setMode('list')
  }

  function onTryDelete(id: string) {
    if (!window.confirm('Delete this bike and all fuel logs, documents, reminders, and service records for it?')) return
    const ok = deleteBike(id)
    if (!ok) window.alert('Keep at least one bike in the garage.')
  }

  if (mode === 'add' || mode === 'edit') {
    return (
      <div>
        <RsCard
          title={mode === 'add' ? 'Add bike' : 'Edit bike'}
          action={
            <button type="button" className="text-xs text-[var(--rs-muted)] hover:text-[var(--rs-accent)]" onClick={() => setMode('list')}>
              Cancel
            </button>
          }
        >
          <p className="mb-3 text-xs text-[var(--rs-muted)]">
            Enter a model name and run smart lookup (curated + Wikidata + optional API). If nothing matches, fill every
            field manually — all saves stay on-device.
          </p>
          <div className="mb-3 flex gap-2">
            <Field label="Model search" htmlFor="mq">
              <TextInput
                id="mq"
                value={modelQuery}
                onChange={(ev) => setModelQuery(ev.target.value)}
                placeholder="e.g. Honda Shine 125"
              />
            </Field>
            <div className="flex flex-col justify-end">
              <Button type="button" variant="outline" className="!py-2.5 !text-xs" disabled={lookupBusy} onClick={runLookup}>
                {lookupBusy ? '…' : 'Look up'}
              </Button>
            </div>
          </div>
          {lookupHint ? <p className="mb-3 text-xs text-[var(--rs-accent2)]">{lookupHint}</p> : null}

          <form onSubmit={onSave} className="space-y-1">
            <div className="flex gap-2.5">
              <Field label="Brand" htmlFor="br">
                <Select
                  id="br"
                  value={draft.brand}
                  onChange={(ev) => setDraft((d) => ({ ...d, brand: ev.target.value }))}
                  aria-label="Brand"
                  required
                >
                  <option value="">Select brand…</option>
                  {brandSelectOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Model" htmlFor="md">
                <TextInput id="md" value={draft.model} onChange={(ev) => setDraft((d) => ({ ...d, model: ev.target.value }))} required />
              </Field>
            </div>
            <div className="flex gap-2.5">
              <Field label="Year" htmlFor="yr">
                <Select
                  id="yr"
                  value={draft.year}
                  onChange={(ev) => setDraft((d) => ({ ...d, year: ev.target.value }))}
                  aria-label="Year"
                  required
                >
                  <option value="">Select year…</option>
                  {yearSelectOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Registration" htmlFor="reg">
                <TextInput
                  id="reg"
                  value={draft.registrationNumber}
                  onChange={(ev) => setDraft((d) => ({ ...d, registrationNumber: ev.target.value }))}
                  required
                />
              </Field>
            </div>
            <div className="flex gap-2.5">
              <Field label="Fuel type" htmlFor="ft">
                <Select
                  id="ft"
                  value={draft.fuelType}
                  onChange={(ev) => setDraft((d) => ({ ...d, fuelType: ev.target.value as BikeFuelType }))}
                  aria-label="Fuel type"
                >
                  <option>Petrol</option>
                  <option>Electric</option>
                  <option>CNG</option>
                  <option>Not applicable</option>
                </Select>
              </Field>
              <Field label="Engine (cc)" htmlFor="cc">
                <TextInput id="cc" value={draft.engineCc} onChange={(ev) => setDraft((d) => ({ ...d, engineCc: ev.target.value }))} />
              </Field>
            </div>
            <div className="flex gap-2.5">
              <Field label="Category" htmlFor="cat">
                <Select
                  id="cat"
                  value={draft.category}
                  onChange={(ev) => setDraft((d) => ({ ...d, category: ev.target.value }))}
                  aria-label="Category"
                >
                  {categorySelectOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Typical km/L" htmlFor="km-sel">
                <Select
                  id="km-sel"
                  value={kmplSelectValue}
                  onChange={(ev) => {
                    const v = ev.target.value
                    if (v === 'Custom') setDraft((d) => ({ ...d, claimedMileageKmL: '' }))
                    else setDraft((d) => ({ ...d, claimedMileageKmL: v }))
                  }}
                  aria-label="Typical fuel economy"
                >
                  {KMPL_PRESET_VALUES.map((k) => (
                    <option key={k} value={k}>
                      {k} km/L
                    </option>
                  ))}
                  <option value="Custom">Custom…</option>
                </Select>
              </Field>
            </div>
            {kmplSelectValue === 'Custom' ? (
              <Field label="Custom km/L" htmlFor="km-custom">
                <TextInput
                  id="km-custom"
                  inputMode="decimal"
                  placeholder="e.g. 48"
                  value={draft.claimedMileageKmL}
                  onChange={(ev) => setDraft((d) => ({ ...d, claimedMileageKmL: ev.target.value }))}
                />
              </Field>
            ) : null}
            <Field label="Fuel system" htmlFor="fs">
              <Select
                id="fs"
                value={draft.fuelSystem}
                onChange={(ev) => setDraft((d) => ({ ...d, fuelSystem: ev.target.value as Bike['fuelSystem'] }))}
                aria-label="Fuel system"
              >
                <option>Fuel Injected</option>
                <option>Carburetor</option>
              </Select>
            </Field>
            <Button type="submit" className="mt-2 w-full">
              {mode === 'edit' ? 'Save changes' : 'Save bike'}
            </Button>
          </form>
        </RsCard>
      </div>
    )
  }

  return (
    <div>
      <SectionHeading>Your garage</SectionHeading>
      <Button type="button" className="mb-3 w-full" onClick={openAdd}>
        + Add bike
      </Button>
      {bikes.map((b) => (
        <RsCard key={b.id} className="!mb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-[family-name:var(--rs-font-head)] text-base font-bold text-[var(--rs-text)]">
                {b.brand} {b.model}
              </h3>
              <p className="mt-1 text-xs text-[var(--rs-muted)]">{b.registrationNumber}</p>
              <p className="mt-1 text-[11px] text-[var(--rs-muted)]">
                {b.year} · {b.engineCc} cc · {b.fuelType} · {b.category}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Button type="button" variant="outline" className="!px-2 !py-1.5 !text-[11px]" onClick={() => setSelectedBikeId(b.id)}>
                {b.id === selectedBikeId ? 'Active' : 'Select'}
              </Button>
              <Button type="button" variant="muted" className="!px-2 !py-1.5 !text-[11px]" onClick={() => openEdit(b)}>
                Edit
              </Button>
              <Button type="button" variant="muted" className="!px-2 !py-1.5 !text-[11px]" onClick={() => onTryDelete(b.id)}>
                Delete
              </Button>
            </div>
          </div>
        </RsCard>
      ))}
    </div>
  )
}
