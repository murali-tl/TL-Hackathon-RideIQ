import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  Bike,
  FuelEntry,
  NotificationPrefs,
  Reminder,
  ServiceRecord,
  ThemeMode,
  VaultDocument,
} from '../types'
import { computeMileage, computeMileageStats } from '../utils/mileage'
import {
  loadFuelEntries,
  loadNotificationPrefs,
  loadReminders,
  loadTheme,
  saveFuelEntries,
  saveNotificationPrefs,
  saveReminders,
  saveSelectedBikeId,
  saveTheme,
  loadGarageSelectionId,
} from '../utils/storage'
import { getInitialGarageState } from '../utils/storageInit'
import * as bikesApi from '../api/bikesApi'
import * as documentsApi from '../api/documentsApi'
import * as servicesApi from '../api/servicesApi'

type RideContextValue = {
  bikes: Bike[]
  selectedBikeId: string | null
  selectedBike: Bike | undefined
  /** True after first garage + docs + services sync from API */
  apiReady: boolean
  syncError: string | null
  clearSyncError: () => void
  setSelectedBikeId: (id: string) => void
  addBike: (input: Omit<Bike, 'id' | 'createdAt'>) => Promise<void>
  updateBike: (id: string, patch: Partial<Omit<Bike, 'id' | 'createdAt'>>) => Promise<void>
  /** Returns false if it is the only bike (keep at least one). */
  deleteBike: (id: string) => Promise<boolean>
  fuelEntries: FuelEntry[]
  documents: VaultDocument[]
  reminders: Reminder[]
  serviceRecords: ServiceRecord[]
  fuelForSelectedBike: FuelEntry[]
  documentsForSelectedBike: VaultDocument[]
  remindersForSelectedBike: Reminder[]
  serviceForSelectedBike: ServiceRecord[]
  mileageStats: ReturnType<typeof computeMileageStats>
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
  addFuelEntry: (input: Omit<FuelEntry, 'id' | 'mileage' | 'bikeId'> & { bikeId?: string }) => void
  addDocument: (
    doc: Omit<VaultDocument, 'id' | 'uploadedAt' | 'bikeId'> & { bikeId?: string; image: string },
  ) => Promise<void>
  updateDocument: (
    id: string,
    patch: Partial<Pick<VaultDocument, 'name' | 'category' | 'extraction' | 'extractionError'>>,
  ) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  deleteFuelEntry: (id: string) => void
  addReminder: (title: string, subtitle: string, bikeId?: string) => void
  deleteReminder: (id: string) => void
  addServiceRecord: (input: Omit<ServiceRecord, 'id'>) => Promise<void>
  updateServiceRecord: (id: string, patch: Partial<Omit<ServiceRecord, 'id'>>) => Promise<void>
  deleteServiceRecord: (id: string) => Promise<void>
  notificationPrefs: NotificationPrefs
  setNotificationPrefs: (p: NotificationPrefs) => void
}

const RideContext = createContext<RideContextValue | null>(null)

function applyThemeClass(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }
}

