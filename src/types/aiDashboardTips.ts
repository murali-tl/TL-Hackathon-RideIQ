export type AiDashboardTip = {
  title?: string
  body?: string
  category?: string
}

export type AiDashboardTipsResult = {
  summary?: string
  from_photo?: string | null
  tips?: AiDashboardTip[]
  disclaimer?: string
  parse_error?: boolean
}
