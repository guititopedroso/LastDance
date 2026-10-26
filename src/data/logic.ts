import type { Award, DB, LDEvent, Participant, User } from './types'

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

/** Preço base do evento (soma das prestações). */
export const eventPrice = (ev: LDEvent) => ev.installments.reduce((s, i) => s + i.amount, 0)

export const isCancelled = (p: Participant) => !!p.cancelledAt

/** Preço desta pessoa: modalidade escolhida (ou preço base) + extras. */
export function personPrice(ev: LDEvent, modalityId?: string, extras?: string[]) {
  const mod = ev.modalities?.find((m) => m.id === modalityId)
  const base = mod ? mod.price : eventPrice(ev)
  return base + (extras ?? []).reduce((s, id) => s + (ev.extras?.find((x) => x.id === id)?.price ?? 0), 0)
}

/** Valor da prestação i para esta pessoa. */
export const instAmount = (p: Participant, ev: LDEvent, i: number) => p.customAmounts?.[i] ?? ev.installments[i].amount

/** Pago nesta prestação (pagamentos + diferenças acertadas). */
export function paidFor(p: Participant, idx: number) {
  return p.payments.filter((x) => x.installment === idx && x.kind !== 'refund').reduce((s, x) => s + x.amount, 0)
}

/**
 * Valores das prestações depois de mudar modalidade/extras.
 * As prestações já com algum pagamento ficam como estão; a diferença reparte-se pelas que faltam
 * (na proporção do plano do evento). Devolve undefined quando fica igual ao plano do evento.
 * A mesma conta existe no servidor (api/lib.php → recalc_amounts).
 */
export function recalcAmounts(p: Participant, ev: LDEvent, modalityId?: string, extras?: string[]): number[] | undefined {
  const target = Math.round(personPrice(ev, modalityId, extras) * 100) / 100
  const cur = ev.installments.map((_, i) => instAmount(p, ev, i))
  const open = ev.installments.map((_, i) => i).filter((i) => paidFor(p, i) <= 0.001)
  const locked = cur.reduce((s, v, i) => (open.includes(i) ? s : s + v), 0)
  const out = [...cur]
  if (!open.length) {
    out[out.length - 1] = Math.round((out[out.length - 1] + target - locked) * 100) / 100
  } else {
    const rest = Math.max(0, target - locked)
    const weights = open.map((i) => ev.installments[i].amount || 1)
    const wsum = weights.reduce((a, b) => a + b, 0)
    let acc = 0
    open.forEach((i, k) => {
      const v = k === open.length - 1 ? Math.round((rest - acc) * 100) / 100 : Math.floor(((rest * weights[k]) / wsum) * 100) / 100
      out[i] = v
      acc += v
    })
  }
  return out.every((v, i) => Math.abs(v - ev.installments[i].amount) < 0.001) ? undefined : out
}

export type InstStatus = 'paid' | 'partial' | 'missing' | 'overdue' | 'offer'

export function instStatus(p: Participant, ev: LDEvent, idx: number): InstStatus {
  if (p.offer) return 'offer'
  const inst = ev.installments[idx]
  const paid = paidFor(p, idx)
  if (paid >= instAmount(p, ev, idx) - 0.001) return 'paid'
  if (inst.due && daysFromNow(inst.due) < 0) return 'overdue'
  return paid > 0 ? 'partial' : 'missing'
}

/** Coberto pelas prestações (pagamentos + diferenças acertadas). */
export const totalPaid = (p: Participant) => p.payments.filter((x) => x.kind !== 'refund').reduce((s, x) => s + x.amount, 0)
/** Dinheiro que entrou de facto (sem acertos) menos devoluções. */
export const cashIn = (p: Participant) => p.payments.reduce((s, x) => s + (x.kind === 'payment' ? x.amount : x.kind === 'refund' ? -x.amount : 0), 0)
export const refunded = (p: Participant) => p.payments.filter((x) => x.kind === 'refund').reduce((s, x) => s + x.amount, 0)
export const refundPending = (p: Participant) => (isCancelled(p) ? Math.max(0, (p.refundDue ?? 0) - refunded(p)) : 0)
export const totalDue = (p: Participant, ev: LDEvent) => (p.offer || isCancelled(p) ? 0 : ev.installments.reduce((s, _, i) => s + instAmount(p, ev, i), 0))
export const missing = (p: Participant, ev: LDEvent) => Math.max(0, totalDue(p, ev) - totalPaid(p))
export const fullyPaid = (p: Participant, ev: LDEvent) => !isCancelled(p) && (p.offer || ev.installments.every((_, i) => instStatus(p, ev, i) === 'paid'))

