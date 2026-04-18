type IconProps = { className?: string }

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
