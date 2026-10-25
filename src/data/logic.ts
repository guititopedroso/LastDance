import type { DB, LDEvent, Participant, User } from './types'

// ---------- Formatação ----------

const eurFmt = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const eur = (v: number) => `${eurFmt.format(Math.round(v * 100) / 100)} €`

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export function dateLong(iso: string) {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`
}
export function dateShort(iso: string) {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
export function dateTime(iso: string) {
  const d = new Date(iso)
  return `${dateShort(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
export function daysFromNow(iso: string) {
  const d = new Date(iso + 'T23:59:59').getTime()
  return Math.round((d - Date.now()) / 864e5)
}
export const ordinal = (i: number) => `${i + 1}.ª`
export const eventWhen = (ev: LDEvent) => `${dateLong(ev.date)}, ${ev.start} às ${ev.end}`

// ---------- Prestações ----------

export const eventPrice = (ev: LDEvent) => ev.installments.reduce((s, i) => s + i.amount, 0)

export function paidFor(p: Participant, idx: number) {
  return p.payments.filter((x) => x.installment === idx).reduce((s, x) => s + x.amount, 0)
}

export type InstStatus = 'paid' | 'partial' | 'missing' | 'overdue' | 'offer'

export function instStatus(p: Participant, ev: LDEvent, idx: number): InstStatus {
  if (p.offer) return 'offer'
  const inst = ev.installments[idx]
  const paid = paidFor(p, idx)
  if (paid >= inst.amount - 0.001) return 'paid'
  if (inst.due && daysFromNow(inst.due) < 0) return 'overdue'
  return paid > 0 ? 'partial' : 'missing'
}

export const totalPaid = (p: Participant) => p.payments.reduce((s, x) => s + x.amount, 0)
export const totalDue = (p: Participant, ev: LDEvent) => (p.offer ? 0 : eventPrice(ev))
export const missing = (p: Participant, ev: LDEvent) => Math.max(0, totalDue(p, ev) - totalPaid(p))
export const fullyPaid = (p: Participant, ev: LDEvent) => p.offer || ev.installments.every((_, i) => instStatus(p, ev, i) === 'paid')

export function overdueList(p: Participant, ev: LDEvent) {
  return ev.installments
    .map((inst, i) => ({ i, inst, left: inst.amount - paidFor(p, i) }))
    .filter(({ inst, left }) => !p.offer && left > 0.001 && inst.due && daysFromNow(inst.due) < 0)
}

// ---------- Estatísticas de evento ----------

export function commissionShares(ev: LDEvent) {
  const s = [{ userId: ev.comercial1, pct: ev.comercial2 ? ev.share1 : 100 }]
  if (ev.comercial2) s.push({ userId: ev.comercial2, pct: 100 - ev.share1 })
  return s
}

export function eventStats(ev: LDEvent, db: DB) {
  const ps = db.participants.filter((p) => p.eventId === ev.id)
  const paying = ps.filter((p) => !p.offer)
  const expected = paying.length * eventPrice(ev)
  const received = ps.reduce((s, p) => s + totalPaid(p), 0)
  const overdue = paying.filter((p) => overdueList(p, ev).length > 0)
  const overdueAmount = overdue.reduce((s, p) => s + overdueList(p, ev).reduce((a, o) => a + o.left, 0), 0)
  const commissionTotal = paying.length * ev.commission
  let commissionToPay = 0
  let commissionKept = 0
  for (const sh of commissionShares(ev)) {
    const u = db.users.find((x) => x.id === sh.userId)
    const v = (commissionTotal * sh.pct) / 100
    if (u?.isPartner) commissionKept += v
    else commissionToPay += v
  }
  const venue = db.venues.find((v) => v.id === ev.venueId)
  const seats = ps.length
  const venueCost = venue ? Math.max(seats, venue.minimum) * venue.costPerPerson : 0
  const belowMin = venue ? seats < venue.minimum : false
  const partnersCost = ev.partners.reduce((s, ep) => {
    const pa = db.partners.find((x) => x.id === ep.partnerId)
    return s + (ep.cost ?? pa?.baseCost ?? 0)
  }, 0)
  return {
    ps,
    paying: paying.length,
    offers: ps.length - paying.length,
    expected,
    received,
    toReceive: expected - received,
    overdueCount: overdue.length,
    overdueAmount,
    entered: ps.filter((p) => p.enteredAt).length,
    fullyPaid: ps.filter((p) => fullyPaid(p, ev)).length,
    commissionToPay,
    commissionKept,
    venue,
    seats,
    venueCost,
    belowMin,
    partnersCost,
    margin: expected - venueCost - partnersCost - commissionToPay,
  }
}

export function userCommission(ev: LDEvent, db: DB, userId: string) {
  const sh = commissionShares(ev).find((s) => s.userId === userId)
  if (!sh) return 0
  const paying = db.participants.filter((p) => p.eventId === ev.id && !p.offer).length
  return (paying * ev.commission * sh.pct) / 100
}

export function sellersLabel(ev: LDEvent, users: User[]) {
  return commissionShares(ev)
    .map((s) => `${users.find((u) => u.id === s.userId)?.name ?? '—'} ${s.pct}%`)
    .join(' / ')
}

// ---------- Votação ----------

export function votingOpen(ev: LDEvent) {
  if (ev.announced) return false
  if (ev.votingMode === 'open') return true
  if (ev.votingMode !== 'auto') return false
  const start = new Date(`${ev.date}T${ev.start}:00`).getTime()
  let end = new Date(`${ev.date}T${ev.end}:00`).getTime()
  if (end <= start) end += 864e5
  const now = Date.now()
  return now >= start && now <= end
}

// ---------- Exportação ----------

export function exportCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