export function overdueList(p: Participant, ev: LDEvent) {
  if (p.offer || isCancelled(p)) return []
  return ev.installments
    .map((inst, i) => ({ i, inst, left: instAmount(p, ev, i) - paidFor(p, i) }))
    .filter(({ inst, left }) => left > 0.001 && inst.due && daysFromNow(inst.due) < 0)
}

/** Idade no dia do evento (para o staff ver se é maior de idade). */
export function ageAt(birth: string, dateIso: string) {
  if (!birth) return null
  const b = new Date(birth + 'T12:00:00')
  const d = new Date(dateIso + 'T12:00:00')
  let a = d.getFullYear() - b.getFullYear()
  if (d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())) a--
  return a
}

/** O evento já aconteceu (passou o dia seguinte). */
export const eventPast = (ev: LDEvent) => daysFromNow(ev.date) < -1

// ---------- Estatísticas de evento ----------

export function commissionShares(ev: LDEvent) {
  const s = [{ userId: ev.comercial1, pct: ev.comercial2 ? ev.share1 : 100 }]
  if (ev.comercial2) s.push({ userId: ev.comercial2, pct: 100 - ev.share1 })
  return s
}

export function eventStats(ev: LDEvent, db: DB) {
  const all = db.participants.filter((p) => p.eventId === ev.id)
  const ps = all.filter((p) => !isCancelled(p))
  const cancelled = all.filter(isCancelled)
  const paying = ps.filter((p) => !p.offer)
  // Receita: o que os ativos têm de pagar + o que fica dos cancelados (pago menos o que é para devolver)
  const retained = cancelled.reduce((s, p) => s + Math.max(0, cashIn(p) + refunded(p) - (p.refundDue ?? 0)), 0)
  const expected = ps.reduce((s, p) => s + totalDue(p, ev), 0) + retained
  const received = all.reduce((s, p) => s + cashIn(p), 0)
  const toReceive = ps.reduce((s, p) => s + missing(p, ev), 0)
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
    all,
    cancelled,
    paying: paying.length,
    offers: ps.length - paying.length,
    expected,
    received,
    toReceive,
    overdueCount: overdue.length,
    overdueAmount,
    refundsPending: cancelled.reduce((s, p) => s + refundPending(p), 0),
    refundedTotal: cancelled.reduce((s, p) => s + refunded(p), 0),
    entered: ps.filter((p) => p.enteredAt).length,
    fullyPaid: ps.filter((p) => fullyPaid(p, ev)).length,
    commissionToPay,
    commissionKept,
    venue,
    noVenue: !venue,
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
  const paying = db.participants.filter((p) => p.eventId === ev.id && !p.offer && !isCancelled(p)).length
  return (paying * ev.commission * sh.pct) / 100
}

export function sellersLabel(ev: LDEvent, users: User[]) {
  return commissionShares(ev)
    .map((s) => `${users.find((u) => u.id === s.userId)?.name ?? '—'} ${s.pct}%`)
    .join(' / ')
}

// ---------- Votação ----------

/** Pode ser votado neste prémio: tem tudo pago e está dentro da regra do prémio. */
export function eligibleFor(a: Award, p: Participant, ev: LDEvent) {
  if (!fullyPaid(p, ev)) return false
  if (a.eligible) return a.eligible.includes(p.id)
  return !(a.excluded ?? []).includes(p.id)
}

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
