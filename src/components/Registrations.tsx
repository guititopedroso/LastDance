import { useMemo, useState } from 'react'
import { dateLong, dateShort, dateTime, eur, eventPrice, exportCSV, fullyPaid, instStatus, missing, normalize, ordinal, paidFor, totalPaid } from '../data/logic'
import { uid } from '../data/seed'
import { update, useDB } from '../data/store'
import { DIETS, PTYPE_LABEL, PTYPE_LONG, type LDEvent, type Participant, type ParticipantType, type User } from '../data/types'
import { Modal, StatusPill, newPassword, toast } from './ui'

export interface Perms {
  receive: boolean
  edit: boolean
  admin: boolean
}

export const permsFor = (u: User): Perms => ({
  receive: ['admin', 'promotor_chefe', 'promotor'].includes(u.role),
  edit: ['admin', 'promotor_chefe'].includes(u.role),
  admin: u.role === 'admin',
})

type PayFilter = 'all' | 'missing' | 'paid' | 'offer'

export function Registrations({ participants, user, showEvent, exportName }: { participants: Participant[]; user: User; showEvent?: boolean; exportName: string }) {
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

  const classes = useMemo(() => [...new Set(participants.map((p) => p.turma).filter(Boolean) as string[])].sort(), [participants])
  const dietCounts = useMemo(() => {
    const m = new Map<string, number>()
    participants.forEach((p) => p.diet !== 'Nenhuma' && m.set(p.diet, (m.get(p.diet) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [participants])
  const typeCounts = (t: ParticipantType) => participants.filter((p) => p.type === t).length

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
    const c = { all: base.length, missing: 0, paid: 0, offer: 0 }
    base.forEach((p) => {
      const ev = evById.get(p.eventId)!
      if (p.offer) c.offer++
      else if (fullyPaid(p, ev)) c.paid++
      else c.missing++
    })
    return c
  }, [base, evById])

  const rows = useMemo(() => {
    const r = base.filter((p) => {
      const ev = evById.get(p.eventId)!
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

  const doExport = () => {
    const maxInst = Math.max(...rows.map((p) => evById.get(p.eventId)!.installments.length), 0)
    exportCSV(exportName, [
      ['Nome', 'Evento', 'Tipo', 'Turma', 'Email', 'Telemóvel', 'Nascimento', 'Alimentação', 'Saúde', 'Mesa', 'Oferta', ...Array.from({ length: maxInst }, (_, i) => `${ordinal(i)} prestação`), 'Pago', 'Em falta', 'Entrou'],
      ...rows.map((p) => {
        const ev = evById.get(p.eventId)!
        return [
          p.name,
          ev.name,
          PTYPE_LONG[p.type],
          p.turma ?? '',
          p.email,
          p.phone,
          p.birth,
          p.diet,
          p.health ?? '',
          ev.tables.find((t) => t.id === p.tableId)?.name ?? '',
          p.offer ? 'Sim' : '',
          ...Array.from({ length: maxInst }, (_, i) => (i < ev.installments.length ? paidFor(p, i).toFixed(2).replace('.', ',') : '')),
          totalPaid(p).toFixed(2).replace('.', ','),
          missing(p, ev).toFixed(2).replace('.', ','),
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
          <option value="finalista">Finalistas ({typeCounts('finalista')})</option>
          <option value="nao_finalista">Não finalistas ({typeCounts('nao_finalista')})</option>
          <option value="externo">Externos / acompanhantes ({typeCounts('externo')})</option>
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
            ] as const
          ).map(([id, l]) => (
            <button key={id} className={`chip ${pay === id ? 'on' : ''}`} onClick={() => (setPay(id), reset())}>
              {l} <span className="count">{payCounts[id]}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={doExport}>
          ⬇ Exportar para Excel
        </button>
      </div>

      {dietCounts.length > 0 && (
        <div className="row small" style={{ marginBottom: 14, gap: 6 }}>
          <span className="muted">Restrições alimentares:</span>
          {dietCounts.map(([d, n]) => (
            <button key={d} className={`chip ${diet === d ? 'on' : ''}`} onClick={() => (setDiet(diet === d ? '' : d), reset())}>
              {d} · {n}
            </button>
          ))}
          <span className="muted">{participants.filter((p) => p.diet === 'Nenhuma').length} sem restrições</span>
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
              return (
                <tr key={p.id}>
                  <td>
                    <b>{p.name}</b>
                    <div className="small muted">
                      {PTYPE_LABEL[p.type]}
                      {p.turma ? ` · ${p.turma}` : ''}
                      {showEvent ? ` · ${ev.name}` : ''}
                      {p.enteredAt ? ' · ✓ entrou' : ''}
                    </div>
                  </td>
                  <td className="hide-mobile small">{p.diet === 'Nenhuma' ? '—' : p.diet}</td>
                  <td className="hide-mobile small">{ev.tables.find((t) => t.id === p.tableId)?.name ?? <span className="muted">Sem mesa</span>}</td>
                  <td>
                    <div className="pills">
                      {p.offer ? <StatusPill s="offer" /> : ev.installments.map((_, i) => <StatusPill key={i} s={instStatus(p, ev, i)} label={ordinal(i)} />)}
                    </div>
                  </td>
                  <td className="num">
                    <div className="row" style={{ gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      {perms.receive && !p.offer && (
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
    </div>
  )
}

export function PaymentModal({ pid, user, onClose }: { pid: string; user: User; onClose: () => void }) {
  const db = useDB()
  const p = db.participants.find((x) => x.id === pid)!
  const ev = db.events.find((e) => e.id === p.eventId)!
  const firstOpen = ev.installments.findIndex((_, i) => instStatus(p, ev, i) !== 'paid')
  const [idx, setIdx] = useState(firstOpen < 0 ? 0 : firstOpen)
  const inst = ev.installments[idx]
  const paid = paidFor(p, idx)
  const left = Math.max(0, inst.amount - paid)
  const [value, setValue] = useState(left.toFixed(2).replace('.', ','))
  const perms = permsFor(user)
  const name = (id: string | null) => (id ? db.users.find((u) => u.id === id)?.name ?? '—' : null)

  const choose = (i: number) => {
    setIdx(i)
    const l = Math.max(0, ev.installments[i].amount - paidFor(p, i))
    setValue(l.toFixed(2).replace('.', ','))
  }

  const register = (kind: 'payment' | 'adjust', amount: number) => {
    update((d) => {
      d.participants
        .find((x) => x.id === pid)!
        .payments.push({ id: 'pg' + uid(), installment: idx, amount: Math.round(amount * 100) / 100, receivedBy: user.id, at: new Date().toISOString(), kind })
    })
    toast(kind === 'adjust' ? 'Diferença acertada.' : `Registado ${eur(amount)} na ${ordinal(idx)} prestação.`)
  }

  const num = parseFloat(value.replace(',', '.')) || 0
  const pays = p.payments.filter((x) => x.installment === idx)

  return (
    <Modal onClose={onClose}>
      <h3>Receber pagamento</h3>
      <p className="small muted">
        {p.name} · {eur(totalPaid(p))} de {eur(eventPrice(ev))}
        {missing(p, ev) > 0 && ` · faltam ${eur(missing(p, ev))}`}
      </p>
      <div className="chips" style={{ margin: '16px 0' }}>
        {ev.installments.map((it, i) => (
          <button key={i} className={`chip ${i === idx ? 'on' : ''}`} onClick={() => choose(i)}>
            {ordinal(i)} · {eur(it.amount)} {instStatus(p, ev, i) === 'paid' && '✓'}
          </button>
        ))}
      </div>
      {left <= 0.001 ? (
        <div className="alert alert-ok">Esta prestação está paga.</div>
      ) : (
        <div className="stack">
          <p className="small muted">
            Valor da prestação {eur(inst.amount)} · já recebido {eur(paid)} · em falta {eur(left)}
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
              Cancelar
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

export function FichaModal({ pid, user, onClose, onPay }: { pid: string; user: User; onClose: () => void; onPay: () => void }) {
  const db = useDB()
  const p = db.participants.find((x) => x.id === pid)
  const perms = permsFor(user)
  const [editing, setEditing] = useState(false)
  const [newPass, setNewPass] = useState<string | null>(null)
  const [f, setF] = useState(() => (p ? { name: p.name, email: p.email, phone: p.phone, birth: p.birth, type: p.type, turma: p.turma ?? '', diet: p.diet, health: p.health ?? '' } : null))
  if (!p || !f) return null
  const ev = db.events.find((e) => e.id === p.eventId) as LDEvent
  const name = (id: string | null) => (id ? db.users.find((u) => u.id === id)?.name ?? '—' : null)

  const save = () => {
    update((d) => {
      const x = d.participants.find((y) => y.id === pid)!
      Object.assign(x, { ...f, turma: f.turma || undefined, health: f.health || undefined })
    })
    setEditing(false)
    toast('Ficha atualizada.')
  }

  return (
    <Modal onClose={onClose}>
      <h3>{p.name}</h3>
      <p className="small muted">
        {PTYPE_LONG[p.type]}
        {p.turma ? ` · ${p.turma}` : ''} · {ev.name}
      </p>

      {editing ? (
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
                {(Object.keys(PTYPE_LONG) as ParticipantType[]).map((t) => (
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
          </div>
          <div className="field">
            <label>Saúde</label>
            <input className="input" value={f.health} onChange={(e) => setF({ ...f, health: e.target.value })} />
          </div>
          <div className="row">
            <button className="btn btn-gold" onClick={save}>
              Guardar
            </button>
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <dl className="kv" style={{ marginTop: 18 }}>
            <dt>Telemóvel</dt>
            <dd>{p.phone}</dd>
            <dt>Email</dt>
            <dd>{p.email}</dd>
            <dt>Nascimento</dt>
            <dd>{p.birth ? dateLong(p.birth) : '—'}</dd>
            <dt>Alimentação</dt>
            <dd>{p.diet}</dd>
            <dt>Saúde</dt>
            <dd>{p.health || 'Nada indicado'}</dd>
            <dt>Consentimento</dt>
            <dd>{p.consent ? `Aceite a ${dateShort(p.createdAt)}` : 'Sem registo (inscrição anterior)'}</dd>
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
                  <div className="pills">
                    {ev.installments.map((_, i) => (
                      <StatusPill key={i} s={instStatus(p, ev, i)} label={`${ordinal(i)} ${instStatus(p, ev, i) === 'paid' ? 'paga' : instStatus(p, ev, i) === 'overdue' ? 'em atraso' : 'em falta'}`} />
                    ))}
                  </div>
                  <div className="small muted" style={{ marginTop: 6 }}>
                    {ev.installments.filter((_, i) => instStatus(p, ev, i) === 'paid').length} de {ev.installments.length} prestações · {eur(totalPaid(p))} de {eur(eventPrice(ev))}
                  </div>
                  {ev.installments.some((i) => i.due) && (
                    <div className="small muted">Datas-limite: {ev.installments.map((i, k) => `${ordinal(k)} ${i.due ? dateShort(i.due) : '—'}`).join(' · ')}</div>
                  )}
                  {p.payments.map((x) => (
                    <div key={x.id} className="small muted">
                      {ordinal(x.installment)} prestação: {eur(x.amount)} {x.kind === 'adjust' ? '(diferença acertada)' : ''} —{' '}
                      {x.receivedBy ? `${name(x.receivedBy)}, ${dateTime(x.at)}` : 'paga antes de se registar quem recebe (sem registo)'}
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
            {perms.receive && !p.offer && (
              <button className="btn btn-gold btn-sm" onClick={onPay}>
                € Receber pagamento
              </button>
            )}
            {perms.edit && (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                Editar
              </button>
            )}
            {perms.admin && (
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