export function RideProvider({ children }: { children: ReactNode }) {
  const ig = useMemo(() => getInitialGarageState(), [])
  const [bikes, setBikes] = useState<Bike[]>(ig.bikes)
  const [selectedBikeId, setSelectedBikeIdState] = useState<string | null>(ig.selectedBikeId)
  const [apiReady, setApiReady] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>(() => loadFuelEntries())
  const [documents, setDocuments] = useState<VaultDocument[]>([])
  const [reminders, setReminders] = useState<Reminder[]>(() => loadReminders())
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [notificationPrefs, setNotificationPrefsState] = useState<NotificationPrefs>(() =>
    loadNotificationPrefs(),
  )
  const [theme, setThemeState] = useState<ThemeMode>(() => loadTheme())

  useEffect(() => {
    applyThemeClass(theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      setApiReady(false)
      setSyncError(null)
      try {
        const list = await bikesApi.fetchBikes()
        if (cancelled) return
        setBikes(list)
        const stored = loadGarageSelectionId()
        const pick =
          stored && list.some((b) => b.id === stored) ? stored : (list[0]?.id ?? null)
        setSelectedBikeIdState(pick)
        if (pick) saveSelectedBikeId(pick)

        const docLists = await Promise.all(list.map((b) => documentsApi.fetchDocumentsForBike(b.id)))
        const svcLists = await Promise.all(list.map((b) => servicesApi.fetchServicesForBike(b.id)))
        if (cancelled) return
        setDocuments(docLists.flat())
        setServiceRecords(svcLists.flat())
      } catch (e) {
        if (!cancelled) {
          setSyncError(e instanceof Error ? e.message : 'Could not reach the RideIQ API')
        }
      } finally {
        if (!cancelled) setApiReady(true)
      }
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (selectedBikeId) saveSelectedBikeId(selectedBikeId)
  }, [selectedBikeId])

  useEffect(() => {
    saveFuelEntries(fuelEntries)
  }, [fuelEntries])

  useEffect(() => {
    saveReminders(reminders)
  }, [reminders])

  useEffect(() => {
    saveNotificationPrefs(notificationPrefs)
  }, [notificationPrefs])

  const clearSyncError = useCallback(() => setSyncError(null), [])

  const selectedBike = useMemo(() => {
    if (selectedBikeId && bikes.some((b) => b.id === selectedBikeId)) {
      return bikes.find((b) => b.id === selectedBikeId)
    }
    return bikes[0]
  }, [bikes, selectedBikeId])

  const effectiveBikeId = selectedBike?.id ?? null

  const fuelForSelectedBike = useMemo(
    () => (effectiveBikeId ? fuelEntries.filter((e) => e.bikeId === effectiveBikeId) : []),
    [fuelEntries, effectiveBikeId],
  )

  const documentsForSelectedBike = useMemo(
    () => (effectiveBikeId ? documents.filter((d) => d.bikeId === effectiveBikeId) : []),
    [documents, effectiveBikeId],
  )

  const remindersForSelectedBike = useMemo(
    () => (effectiveBikeId ? reminders.filter((r) => r.bikeId === effectiveBikeId) : []),
    [reminders, effectiveBikeId],
  )

  const serviceForSelectedBike = useMemo(
    () => (effectiveBikeId ? serviceRecords.filter((s) => s.bikeId === effectiveBikeId) : []),
    [serviceRecords, effectiveBikeId],
  )

  const mileageStats = useMemo(() => computeMileageStats(fuelForSelectedBike), [fuelForSelectedBike])

  const setSelectedBikeId = useCallback((id: string) => {
    setSelectedBikeIdState(id)
    saveSelectedBikeId(id)
  }, [])

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode)
    saveTheme(mode)
    applyThemeClass(mode)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark'
      saveTheme(next)
      applyThemeClass(next)
      return next
    })
  }, [])

  const addBike = useCallback(async (input: Omit<Bike, 'id' | 'createdAt'>) => {
    try {
      const created = await bikesApi.createBikeApi(input)
      setBikes((prev) => [...prev, created])
      setSelectedBikeIdState(created.id)
      saveSelectedBikeId(created.id)
      setSyncError(null)
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Could not save bike')
      throw e
    }
  }, [])

  const updateBike = useCallback(async (id: string, patch: Partial<Omit<Bike, 'id' | 'createdAt'>>) => {
    try {
      const updated = await bikesApi.updateBikeApi(id, patch)
      setBikes((prev) => prev.map((b) => (b.id === id ? updated : b)))
      setSyncError(null)
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Could not update bike')
      throw e
    }
  }, [])

  const deleteBike = useCallback(async (id: string) => {
    if (bikes.length <= 1) return false
    try {
      await bikesApi.deleteBikeApi(id)
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Could not delete bike')
      return false
    }
    const nextBikes = bikes.filter((b) => b.id !== id)
    setBikes(nextBikes)
    setFuelEntries((fe) => fe.filter((e) => e.bikeId !== id))
    setDocuments((d) => d.filter((x) => x.bikeId !== id))
    setReminders((r) => r.filter((x) => x.bikeId !== id))
    setServiceRecords((s) => s.filter((x) => x.bikeId !== id))
    setSelectedBikeIdState((cur) => {
      if (cur === id) {
        const replacement = nextBikes[0]?.id ?? null
        if (replacement) saveSelectedBikeId(replacement)
        return replacement
      }
      return cur
    })
    setSyncError(null)
    return true
  }, [bikes])

  const setNotificationPrefs = useCallback((p: NotificationPrefs) => {
    setNotificationPrefsState(p)
  }, [])

  const addFuelEntry = useCallback(
    (input: Omit<FuelEntry, 'id' | 'mileage' | 'bikeId'> & { bikeId?: string }) => {
      const bikeId = input.bikeId ?? effectiveBikeId
      if (!bikeId) return
      const mileage = computeMileage(input.distanceKm, input.fuelLiters)
      const entry: FuelEntry = {
        ...input,
        bikeId,
        id: crypto.randomUUID(),
        mileage,
      }
      setFuelEntries((prev) => [entry, ...prev])
    },
    [effectiveBikeId],
  )

  const addDocument = useCallback(
    async (
      doc: Omit<VaultDocument, 'id' | 'uploadedAt' | 'bikeId'> & { bikeId?: string; image: string },
    ) => {
      const bikeId = doc.bikeId ?? effectiveBikeId
      if (!bikeId) return
      const extractedData: Record<string, unknown> = {
        holderName: doc.extraction.holderName,
        documentNumber: doc.extraction.documentNumber,
        expiryDateIso: doc.extraction.expiryDateIso,
        confidence: doc.extraction.confidence,
        source: doc.extraction.source,
      }
      if (doc.extractionError) extractedData.extractionError = doc.extractionError
      try {
        const created = await documentsApi.createDocumentApi({
          bikeId,
          name: doc.name,
          mimeType: doc.type,
          category: doc.category,
          image: doc.image,
          documentNumber: doc.extraction.documentNumber ?? '',
          expiryDate: doc.extraction.expiryDateIso ? `${doc.extraction.expiryDateIso}T12:00:00.000Z` : null,
          extractedData,
        })
        setDocuments((prev) => [created, ...prev])
        setSyncError(null)
      } catch (e) {
        setSyncError(e instanceof Error ? e.message : 'Could not save document')
        throw e
      }
    },
    [effectiveBikeId],
  )

  const updateDocument = useCallback(
    async (
      id: string,
      patch: Partial<Pick<VaultDocument, 'name' | 'category' | 'extraction' | 'extractionError'>>,
    ) => {
      const prev = documents.find((d) => d.id === id)
      if (!prev) return
      const extraction = {
        ...prev.extraction,
        ...patch.extraction,
      }
      const extractedData: Record<string, unknown> = {
        holderName: extraction.holderName,
        documentNumber: extraction.documentNumber,
        expiryDateIso: extraction.expiryDateIso,
        confidence: extraction.confidence,
        source: extraction.source,
      }
      if ('extractionError' in patch) {
        if (patch.extractionError) extractedData.extractionError = patch.extractionError
      } else if (prev.extractionError) {
        extractedData.extractionError = prev.extractionError
      }
      try {
        const updated = await documentsApi.updateDocumentApi(id, {
          name: patch.name ?? prev.name,
          category: patch.category ?? prev.category,
          documentNumber: extraction.documentNumber ?? '',
          expiryDate: extraction.expiryDateIso ? `${extraction.expiryDateIso}T12:00:00.000Z` : null,
          extractedData,
        })
        setDocuments((list) => list.map((d) => (d.id === id ? updated : d)))
        setSyncError(null)
      } catch (e) {
        setSyncError(e instanceof Error ? e.message : 'Could not update document')
        throw e
      }
    },
    [documents],
  )

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await documentsApi.deleteDocumentApi(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      setSyncError(null)
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Could not delete document')
      throw e
    }
  }, [])

  const deleteFuelEntry = useCallback((id: string) => {
    setFuelEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const addReminder = useCallback(
    (title: string, subtitle: string, bikeId?: string) => {
      const bid = bikeId ?? effectiveBikeId
      if (!bid) return
      const trimmedTitle = title.trim()
      const trimmedSub = subtitle.trim()
      if (!trimmedTitle) return
      setReminders((prev) => [
        {
          id: crypto.randomUUID(),
          bikeId: bid,
          title: trimmedTitle,
          subtitle: trimmedSub || 'Custom reminder',
          badge: 'ok',
          badgeText: 'New',
        },
        ...prev,
      ])
    },
    [effectiveBikeId],
  )

  const deleteReminder = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const addServiceRecord = useCallback(async (input: Omit<ServiceRecord, 'id'>) => {
    try {
      const row = await servicesApi.createServiceApi(input)
      setServiceRecords((prev) => [...prev, row])
      setSyncError(null)
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Could not save service')
      throw e
    }
  }, [])

  const updateServiceRecord = useCallback(async (id: string, patch: Partial<Omit<ServiceRecord, 'id'>>) => {
    try {
      const row = await servicesApi.updateServiceApi(id, patch)
      setServiceRecords((prev) => prev.map((s) => (s.id === id ? row : s)))
      setSyncError(null)
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Could not update service')
      throw e
    }
  }, [])

  const deleteServiceRecord = useCallback(async (id: string) => {
    try {
      await servicesApi.deleteServiceApi(id)
      setServiceRecords((prev) => prev.filter((s) => s.id !== id))
      setSyncError(null)
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Could not delete service')
      throw e
    }
  }, [])

  const value = useMemo(
    () => ({
      bikes,
      selectedBikeId,
      selectedBike,
      apiReady,
      syncError,
      clearSyncError,
      setSelectedBikeId,
      addBike,
      updateBike,
      deleteBike,
      fuelEntries,
      documents,
      reminders,
      serviceRecords,
      fuelForSelectedBike,
      documentsForSelectedBike,
      remindersForSelectedBike,
      serviceForSelectedBike,
      mileageStats,
      theme,
      setTheme,
      toggleTheme,
      addFuelEntry,
      addDocument,
      updateDocument,
      deleteDocument,
      deleteFuelEntry,
      addReminder,
      deleteReminder,
      addServiceRecord,
      updateServiceRecord,
      deleteServiceRecord,
      notificationPrefs,
      setNotificationPrefs,
    }),
    [
      bikes,
      effectiveBikeId,
      selectedBike,
      selectedBikeId,
      apiReady,
      syncError,
      clearSyncError,
      setSelectedBikeId,
      addBike,
      updateBike,
      deleteBike,
      fuelEntries,
      documents,
      reminders,
      serviceRecords,
      fuelForSelectedBike,
      documentsForSelectedBike,
      remindersForSelectedBike,
      serviceForSelectedBike,
      mileageStats,
      theme,
      setTheme,
      toggleTheme,
      addFuelEntry,
      addDocument,
      updateDocument,
      deleteDocument,
      deleteFuelEntry,
      addReminder,
      deleteReminder,
      addServiceRecord,
      updateServiceRecord,
      deleteServiceRecord,
      notificationPrefs,
      setNotificationPrefs,
    ],
  )

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>
}

export function useRide() {
  const ctx = useContext(RideContext)
  if (!ctx) throw new Error('useRide must be used within RideProvider')
  return ctx
}
