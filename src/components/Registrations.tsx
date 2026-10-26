import { useMemo, useState } from 'react'
import {
  cashIn,
  dateLong,
  dateShort,
  dateTime,
  eur,
  exportCSV,
  fullyPaid,
  instAmount,
  instStatus,
  isCancelled,
  missing,
  normalize,
  ordinal,
  paidFor,
  personPrice,
  recalcAmounts,
  refundPending,
  refunded,
  totalDue,
  totalPaid,
} from '../data/logic'
import { uid } from '../data/seed'
import { update, useDB } from '../data/store'
import { DIETS, PTYPES, PTYPE_LABEL, PTYPE_LONG, type LDEvent, type Participant, type ParticipantType, type User } from '../data/types'
import { Modal, StatusPill, newPassword, toast } from './ui'

export interface Perms {
  receive: boolean
  edit: boolean
  admin: boolean
  add: boolean
}

export const permsFor = (u: User): Perms => ({
  receive: ['admin', 'promotor_chefe', 'promotor'].includes(u.role),
  edit: ['admin', 'promotor_chefe'].includes(u.role),
  admin: u.role === 'admin',
  add: ['admin', 'promotor_chefe', 'promotor'].includes(u.role),
})

type PayFilter = 'all' | 'missing' | 'paid' | 'offer' | 'cancelled'

