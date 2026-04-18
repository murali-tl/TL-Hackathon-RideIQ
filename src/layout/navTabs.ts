import type { NavIconComponent } from '../components/icons'
import {
  Folder,
  Fuel,
  IconBell,
  IconBikeScan,
  IconGarage,
  IconHome,
  IconMapPin,
  IconSplit,
  IconWrench,
} from '../components/icons'

export type AppNavTab = {
  to: string
  label: string
  /** Shorter text for horizontal pill nav on small screens (defaults to `label`). */
  shortLabel?: string
  Icon: NavIconComponent
}

/** Primary app sections — used by mobile pill nav and desktop sidebar. */
export const APP_NAV_TABS: readonly AppNavTab[] = [
  { to: '/dashboard', label: 'Home', Icon: IconHome },
  { to: '/fuel-log', label: 'Fuel', Icon: Fuel },
  { to: '/service', label: 'Service', Icon: IconWrench },
  { to: '/split', label: 'Split', Icon: IconSplit },
  { to: '/reminders', label: 'Reminders', Icon: IconBell },
  {
    to: '/bunks',
    label: 'Community rated bunks',
    shortLabel: 'Bunks',
    Icon: IconMapPin,
  },
  { to: '/documents', label: 'My Docs', shortLabel: 'Docs', Icon: Folder },
  { to: '/bikes', label: 'Garage', Icon: IconGarage },
  { to: '/bike-scan', label: 'Bike scan', shortLabel: 'Scan', Icon: IconBikeScan },
]
