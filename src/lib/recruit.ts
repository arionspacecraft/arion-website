import { rounds } from '../content/recruit'
import type { RecruitRound } from '../content/recruit'

export type RecruitState =
  | { status: 'open'; round: RecruitRound; daysLeft: number }
  | { status: 'upcoming'; round: RecruitRound; daysUntil: number }
  | { status: 'closed'; round: RecruitRound | undefined }

function toKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function dayDiff(from: string, to: string) {
  const utc = (key: string) => {
    const [y, m, d] = key.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((utc(to) - utc(from)) / 86_400_000)
}

export function getRecruitState(now = new Date()): RecruitState {
  const today = toKey(now)
  const byStart = [...rounds].sort((a, b) => a.start.localeCompare(b.start))

  const open = byStart.find((r) => r.start <= today && today <= r.end)
  if (open) return { status: 'open', round: open, daysLeft: dayDiff(today, open.end) }

  const upcoming = byStart.find((r) => r.start > today)
  if (upcoming) return { status: 'upcoming', round: upcoming, daysUntil: dayDiff(today, upcoming.start) }

  return { status: 'closed', round: byStart.at(-1) }
}

export function formatDate(key: string) {
  return key.replaceAll('-', '.')
}
