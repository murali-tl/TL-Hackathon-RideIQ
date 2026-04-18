import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, TextInput } from '../components/Form'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { RsCard } from '../components/ui/RsCard'
import { IconTrash } from '../components/icons'
import { useRide } from '../hooks/useRide'
import type { NotificationPrefs, ReminderBadge } from '../types'

const badgeCls: Record<ReminderBadge, string> = {
  warn: 'bg-[rgba(255,160,64,0.15)] text-[var(--rs-accent2)]',
  ok: 'bg-[rgba(34,201,122,0.12)] text-[var(--rs-green)]',
  due: 'bg-[rgba(255,92,26,0.15)] text-[var(--rs-accent)]',
}

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--rs-border)] py-2.5 last:border-b-0">
      <span className="text-[13px] text-[var(--rs-text)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className={`relative h-5 w-9 rounded-full border transition ${
          on ? 'border-[var(--rs-accent)] bg-[var(--rs-accent)]' : 'border-[var(--rs-border)] bg-[var(--rs-surface2)]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition ${
            on ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

export default function Reminders() {
  const {
    remindersForSelectedBike,
    selectedBike,
    addReminder,
    deleteReminder,
    notificationPrefs,
    setNotificationPrefs,
  } = useRide()
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')

  function patch(key: keyof NotificationPrefs) {
    setNotificationPrefs({ ...notificationPrefs, [key]: !notificationPrefs[key] })
  }

  function onAdd(e: FormEvent) {
    e.preventDefault()
    addReminder(title, subtitle)
    setTitle('')
    setSubtitle('')
  }

  if (!selectedBike) {
    return (
      <p className="text-center text-sm text-[var(--rs-muted)]">
        <Link to="/bikes" className="text-[var(--rs-accent)]">
          Add a bike
        </Link>{' '}
        first.
      </p>
    )
  }

  return (
    <div>
      <p className="mb-2 text-[11px] text-[var(--rs-muted)]">
        Showing reminders for <span className="font-medium text-[var(--rs-text)]">{selectedBike.registrationNumber}</span>
      </p>
      <RsCard title="Upcoming reminders" action={<Badge tone="accent">Local</Badge>}>
        <div>
          {remindersForSelectedBike.length === 0 ? (
            <p className="py-2 text-xs text-[var(--rs-muted)]">No reminders for this bike yet.</p>
          ) : null}
          {remindersForSelectedBike.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-2 border-b border-[var(--rs-border)] py-2.5 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-[var(--rs-text)]">{r.title}</div>
                <div className="mt-0.5 text-xs text-[var(--rs-muted)]">{r.subtitle}</div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${badgeCls[r.badge]}`}>
                {r.badgeText}
              </span>
              <button
                type="button"
                className="shrink-0 rounded-lg p-2 text-[var(--rs-muted)] transition hover:bg-[rgba(255,85,85,0.12)] hover:text-[var(--rs-red)]"
                aria-label={`Delete reminder ${r.title}`}
                onClick={() => {
                  if (confirm(`Remove reminder “${r.title}”?`)) deleteReminder(r.id)
                }}
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </RsCard>

      <RsCard title="Notification preferences">
        <Toggle on={notificationPrefs.service} onToggle={() => patch('service')} label="Service due reminders" />
        <Toggle on={notificationPrefs.insurance} onToggle={() => patch('insurance')} label="Insurance alerts" />
        <Toggle on={notificationPrefs.documents} onToggle={() => patch('documents')} label="PUC & document expiry" />
        <Toggle on={notificationPrefs.weeklyFuel} onToggle={() => patch('weeklyFuel')} label="Weekly fuel summary" />
        <Toggle on={notificationPrefs.dailyTips} onToggle={() => patch('dailyTips')} label="Daily riding tips" />
      </RsCard>

      <RsCard title="Add custom reminder">
        <form onSubmit={onAdd} className="space-y-2">
          <Field label="Title" htmlFor="rt">
            <TextInput id="rt" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chain clean" />
          </Field>
          <Field label="Note" htmlFor="rsu">
            <TextInput
              id="rsu"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Optional detail"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={!title.trim()}>
            Save reminder
          </Button>
        </form>
      </RsCard>
    </div>
  )
}
