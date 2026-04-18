import type { ComponentType } from 'react'

type IconProps = { className?: string }

/**
 * Bicycle (Lucide-style stroke). Clear at small sizes; use with `text-[var(--rs-text)]` for theme contrast.
 * @license ISC — adapted from lucide-static icons/bike
 */
export function IconBikeTheme({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </svg>
  )
}

export function IconHome({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  )
}

export function IconWrench({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M14.7 6.3a4.5 4.5 0 0 1 0 6.4l-2.1 2.1a4.5 4.5 0 0 1-6.4 0l-.8-.8 4.2-4.2.8.8a1.5 1.5 0 1 0 2.1-2.1l-.8-.8 4.2-4.2.8.8Z"
        strokeLinejoin="round"
      />
      <path d="m5 19 2-2" strokeLinecap="round" />
    </svg>
  )
}

export function IconSplit({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M8 5v14M16 5v14M5 8h6M13 16h6" strokeLinecap="round" />
    </svg>
  )
}

export function IconLightbulb({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 18h6M10 22h4" strokeLinecap="round" />
      <path d="M12 2a6 6 0 0 0-3 11.2V16h6v-2.8A6 6 0 0 0 12 2Z" strokeLinejoin="round" />
    </svg>
  )
}

export function IconBell({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9Z" strokeLinejoin="round" />
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" strokeLinecap="round" />
    </svg>
  )
}

export function IconMapPin({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 6h18" strokeLinecap="round" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  )
}

export function IconGarage({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 10 12 4l8 6v10H4V10Z" strokeLinejoin="round" />
      <path d="M9 22v-6h6v6" strokeLinejoin="round" />
      <circle cx="9" cy="14" r="1" fill="currentColor" />
      <circle cx="15" cy="14" r="1" fill="currentColor" />
    </svg>
  )
}

export type NavIconComponent = ComponentType<IconProps>

export function Gauge({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 14v-3" strokeLinecap="round" />
      <path d="M4.5 19.5h15" strokeLinecap="round" />
      <path
        d="M6 16a8 8 0 1 1 12 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Fuel({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 20V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14" strokeLinecap="round" />
      <path d="M16 9h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" strokeLinecap="round" />
      <path d="M8 10h4" strokeLinecap="round" />
    </svg>
  )
}

export function Folder({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path
        d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Menu({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  )
}

export function Sparkles({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 2h2v3h-2V2Zm7.66 3.34 2.12 2.12-2.12 2.12-2.12-2.12 2.12-2.12ZM22 11v2h-3v-2h3Zm-3.34 7.66-2.12 2.12-2.12-2.12 2.12-2.12 2.12 2.12ZM13 22h-2v-3h2v3ZM4.34 18.66l-2.12-2.12 2.12-2.12 2.12 2.12-2.12 2.12ZM2 13v-2h3v2H2Zm3.34-7.66L7.46 3.22l2.12 2.12L7.46 7.46 5.34 5.34Z" />
      <path d="M12 8.5c-2.2 3.1-3.5 5.1-3.5 6.5s1.5 2.5 3.5 2.5 3.5-1.1 3.5-2.5-1.3-3.4-3.5-6.5Z" opacity=".35" />
    </svg>
  )
}

export function Sun({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  )
}

export function Moon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 8.5 8.5 0 1 0 21 14.5Z" strokeLinejoin="round" />
    </svg>
  )
}