export function Registrations({
  participants,
  user,
  showEvent,
  exportName,
  eventId,
}: {
  participants: Participant[]
  user: User
  showEvent?: boolean
  exportName: string
  /** Quando é a lista de um evento: permite adicionar pessoas à mão */
  eventId?: string
}) {
  const db = useDB()
  const perms = permsFor(user)
  const evById = useMemo(() => new Map(db.events.map((e) => [e.id, e])), [db.events])
  const [q, setQ] = useState('')
  const [type, setType] = useState<'' | ParticipantType>('')
  const [turma, setTurma] = useState('')
  const [diet, setDiet] = useState('')
  const [sort, setSort] = useState<'name' | 'recent' | 'turma' | 'missing'>('name')
  const [pay, setPay] = useState<PayFilter>('all')
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(0)
  const [payFor, setPayFor] = useState<string | null>(null)
  const [ficha, setFicha] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const active = useMemo(() => participants.filter((p) => !isCancelled(p)), [participants])
  const classes = useMemo(() => [...new Set(participants.map((p) => p.turma).filter(Boolean) as string[])].sort(), [participants])
  const dietCounts = useMemo(() => {
    const m = new Map<string, number>()
    active.forEach((p) => p.diet !== 'Nenhuma' && m.set(p.diet, (m.get(p.diet) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [active])
  const typeCounts = (t: ParticipantType) => active.filter((p) => p.type === t).length

  const base = useMemo(() => {
    const nq = normalize(q)
    return participants.filter(
      (p) =>
        (!nq || normalize(`${p.name} ${p.email} ${p.phone} ${p.turma ?? ''}`).includes(nq)) &&
        (!type || p.type === type) &&
        (!turma || p.turma === turma) &&
        (!diet || (diet === '__any' ? p.diet !== 'Nenhuma' : p.diet === diet)),
    )
  }, [participants, q, type, turma, diet])

  const payCounts = useMemo(() => {
    const c = { all: 0, missing: 0, paid: 0, offer: 0, cancelled: 0 }
    base.forEach((p) => {
      const ev = evById.get(p.eventId)!
      if (isCancelled(p)) return void c.cancelled++
      c.all++
      if (p.offer) c.offer++
      else if (fullyPaid(p, ev)) c.paid++
      else c.missing++
    })
    return c
  }, [base, evById])

  const rows = useMemo(() => {
    const r = base.filter((p) => {
      const ev = evById.get(p.eventId)!
      if (pay === 'cancelled') return isCancelled(p)
      if (isCancelled(p)) return false
      if (pay === 'offer') return p.offer
      if (pay === 'paid') return !p.offer && fullyPaid(p, ev)
      if (pay === 'missing') return !p.offer && !fullyPaid(p, ev)
      return true
    })
    const cmp: Record<typeof sort, (a: Participant, b: Participant) => number> = {
      name: (a, b) => a.name.localeCompare(b.name, 'pt'),
      recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
      turma: (a, b) => (a.turma ?? 'zz').localeCompare(b.turma ?? 'zz') || a.name.localeCompare(b.name, 'pt'),
      missing: (a, b) => missing(b, evById.get(b.eventId)!) - missing(a, evById.get(a.eventId)!),
    }
    return r.sort(cmp[sort])
  }, [base, pay, sort, evById])

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const cur = Math.min(page, pages - 1)
  const shown = rows.slice(cur * pageSize, cur * pageSize + pageSize)

  const money = (v: number) => v.toFixed(2).replace('.', ',')
  const doExport = () => {
    const maxInst = Math.max(...rows.map((p) => evById.get(p.eventId)!.installments.length), 0)
    exportCSV(exportName, [
      [
        'Nome', 'Evento', 'Tipo', 'Turma', 'Email', 'Telemóvel', 'Nascimento', 'Encarregado de educação', 'Telefone do encarregado', 'Alimentação', 'Saúde', 'Modalidade', 'Extras', 'Mesa', 'Oferta', 'Estado',
        ...Array.from({ length: maxInst }, (_, i) => `${ordinal(i)} prestação`),
        'Total', 'Pago', 'Em falta', 'Devolvido', 'Entrou',
      ],
      ...rows.map((p) => {
        const ev = evById.get(p.eventId)!
        return [
          p.name, ev.name, PTYPE_LONG[p.type], p.turma ?? '', p.email, p.phone, p.birth, p.guardianName ?? '', p.guardianPhone ?? '', p.diet, p.health ?? '',
          ev.modalities?.find((m) => m.id === p.modalityId)?.name ?? '',
          (p.extras ?? []).map((x) => ev.extras?.find((e) => e.id === x)?.name ?? x).join(', '),
          ev.tables.find((t) => t.id === p.tableId)?.name ?? '',
          p.offer ? 'Sim' : '',
          isCancelled(p) ? `Cancelado ${dateShort(p.cancelledAt!)}` : 'Ativo',
          ...Array.from({ length: maxInst }, (_, i) => (i < ev.installments.length ? money(paidFor(p, i)) : '')),
          money(totalDue(p, ev)), money(totalPaid(p)), money(missing(p, ev)), money(refunded(p)),
          p.enteredAt ? dateTime(p.enteredAt) : '',
        ]
      }),
    ])
  }

  const reset = () => setPage(0)

  return (
    <div>
      <div className="filters">
        <input
          className="input"
          type="search"
          placeholder="🔍 Pesquisar por nome, email, telemóvel ou turma"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            reset()
          }}
        />
        <select className="input" value={type} onChange={(e) => (setType(e.target.value as ParticipantType | ''), reset())}>
          <option value="">Todos os tipos</option>
          {PTYPES.filter((t) => typeCounts(t) > 0 || t === 'finalista').map((t) => (
            <option key={t} value={t}>
              {PTYPE_LONG[t]} ({typeCounts(t)})
            </option>
          ))}
        </select>
        {classes.length > 0 ? (
          <select className="input" value={turma} onChange={(e) => (setTurma(e.target.value), reset())}>
            <option value="">Todas as turmas</option>
            {classes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        ) : (
          <span className="hide-mobile" />
        )}
        <select className="input" value={diet} onChange={(e) => (setDiet(e.target.value), reset())}>
          <option value="">Todas as alimentações</option>
          <option value="__any">Com restrição alimentar</option>
          {dietCounts.map(([d, n]) => (
            <option key={d} value={d}>
              {d} ({n})
            </option>
          ))}
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="name">Nome (A–Z)</option>
          <option value="recent">Mais recentes</option>
          {classes.length > 0 && <option value="turma">Turma</option>}
          <option value="missing">Em falta primeiro</option>
        </select>
      </div>

      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="chips">
          {(
            [
              ['all', 'Todos'],
              ['missing', 'Em falta'],
              ['paid', 'Tudo pago'],
              ['offer', 'Ofertas'],
              ['cancelled', 'Cancelados'],
            ] as const
          ).map(([id, l]) =>
            id === 'cancelled' && !payCounts.cancelled ? null : (
              <button key={id} className={`chip ${pay === id ? 'on' : ''}`} onClick={() => (setPay(id), reset())}>
                {l} <span className="count">{payCounts[id]}</span>
              </button>
            ),
          )}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {eventId && perms.add && (
            <button className="btn btn-gold btn-sm" onClick={() => setAdding(true)}>
              + Adicionar pessoa
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={doExport}>
            ⬇ Exportar para Excel
          </button>
        </div>
      </div>

      {dietCounts.length > 0 && (
        <div className="row small" style={{ marginBottom: 14, gap: 6 }}>
          <span className="muted">Restrições alimentares:</span>
          {dietCounts.map(([d, n]) => (
            <button key={d} className={`chip ${diet === d ? 'on' : ''}`} onClick={() => (setDiet(diet === d ? '' : d), reset())}>
              {d} · {n}
            </button>
          ))}
          <span className="muted">{active.filter((p) => p.diet === 'Nenhuma').length} sem restrições</span>
        </div>
      )}

      <div className="table-wrap">
        <table className="tbl tbl-cards">
          <thead>
            <tr>
              <th>Nome</th>
              <th className="hide-mobile">Alimentação</th>
              <th className="hide-mobile">Mesa</th>
              <th>Pagamento</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const ev = evById.get(p.eventId)!
              const cancelled = isCancelled(p)
              return (
                <tr key={p.id} style={cancelled ? { opacity: 0.7 } : undefined}>
                  <td>
                    <b>{p.name}</b>
                    <div className="small muted">
                      {PTYPE_LABEL[p.type]}
                      {p.turma ? ` · ${p.turma}` : ''}
                      {showEvent ? ` · ${ev.name}` : ''}
                      {p.enteredAt ? ' · ✓ entrou' : ''}
                      {(p.extras?.length ?? 0) > 0 ? ` · +${p.extras!.length} extra(s)` : ''}
                    </div>
                  </td>
                  <td className="hide-mobile small">{p.diet === 'Nenhuma' ? '—' : p.diet}</td>
                  <td className="hide-mobile small">{ev.tables.find((t) => t.id === p.tableId)?.name ?? <span className="muted">Sem mesa</span>}</td>
                  <td>
                    <div className="pills">
                      {cancelled ? (
                        <StatusPill s="overdue" label={refundPending(p) > 0 ? `Cancelado · devolver ${eur(refundPending(p))}` : 'Cancelado'} />
                      ) : p.offer ? (
                        <StatusPill s="offer" />
                      ) : (
                        ev.installments.map((_, i) => <StatusPill key={i} s={instStatus(p, ev, i)} label={ordinal(i)} />)
                      )}
                    </div>
                  </td>
                  <td className="num">
                    <div className="row" style={{ gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      {perms.receive && !p.offer && !cancelled && (
                        <button className="btn btn-gold btn-sm" title="Receber pagamento" onClick={() => setPayFor(p.id)}>
                          €
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => setFicha(p.id)}>
                        Ficha
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  Sem inscrições com estes filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager small">
        <span className="muted">
          {rows.length ? `${cur * pageSize + 1}–${Math.min(rows.length, (cur + 1) * pageSize)} de ${rows.length} inscrições` : '0 inscrições'}
        </span>
        <div className="row" style={{ gap: 8 }}>
          <select className="input" style={{ width: 'auto', padding: '6px 10px' }} value={pageSize} onChange={(e) => (setPageSize(+e.target.value), reset())}>
            <option value={25}>25 de cada vez</option>
            <option value={50}>50 de cada vez</option>
            <option value={100}>100 de cada vez</option>
            <option value={100000}>Todas ({rows.length})</option>
          </select>
          <button className="btn btn-ghost btn-sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>
            Anterior
          </button>
          <span className="muted">
            Página {cur + 1} de {pages}
          </span>
          <button className="btn btn-ghost btn-sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>
            Seguinte
          </button>
        </div>
      </div>

      {payFor && <PaymentModal pid={payFor} user={user} onClose={() => setPayFor(null)} />}
      {ficha && <FichaModal pid={ficha} user={user} onClose={() => setFicha(null)} onPay={() => (setFicha(null), setPayFor(ficha))} />}
      {adding && eventId && <AddPersonModal eventId={eventId} user={user} onClose={() => setAdding(false)} />}
    </div>
  )
}

// ---------- Receber pagamento ----------

export function PaymentModal({ pid, user, onClose }: { pid: string; user: User; onClose: () => void }) {
  const db = useDB()
  const p = db.participants.find((x) => x.id === pid)!
  const ev = db.events.find((e) => e.id === p.eventId)!
  const firstOpen = ev.installments.findIndex((_, i) => instStatus(p, ev, i) !== 'paid')
  const [idx, setIdx] = useState(firstOpen < 0 ? 0 : firstOpen)
  const inst = ev.installments[idx]
  const amount = instAmount(p, ev, idx)
  const paid = paidFor(p, idx)
  const left = Math.max(0, amount - paid)
  const [value, setValue] = useState(left.toFixed(2).replace('.', ','))
  const perms = permsFor(user)
  const name = (id: string | null) => (id ? db.users.find((u) => u.id === id)?.name ?? '—' : null)

  const choose = (i: number) => {
    setIdx(i)
    const l = Math.max(0, instAmount(p, ev, i) - paidFor(p, i))
    setValue(l.toFixed(2).replace('.', ','))
  }

  const register = (kind: 'payment' | 'adjust', amt: number) => {
    update((d) => {
      d.participants
        .find((x) => x.id === pid)!
        .payments.push({ id: 'pg' + uid(), installment: idx, amount: Math.round(amt * 100) / 100, receivedBy: user.id, at: new Date().toISOString(), kind })
    })
    toast(kind === 'adjust' ? 'Diferença acertada.' : `Registado ${eur(amt)} na ${ordinal(idx)} prestação.`)
    // Passa sozinho para a prestação seguinte que falte
    const next = ev.installments.findIndex((_, i) => i > idx && paidFor(p, i) < instAmount(p, ev, i) - 0.001)
    if (kind === 'payment' && amt >= left - 0.001 && next >= 0) choose(next)
  }

  const num = parseFloat(value.replace(',', '.')) || 0
  const pays = p.payments.filter((x) => x.installment === idx)

  return (
    <Modal onClose={onClose}>
      <h3>Receber pagamento</h3>
      <p className="small muted">
        {p.name} · {eur(totalPaid(p))} de {eur(totalDue(p, ev))}
        {missing(p, ev) > 0 && ` · faltam ${eur(missing(p, ev))}`}
      </p>
      <div className="chips" style={{ margin: '16px 0' }}>
        {ev.installments.map((_, i) => (
          <button key={i} className={`chip ${i === idx ? 'on' : ''}`} onClick={() => choose(i)}>
            {ordinal(i)} · {eur(instAmount(p, ev, i))} {instStatus(p, ev, i) === 'paid' && '✓'}
          </button>
        ))}
      </div>
      {left <= 0.001 ? (
        <div className="alert alert-ok">Esta prestação está paga.</div>
      ) : (
        <div className="stack">
          <p className="small muted">
            Valor da prestação {eur(amount)} · já recebido {eur(paid)} · em falta {eur(left)}
            {inst.due && ` · até ${dateShort(inst.due)}`}
          </p>
          <div className="field">
            <label>Valor recebido (€)</label>
            <input className="input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          </div>
          <div className="row">
            <button className="btn btn-gold" disabled={num <= 0} onClick={() => register('payment', Math.min(num, left))}>
              Registar {eur(Math.min(num, left))}
            </button>
            {paid > 0 && perms.edit && (
              <button className="btn btn-ghost" onClick={() => register('adjust', left)} title="Perdoar o valor que falta nesta prestação">
                Acertar diferença ({eur(left)})
              </button>
            )}
            <button className="btn btn-ghost" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      )}
      {pays.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="label" style={{ marginBottom: 6 }}>
            Pagamentos desta prestação
          </div>
          <div className="list">
            {pays.map((x) => (
              <div key={x.id} className="list-item">
                <div className="grow">
                  <div className="t">
                    {eur(x.amount)} {x.kind === 'adjust' && <span className="pill partial">diferença acertada</span>}
                  </div>
                  <div className="s">{x.receivedBy ? `Recebido por ${name(x.receivedBy)} · ${dateTime(x.at)}` : 'Pago antes do registo de quem recebe'}</div>
                </div>
                {(perms.edit || x.receivedBy === user.id) && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (!confirm('Anular este pagamento?')) return
                      update((d) => {
                        const pp = d.participants.find((y) => y.id === pid)!
                        pp.payments = pp.payments.filter((y) => y.id !== x.id)
                      })
                      toast('Pagamento anulado.')
                    }}
                  >
                    Anular
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ---------- Modalidade e extras (ficha e área do aluno) ----------

export function ChoicesEditor({ p, ev, onSave, onCancel }: { p: Participant; ev: LDEvent; onSave: (m?: string, x?: string[]) => void; onCancel: () => void }) {
  const [mod, setMod] = useState(p.modalityId ?? '')
  const [ext, setExt] = useState<string[]>(p.extras ?? [])
  const preview = recalcAmounts(p, ev, mod || undefined, ext) ?? ev.installments.map((i) => i.amount)
  return (
    <div className="stack">
      {!!ev.modalities?.length && (
        <div className="field">
          <label>Modalidade</label>
          <select className="input" value={mod} onChange={(e) => setMod(e.target.value)}>
            <option value="">Completo · {eur(ev.installments.reduce((s, i) => s + i.amount, 0))}</option>
            {ev.modalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {eur(m.price)}
              </option>
            ))}
          </select>
        </div>
      )}
      {!!ev.extras?.length && (
        <div className="field">
          <label>Extras</label>
          {ev.extras.map((x) => (
            <label key={x.id} className="check">
              <input type="checkbox" checked={ext.includes(x.id)} onChange={(e) => setExt(e.target.checked ? [...ext, x.id] : ext.filter((y) => y !== x.id))} />
              {x.name} (+{eur(x.price)})
            </label>
          ))}
        </div>
      )}
      <div className="alert alert-info small">
        Total {eur(personPrice(ev, mod || undefined, ext))} · prestações: {preview.map((v, i) => `${ordinal(i)} ${eur(v)}`).join(' · ')}
      </div>
      <div className="row">
        <button className="btn btn-gold btn-sm" onClick={() => onSave(mod || undefined, ext)}>
          Guardar escolha
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

export function applyChoices(pid: string, modalityId: string | undefined, extras: string[]) {
  update((d) => {
    const x = d.participants.find((y) => y.id === pid)!
    const ev = d.events.find((e) => e.id === x.eventId)!
    x.customAmounts = recalcAmounts(x, ev, modalityId, extras)
    x.modalityId = modalityId
    x.extras = extras.length ? extras : undefined
  })
}

// ---------- Ficha ----------

export function FichaModal({ pid, user, onClose, onPay }: { pid: string; user: User; onClose: () => void; onPay: () => void }) {
  const db = useDB()
  const p = db.participants.find((x) => x.id === pid)
  const perms = permsFor(user)
  const [mode, setMode] = useState<'view' | 'edit' | 'choices' | 'cancel'>('view')
  const [newPass, setNewPass] = useState<string | null>(null)
  const [f, setF] = useState(() =>
    p
      ? { name: p.name, email: p.email, phone: p.phone, birth: p.birth, type: p.type, turma: p.turma ?? '', diet: p.diet, health: p.health ?? '', guardianName: p.guardianName ?? '', guardianPhone: p.guardianPhone ?? '' }
      : null,
  )
  const [cancel, setCancel] = useState({ reason: '', refund: '' })
  if (!p || !f) return null
  const ev = db.events.find((e) => e.id === p.eventId) as LDEvent
  const name = (id?: string | null) => (id ? db.users.find((u) => u.id === id)?.name ?? '—' : null)
  const cancelled = isCancelled(p)
  const hasChoices = !!(ev.modalities?.length || ev.extras?.length)

  const save = () => {
    update((d) => {
      const x = d.participants.find((y) => y.id === pid)!
      Object.assign(x, {
        ...f,
        turma: f.turma || undefined,
        health: f.health || undefined,
        guardianName: f.guardianName || undefined,
        guardianPhone: f.guardianPhone || undefined,
      })
    })
    setMode('view')
    toast('Ficha atualizada.')
  }

  return (
    <Modal onClose={onClose}>
      <h3>{p.name}</h3>
      <p className="small muted">
        {PTYPE_LONG[p.type]}
        {p.turma ? ` · ${p.turma}` : ''} · {ev.name}
      </p>
      {cancelled && (
        <div className="alert alert-err small" style={{ marginTop: 12 }}>
          Inscrição cancelada a {dateShort(p.cancelledAt!)}
          {p.cancelReason ? ` · ${p.cancelReason}` : ''}. A devolver: {eur(p.refundDue ?? 0)} · devolvido {eur(refunded(p))}
          {refundPending(p) > 0 ? ` · falta devolver ${eur(refundPending(p))}` : ''}.
        </div>
      )}

      {mode === 'edit' && (
        <div className="stack" style={{ marginTop: 16 }}>
          <div className="field">
            <label>Nome</label>
            <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Email</label>
              <input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Telemóvel</label>
              <input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Nascimento</label>
              <input className="input" type="date" value={f.birth} onChange={(e) => setF({ ...f, birth: e.target.value })} />
            </div>
            <div className="field">
              <label>Tipo</label>
              <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as ParticipantType })}>
                {PTYPES.map((t) => (
                  <option key={t} value={t}>
                    {PTYPE_LONG[t]}
                  </option>
                ))}
              </select>
            </div>
            {ev.hasClasses && (
              <div className="field">
                <label>Turma</label>
                <select className="input" value={f.turma} onChange={(e) => setF({ ...f, turma: e.target.value })}>
                  <option value="">—</option>
                  {ev.classes.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="field">
              <label>Alimentação</label>
              <select className="input" value={f.diet} onChange={(e) => setF({ ...f, diet: e.target.value })}>
                {DIETS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            {ev.category === '9' && (
              <>
                <div className="field">
                  <label>Encarregado de educação</label>
                  <input className="input" value={f.guardianName} onChange={(e) => setF({ ...f, guardianName: e.target.value })} />
                </div>
                <div className="field">
                  <label>Telefone do encarregado</label>
                  <input className="input" value={f.guardianPhone} onChange={(e) => setF({ ...f, guardianPhone: e.target.value })} />
                </div>
              </>
            )}
          </div>
          <div className="field">
            <label>Saúde</label>
            <input className="input" value={f.health} onChange={(e) => setF({ ...f, health: e.target.value })} />
          </div>
          <div className="row">
            <button className="btn btn-gold" onClick={save}>
              Guardar
            </button>
            <button className="btn btn-ghost" onClick={() => setMode('view')}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mode === 'choices' && (
        <div style={{ marginTop: 16 }}>
          <ChoicesEditor
            p={p}
            ev={ev}
            onCancel={() => setMode('view')}
            onSave={(m, x) => {
              applyChoices(pid, m, x ?? [])
              setMode('view')
              toast('Modalidade e extras atualizados. As prestações em falta foram recalculadas.')
            }}
          />
        </div>
      )}

      {mode === 'cancel' && (
        <div className="stack" style={{ marginTop: 16 }}>
          <p className="small muted">
            Já pagou {eur(cashIn(p) + refunded(p))}. Indica quanto lhe vais devolver (0 se não houver devolução). A pessoa deixa de contar para mesas, entrada, votação e comissões.
          </p>
          <div className="grid-2">
            <div className="field">
              <label>Valor a devolver (€)</label>
              <input className="input" inputMode="decimal" value={cancel.refund} onChange={(e) => setCancel({ ...cancel, refund: e.target.value })} placeholder="0,00" />
            </div>
            <div className="field">
              <label>Motivo (opcional)</label>
              <input className="input" value={cancel.reason} onChange={(e) => setCancel({ ...cancel, reason: e.target.value })} placeholder="Desistência, doença…" />
            </div>
          </div>
          <div className="row">
            <button
              className="btn btn-danger"
              onClick={() => {
                const refund = Math.min(cashIn(p) + refunded(p), Math.max(0, parseFloat(cancel.refund.replace(',', '.')) || 0))
                update((d) => {
                  const x = d.participants.find((y) => y.id === pid)!
                  x.cancelledAt = new Date().toISOString()
                  x.cancelReason = cancel.reason.trim() || undefined
                  x.refundDue = refund
                  x.tableId = undefined
                })
                setMode('view')
                toast('Inscrição cancelada.')
              }}
            >
              Confirmar cancelamento
            </button>
            <button className="btn btn-ghost" onClick={() => setMode('view')}>
              Voltar
            </button>
          </div>
        </div>
      )}

      {mode === 'view' && (
        <>
          <dl className="kv" style={{ marginTop: 18 }}>
            <dt>Telemóvel</dt>
            <dd>{p.phone || '—'}</dd>
            <dt>Email</dt>
            <dd>{p.email || '—'}</dd>
            <dt>Nascimento</dt>
            <dd>{p.birth ? dateLong(p.birth) : '—'}</dd>
            {(p.guardianName || ev.category === '9') && (
              <>
                <dt>Encarregado</dt>
                <dd>{p.guardianName ? `${p.guardianName} · ${p.guardianPhone ?? ''}` : 'Não indicado'}</dd>
              </>
            )}
            <dt>Alimentação</dt>
            <dd>{p.diet}</dd>
            <dt>Saúde</dt>
            <dd>{p.health || 'Nada indicado'}</dd>
            {hasChoices && (
              <>
                <dt>Modalidade</dt>
                <dd>
                  {ev.modalities?.find((m) => m.id === p.modalityId)?.name ?? 'Completo'}
                  {(p.extras ?? []).length > 0 && ` · extras: ${p.extras!.map((x) => ev.extras?.find((e) => e.id === x)?.name ?? x).join(', ')}`}
                </dd>
              </>
            )}
            <dt>Consentimento</dt>
            <dd>{p.consent ? `Aceite a ${dateShort(p.createdAt)}` : p.addedBy ? `Adicionado por ${name(p.addedBy)}` : 'Sem registo (inscrição anterior)'}</dd>
            <dt>Mesa</dt>
            <dd>{ev.tables.find((t) => t.id === p.tableId)?.name ?? 'Sem mesa'}</dd>
            <dt>Entrada</dt>
            <dd>{p.enteredAt ? `Entrou às ${dateTime(p.enteredAt)}${p.enteredBy ? ` (${name(p.enteredBy)})` : ''}` : 'Ainda não entrou'}</dd>
            <dt>Pagamento</dt>
            <dd>
              {p.offer ? (
                <StatusPill s="offer" label="Oferta — não paga" />
              ) : (
                <>
                  {!cancelled && (
                    <div className="pills">
                      {ev.installments.map((_, i) => (
                        <StatusPill key={i} s={instStatus(p, ev, i)} label={`${ordinal(i)} ${eur(instAmount(p, ev, i))} ${instStatus(p, ev, i) === 'paid' ? 'paga' : instStatus(p, ev, i) === 'overdue' ? 'em atraso' : 'em falta'}`} />
                      ))}
                    </div>
                  )}
                  <div className="small muted" style={{ marginTop: 6 }}>
                    {eur(totalPaid(p))} de {eur(cancelled ? cashIn(p) + refunded(p) : totalDue(p, ev))}
                    {ev.installments.some((i) => i.due) && ` · datas-limite: ${ev.installments.map((i, k) => `${ordinal(k)} ${i.due ? dateShort(i.due) : '—'}`).join(' · ')}`}
                  </div>
                  {p.payments.map((x) => (
                    <div key={x.id} className="small muted">
                      {x.kind === 'refund' ? 'Devolução' : `${ordinal(x.installment)} prestação`}: {eur(x.amount)} {x.kind === 'adjust' ? '(diferença acertada)' : ''} —{' '}
                      {x.receivedBy ? `${name(x.receivedBy)}, ${dateTime(x.at)}` : 'sem registo de quem recebeu'}
                    </div>
                  ))}
                </>
              )}
            </dd>
          </dl>
          {newPass && (
            <div className="alert alert-info" style={{ marginTop: 14 }}>
              Nova palavra-passe: <b>{newPass}</b> — envia-a ao participante.
            </div>
          )}
          <div className="row" style={{ marginTop: 20 }}>
            {perms.receive && !p.offer && !cancelled && (
              <button className="btn btn-gold btn-sm" onClick={onPay}>
                € Receber pagamento
              </button>
            )}
            {perms.edit && (
              <button className="btn btn-ghost btn-sm" onClick={() => setMode('edit')}>
                Editar
              </button>
            )}
            {perms.edit && hasChoices && !cancelled && (
              <button className="btn btn-ghost btn-sm" onClick={() => setMode('choices')}>
                Modalidade e extras
              </button>
            )}
            {perms.admin && !cancelled && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  update((d) => {
                    const x = d.participants.find((y) => y.id === pid)!
                    x.offer = !x.offer
                  })
                  toast(p.offer ? 'Já não é oferta.' : 'Marcado como oferta.')
                }}
              >
                {p.offer ? 'Retirar oferta' : 'Oferta'}
              </button>
            )}
            {perms.edit && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const np = newPassword()
                  update((d) => {
                    d.participants.find((y) => y.id === pid)!.password = np
                  })
                  setNewPass(np)
                }}
              >
                Nova palavra-passe
              </button>
            )}
            {perms.edit && !cancelled && (
              <button className="btn btn-danger btn-sm" onClick={() => setMode('cancel')}>
                Cancelar inscrição
              </button>
            )}
            {perms.edit && cancelled && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (!confirm('Reativar esta inscrição?')) return
                  update((d) => {
                    const x = d.participants.find((y) => y.id === pid)!
                    x.cancelledAt = undefined
                    x.cancelReason = undefined
                    x.refundDue = undefined
                  })
                  toast('Inscrição reativada.')
                }}
              >
                Reativar inscrição
              </button>
            )}
            {perms.admin && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (!confirm(`Apagar a inscrição de ${p.name}? Esta ação não pode ser desfeita.`)) return
                  update((d) => {
                    d.participants = d.participants.filter((y) => y.id !== pid)
                  })
                  onClose()
                  toast('Inscrição apagada.')
                }}
              >
                Apagar
              </button>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}

// ---------- Adicionar pessoa à mão (professores, convidados, família) ----------

function AddPersonModal({ eventId, user, onClose }: { eventId: string; user: User; onClose: () => void }) {
  const db = useDB()
  const ev = db.events.find((e) => e.id === eventId)!
  const perms = permsFor(user)
  const [f, setF] = useState({ name: '', type: 'professor' as ParticipantType, turma: '', phone: '', email: '', birth: '', diet: 'Nenhuma', offer: false, guardianName: '', guardianPhone: '' })
  const [mod, setMod] = useState('')
  const [ext, setExt] = useState<string[]>([])

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const id = 'p' + uid()
    update((d) => {
      const p: Participant = {
        id,
        eventId,
        name: f.name.trim(),
        birth: f.birth,
        phone: f.phone.trim(),
        email: f.email.trim(),
        password: '',
        type: f.type,
        turma: f.turma || undefined,
        diet: f.diet,
        consent: null,
        createdAt: new Date().toISOString(),
        offer: perms.edit && f.offer,
        payments: [],
        qr: `LD-${ev.code}-${id.toUpperCase()}`,
        guardianName: f.guardianName || undefined,
        guardianPhone: f.guardianPhone || undefined,
        addedBy: user.id,
      }
      p.customAmounts = recalcAmounts(p, ev, mod || undefined, ext)
      p.modalityId = mod || undefined
      p.extras = ext.length ? ext : undefined
      d.participants.push(p)
    })
    toast(`${f.name.trim()} adicionado.`)
    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <h3>Adicionar pessoa</h3>
      <p className="small muted">Para quem não se inscreve sozinho: professores, convidados, família. Fica na lista, nas mesas e na entrada como os outros.</p>
      <form className="stack" style={{ marginTop: 14 }} onSubmit={save}>
        <div className="field">
          <label>Nome completo *</label>
          <input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Tipo</label>
            <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as ParticipantType })}>
              {PTYPES.map((t) => (
                <option key={t} value={t}>
                  {PTYPE_LONG[t]}
                </option>
              ))}
            </select>
          </div>
          {ev.hasClasses && (
            <div className="field">
              <label>Turma (opcional)</label>
              <select className="input" value={f.turma} onChange={(e) => setF({ ...f, turma: e.target.value })}>
                <option value="">—</option>
                {ev.classes.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label>Telemóvel</label>
            <input className="input" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </div>
          <div className="field">
            <label>Email (opcional)</label>
            <input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Nascimento (opcional)</label>
            <input className="input" type="date" value={f.birth} onChange={(e) => setF({ ...f, birth: e.target.value })} />
          </div>
          <div className="field">
            <label>Alimentação</label>
            <select className="input" value={f.diet} onChange={(e) => setF({ ...f, diet: e.target.value })}>
              {DIETS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        {!!ev.modalities?.length && (
          <div className="field">
            <label>Modalidade</label>
            <select className="input" value={mod} onChange={(e) => setMod(e.target.value)}>
              <option value="">Completo</option>
              {ev.modalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {eur(m.price)}
                </option>
              ))}
            </select>
          </div>
        )}
        {!!ev.extras?.length && (
          <div className="field">
            <label>Extras</label>
            {ev.extras.map((x) => (
              <label key={x.id} className="check">
                <input type="checkbox" checked={ext.includes(x.id)} onChange={(e) => setExt(e.target.checked ? [...ext, x.id] : ext.filter((y) => y !== x.id))} />
                {x.name} (+{eur(x.price)})
              </label>
            ))}
          </div>
        )}
        {perms.edit && (
          <label className="check">
            <input type="checkbox" checked={f.offer} onChange={(e) => setF({ ...f, offer: e.target.checked })} /> Oferta (não paga)
          </label>
        )}
        <div className="alert alert-info small">{f.offer && perms.edit ? 'Oferta: não paga nada.' : `Vai pagar ${eur(personPrice(ev, mod || undefined, ext))} em ${ev.installments.length} prestações.`}</div>
        <button className="btn btn-gold">Adicionar</button>
      </form>
    </Modal>
  )
}
