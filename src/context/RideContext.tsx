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
  loadDocuments,
  loadFuelEntries,
  loadNotificationPrefs,
  loadReminders,
  loadServiceHistory,
  loadTheme,
  saveBikes,
  saveDocuments,
  saveFuelEntries,
  saveNotificationPrefs,
  saveReminders,
  saveSelectedBikeId,
  saveServiceHistory,
  saveTheme,
} from '../utils/storage'
import { getInitialGarageState } from '../utils/storageInit'

type RideContextValue = {
  bikes: Bike[]
  selectedBikeId: string | null
  selectedBike: Bike | undefined
  setSelectedBikeId: (id: string) => void
  addBike: (input: Omit<Bike, 'id' | 'createdAt'>) => void
  updateBike: (id: string, patch: Partial<Omit<Bike, 'id' | 'createdAt'>>) => void
  /** Returns false if it is the only bike (keep at least one). */
  deleteBike: (id: string) => boolean
  fuelEntries: FuelEntry[]
  documents: VaultDocument[]
  reminders: Reminder[]
  serviceRecords: ServiceRecord[]
  /** Entries for the currently selected bike. */
  fuelForSelectedBike: FuelEntry[]
  documentsForSelectedBike: VaultDocument[]
  remindersForSelectedBike: Reminder[]
  serviceForSelectedBike: ServiceRecord[]
  mileageStats: ReturnType<typeof computeMileageStats>
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
  addFuelEntry: (input: Omit<FuelEntry, 'id' | 'mileage' | 'bikeId'> & { bikeId?: string }) => void
  addDocument: (doc: Omit<VaultDocument, 'id' | 'uploadedAt' | 'bikeId'> & { bikeId?: string }) => void
  updateDocument: (id: string, patch: Partial<Pick<VaultDocument, 'name' | 'category' | 'extraction' | 'extractionError'>>) => void
  addReminder: (title: string, subtitle: string, bikeId?: string) => void
  addServiceRecord: (input: Omit<ServiceRecord, 'id'>) => void
  updateServiceRecord: (id: string, patch: Partial<Omit<ServiceRecord, 'id'>>) => void
  deleteServiceRecord: (id: string) => void
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

  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>(() => loadFuelEntries())
  const [documents, setDocuments] = useState<VaultDocument[]>(() => loadDocuments())
  const [reminders, setReminders] = useState<Reminder[]>(() => loadReminders())
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>(() => loadServiceHistory())
  const [notificationPrefs, setNotificationPrefsState] = useState<NotificationPrefs>(() =>
    loadNotificationPrefs(),
  )
  const [theme, setThemeState] = useState<ThemeMode>(() => loadTheme())

  useEffect(() => {
    applyThemeClass(theme)
  }, [theme])

  useEffect(() => {
    saveBikes(bikes)
  }, [bikes])

  useEffect(() => {
    if (selectedBikeId) saveSelectedBikeId(selectedBikeId)
  }, [selectedBikeId])

  useEffect(() => {
    saveFuelEntries(fuelEntries)
  }, [fuelEntries])

  useEffect(() => {
    saveDocuments(documents)
  }, [documents])

  useEffect(() => {
    saveReminders(reminders)
  }, [reminders])

  useEffect(() => {
    saveServiceHistory(serviceRecords)
  }, [serviceRecords])

  useEffect(() => {
    saveNotificationPrefs(notificationPrefs)
  }, [notificationPrefs])

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

  const addBike = useCallback((input: Omit<Bike, 'id' | 'createdAt'>) => {
    const bike: Bike = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setBikes((prev) => [...prev, bike])
    setSelectedBikeIdState(bike.id)
    saveSelectedBikeId(bike.id)
  }, [])

  const updateBike = useCallback((id: string, patch: Partial<Omit<Bike, 'id' | 'createdAt'>>) => {
    setBikes((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }, [])

  const deleteBike = useCallback((id: string) => {
    let success = false
    setBikes((prev) => {
      if (prev.length <= 1) return prev
      success = true
      const next = prev.filter((b) => b.id !== id)
      setFuelEntries((fe) => fe.filter((e) => e.bikeId !== id))
      setDocuments((d) => d.filter((x) => x.bikeId !== id))
      setReminders((r) => r.filter((x) => x.bikeId !== id))
      setServiceRecords((s) => s.filter((x) => x.bikeId !== id))
      setSelectedBikeIdState((cur) => {
        if (cur === id) {
          const replacement = next[0]?.id ?? null
          if (replacement) saveSelectedBikeId(replacement)
          return replacement
        }
        return cur
      })
      return next
    })
    return success
  }, [])

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
    (doc: Omit<VaultDocument, 'id' | 'uploadedAt' | 'bikeId'> & { bikeId?: string }) => {
      const bikeId = doc.bikeId ?? effectiveBikeId
      if (!bikeId) return
      const full: VaultDocument = {
        ...doc,
        bikeId,
        id: crypto.randomUUID(),
        uploadedAt: new Date().toISOString(),
      }
      setDocuments((prev) => [full, ...prev])
    },
    [effectiveBikeId],
  )

  const updateDocument = useCallback((id: string, patch: Partial<Pick<VaultDocument, 'name' | 'category' | 'extraction' | 'extractionError'>>) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d
        const nextEx = patch.extraction ? { ...d.extraction, ...patch.extraction } : d.extraction
        return { ...d, ...patch, extraction: nextEx }
      }),
    )
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

  const addServiceRecord = useCallback((input: Omit<ServiceRecord, 'id'>) => {
    setServiceRecords((prev) => [...prev, { ...input, id: crypto.randomUUID() }])
  }, [])

  const updateServiceRecord = useCallback((id: string, patch: Partial<Omit<ServiceRecord, 'id'>>) => {
    setServiceRecords((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const deleteServiceRecord = useCallback((id: string) => {
    setServiceRecords((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      bikes,
      selectedBikeId,
      selectedBike,
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
      addReminder,
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
      addReminder,
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
