import { PTYPE_LABEL, PTYPE_LONG, type Award, type DB, type LDEvent, type Participant, type User } from './types'

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

// ---------- Acompanhantes ----------

/** Acompanhante adicionado por um aluno (sem conta própria). */
export const isGuest = (p: Participant) => !!p.hostId
/** Pode adicionar acompanhantes: inscreveu-se sozinho com o código do evento e não cancelou. */
export const canHost = (p: Participant) => !p.hostId && !p.addedBy && !isCancelled(p)
/** Acompanhantes deste aluno (inclui cancelados). */
export const guestsOf = (db: DB, p: Participant) => db.participants.filter((x) => x.hostId === p.id)
/** Aluno que adicionou este acompanhante. */
export const hostOf = (db: DB, p: Participant) => (p.hostId ? db.participants.find((x) => x.id === p.hostId) : undefined)
/** Nome da modalidade desta pessoa (sem modalidade = preço completo do baile). */
export const modalityName = (ev: LDEvent, p: Participant) => ev.modalities?.find((m) => m.id === p.modalityId)?.name ?? BASE_MODALITY
export const BASE_MODALITY = 'Completo (all access)'
/** Tipo para mostrar nas listas: "Acompanhante de X" ou o tipo de participante. */
export const typeLabel = (db: DB, p: Participant, long = false) =>
  p.hostId ? `Acompanhante de ${hostOf(db, p)?.name ?? '—'}` : (long ? PTYPE_LONG : PTYPE_LABEL)[p.type]
/** Ordena com cada acompanhante logo a seguir ao aluno que o trouxe (para sentar juntos). */
export function guestsAfterHosts(list: Participant[]) {
  const ids = new Set(list.map((p) => p.id))
  const out: Participant[] = []
  list.filter((p) => !p.hostId || !ids.has(p.hostId)).forEach((p) => out.push(p, ...list.filter((g) => g.hostId === p.id)))
  return out
}

/** Preço desta pessoa: modalidade escolhida (ou preço base) + extras. */
export function personPrice(ev: LDEvent, modalityId?: string, extras?: string[]) {
  const mod = ev.modalities?.find((m) => m.id === modalityId)
  const base = mod ? mod.price : eventPrice(ev)
  return base + (extras ?? []).reduce((s, id) => s + (ev.extras?.find((x) => x.id === id)?.price ?? 0), 0)
}

/**
 * Plano base da prestação i para esta pessoa (o que o evento definiu, ou o plano depois de mudar modalidade/extras).
 * Serve só para saber o preço total e a proporção entre prestações; o valor a pagar em cada uma é calculado em `plan`.
 */
export const instBase = (p: Participant, ev: LDEvent, i: number) => p.customAmounts?.[i] ?? ev.installments[i].amount

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
  const cur = ev.installments.map((_, i) => instBase(p, ev, i))
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
export type PlanRow = { amount: number; paid: number; left: number; status: InstStatus; rolled: boolean }

const r2 = (v: number) => Math.round(v * 100) / 100

/**
 * Plano de pagamento desta pessoa. O evento tem um preço total, dividido em prestações.
 * Uma prestação com algum pagamento fica fechada com o que foi pago: se faltou dinheiro (ou se sobrou),
 * a diferença reparte-se pelas prestações seguintes, na proporção do plano. A última prestação leva o que faltar.
 * Uma prestação sem pagamento nenhum e com a data-limite ultrapassada fica em atraso.
 * A mesma regra existe no servidor (api/lib.php → fully_paid usa o total).
 */
export function plan(p: Participant, ev: LDEvent): PlanRow[] {
  const n = ev.installments.length
  const base = ev.installments.map((_, i) => instBase(p, ev, i))
  let remaining = r2(base.reduce((s, v) => s + v, 0))
  const rows: PlanRow[] = []
  for (let i = 0; i < n; i++) {
    const paid = r2(paidFor(p, i))
    const wRest = base.slice(i).reduce((s, v) => s + v, 0)
    const target = Math.max(0, i === n - 1 ? remaining : r2(wRest > 0 ? (remaining * base[i]) / wRest : remaining / (n - i)))
    const due = ev.installments[i].due
    if (p.offer) {
      rows.push({ amount: target, paid, left: 0, status: 'offer', rolled: false })
      remaining = r2(remaining - target)
    } else if (paid > 0.001 && i < n - 1) {
      // fechada com o que foi pago; a diferença passa para as seguintes
      rows.push({ amount: paid, paid, left: 0, status: 'paid', rolled: Math.abs(paid - target) > 0.009 })
      remaining = r2(remaining - paid)
    } else {
      const left = r2(Math.max(0, target - paid))
      const status: InstStatus = left <= 0.001 ? 'paid' : due && daysFromNow(due) < 0 ? 'overdue' : paid > 0 ? 'partial' : 'missing'
      rows.push({ amount: target, paid, left, status, rolled: false })
      remaining = r2(remaining - Math.max(target, paid))
    }
  }
  return rows
}

/** Valor da prestação i para esta pessoa (já com o reajuste das prestações anteriores). */
export const instAmount = (p: Participant, ev: LDEvent, i: number) => plan(p, ev)[i].amount

export function instStatus(p: Participant, ev: LDEvent, idx: number): InstStatus {
  return plan(p, ev)[idx].status
}

/** Coberto pelas prestações (pagamentos + diferenças acertadas). */
export const totalPaid = (p: Participant) => p.payments.filter((x) => x.kind !== 'refund').reduce((s, x) => s + x.amount, 0)
/** Dinheiro que entrou de facto (sem acertos) menos devoluções. */
export const cashIn = (p: Participant) => p.payments.reduce((s, x) => s + (x.kind === 'payment' ? x.amount : x.kind === 'refund' ? -x.amount : 0), 0)
export const refunded = (p: Participant) => p.payments.filter((x) => x.kind === 'refund').reduce((s, x) => s + x.amount, 0)
export const refundPending = (p: Participant) => (isCancelled(p) ? Math.max(0, (p.refundDue ?? 0) - refunded(p)) : 0)
export const totalDue = (p: Participant, ev: LDEvent) => (p.offer || isCancelled(p) ? 0 : ev.installments.reduce((s, _, i) => s + instBase(p, ev, i), 0))
export const missing = (p: Participant, ev: LDEvent) => Math.max(0, totalDue(p, ev) - totalPaid(p))
export const fullyPaid = (p: Participant, ev: LDEvent) => !isCancelled(p) && (p.offer || totalPaid(p) >= totalDue(p, ev) - 0.001)

export function overdueList(p: Participant, ev: LDEvent) {
  if (p.offer || isCancelled(p)) return []
  const rows = plan(p, ev)
  return ev.installments.map((inst, i) => ({ i, inst, left: rows[i].left })).filter(({ i }) => rows[i].status === 'overdue')
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

/** Pode ser votado neste prémio: está inscrito (não cancelado, não é acompanhante) e dentro da regra do prémio. Quem vota é que tem de ter tudo pago. */
export function eligibleFor(a: Award, p: Participant, _ev?: LDEvent) {
  if (isCancelled(p) || isGuest(p)) return false
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
