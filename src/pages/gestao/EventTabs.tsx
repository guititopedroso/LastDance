import { useMemo, useState } from 'react'
import { Kpi, Modal, toast } from '../../components/ui'
import { cashIn, dateShort, dateTime, daysFromNow, eligibleFor, eur, eventStats, exportCSV, fullyPaid, isCancelled, normalize, ordinal, overdueList, refundPending, refunded, votingOpen } from '../../data/logic'
import { uid } from '../../data/seed'
import { update, useDB } from '../../data/store'
import { PARTNER_TYPES, PTYPE_LABEL, PTYPE_LONG, type Award, type LDEvent, type User, type VotingMode } from '../../data/types'

const mutEv = (id: string, fn: (e: LDEvent) => void) =>
  update((d) => {
    fn(d.events.find((x) => x.id === id)!)
  })

// ---------- Finanças ----------

export function FinanceTab({ ev }: { ev: LDEvent }) {
  const db = useDB()
  const s = eventStats(ev, db)
  return (
    <div className="cards-2" style={{ alignItems: 'start' }}>
      <div className="stack">
        <p className="small muted">Só a administração vê esta secção. Comerciais e promotores não têm acesso a custos nem a parceiros.</p>
        <div className="card stack">
          <h3>Quinta</h3>
          <select
            className="input"
            value={ev.venueId ?? ''}
            onChange={(e) =>
              mutEv(ev.id, (x) => {
                x.venueId = e.target.value || undefined
                const v = db.venues.find((v) => v.id === e.target.value)
                if (v) x.location = v.name
              })
            }
          >
            <option value="">Sem quinta definida</option>
            {db.venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          {s.venue && (
            <p className="small muted">
              {s.seats} inscritos (com ofertas) · mínimo da quinta {s.venue.minimum} · a pagar {Math.max(s.seats, s.venue.minimum)} lugares × {eur(s.venue.costPerPerson)} ={' '}
              {eur(s.venueCost)}
              {s.belowMin && <span style={{ color: 'var(--red)' }}> · abaixo do mínimo: pagas {s.venue.minimum - s.seats} lugares sem ninguém</span>}
            </p>
          )}
        </div>
        <div className="card stack">
          <h3>Parceiros neste evento</h3>
          <p className="small muted">Marca quem está destacado. O valor vem da ficha do parceiro e podes ajustá-lo só para este evento.</p>
          {PARTNER_TYPES.map((t) => (
            <div key={t}>
              <div className="label" style={{ marginBottom: 6 }}>
                {t}
              </div>
              {db.partners
                .filter((p) => p.type === t)
                .map((p) => {
                  const ep = ev.partners.find((x) => x.partnerId === p.id)
                  return (
                    <div key={p.id} className="row" style={{ marginBottom: 6, flexWrap: 'nowrap' }}>
                      <label className="check grow">
                        <input
                          type="checkbox"
                          checked={!!ep}
                          onChange={(e) =>
                            mutEv(ev.id, (x) => {
                              x.partners = e.target.checked ? [...x.partners, { partnerId: p.id }] : x.partners.filter((y) => y.partnerId !== p.id)
                            })
                          }
                        />
                        {p.name}
                      </label>
                      {ep ? (
                        <input
                          className="input"
                          style={{ width: 120 }}
                          type="number"
                          value={ep.cost ?? p.baseCost}
                          onChange={(e) =>
                            mutEv(ev.id, (x) => {
                              x.partners.find((y) => y.partnerId === p.id)!.cost = +e.target.value
                            })
                          }
                        />
                      ) : (
                        <span className="small muted">{eur(p.baseCost)} (base)</span>
                      )}
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
      <div className="card stack">
        <h3>Conta do evento</h3>
        {[
          ['Receita prevista', s.expected],
          ['− Quinta', s.venueCost],
          ['− Parceiros', s.partnersCost],
          ['− Comissões a pagar', s.commissionToPay],
        ].map(([l, v]) => (
          <div key={l as string} className="row between">
            <span className="muted">{l}</span>
            <b>{eur(v as number)}</b>
          </div>
        ))}
        <div className="row between" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 12 }}>
          <b>= Margem bruta</b>
          <b style={{ fontSize: '1.4rem', color: s.margin < 0 ? 'var(--red)' : 'var(--green)' }}>{eur(s.margin)}</b>
        </div>
        <p className="small muted">
          Já recebido em mão: {eur(s.received)}. As comissões dos sócios ({eur(s.commissionKept)}) não são custo: ficam na empresa.
        </p>
      </div>
    </div>
  )
}

// ---------- Prémios ----------

export function AwardsTab({ ev }: { ev: LDEvent }) {
  const db = useDB()
  const ps = db.participants.filter((p) => p.eventId === ev.id)
  const paid = ps.filter((p) => fullyPaid(p, ev))
  const votes = db.votes.filter((v) => v.eventId === ev.id)
  const rule = (a: Award) =>
    a.eligible
      ? `Podem ser votadas ${a.eligible.length} pessoas escolhidas.`
      : a.excluded?.length
        ? `Todos os participantes com tudo pago menos ${a.excluded.length} (${paid.filter((p) => eligibleFor(a, p, ev)).length} pessoas).`
        : `Pode ser votado qualquer participante com tudo pago (${paid.length} pessoas).`
  /** Apuramento automático: o mais votado de cada prémio (em empate, fica o primeiro a chegar a esse número). */
  const autoWinners = () => {
    let n = 0
    mutEv(ev.id, (x) => {
      x.awards.forEach((a) => {
        const tally = new Map<string, number>()
        votes.filter((v) => v.awardId === a.id).forEach((v) => tally.set(v.candidateId, (tally.get(v.candidateId) ?? 0) + 1))
        const top = [...tally.entries()].sort((p, q) => q[1] - p[1])[0]
        if (top) {
          a.winnerId = top[0]
          n++
        }
      })
    })
    toast(n ? `Vencedores apurados em ${n} prémio(s). Confirma e anuncia.` : 'Ainda não há votos para apurar.')
  }
  const voters = new Set(votes.map((v) => v.voterId)).size
  const [edit, setEdit] = useState<Award | null>(null)
  const open = votingOpen(ev)
  const name = (id: string) => ps.find((p) => p.id === id)?.name ?? '—'

  return (
    <div className="stack">
      <h3>Votação dos prémios</h3>
      <p className="muted">
        Os participantes com tudo pago votam durante o horário do evento ({ev.start} às {ev.end}). Defines os prémios e quem pode ser votado em cada um, e depois escolhes os
        vencedores e anuncias.
      </p>
      <div className="row">
        <span className="label">Votação</span>
        <div className="seg">
          {(
            [
              ['auto', 'Automática (durante o horário do evento)'],
              ['open', 'Aberta agora'],
              ['closed', 'Fechada'],
              ['none', 'Sem prémios neste evento'],
            ] as [VotingMode, string][]
          ).map(([m, l]) => (
            <button key={m} className={ev.votingMode === m ? 'on' : ''} onClick={() => mutEv(ev.id, (x) => (x.votingMode = m))}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className={`alert ${open ? 'alert-ok' : 'alert-info'}`}>
        {ev.announced
          ? 'Vencedores anunciados. A votação está fechada.'
          : open
            ? 'A votação está aberta.'
            : ev.votingMode === 'auto'
              ? `Ainda não abriu. Abre a ${dateShort(ev.date)} às ${ev.start}.`
              : 'A votação está fechada.'}{' '}
        {voters} pessoa(s) já votaram.
      </div>

      {ev.votingMode !== 'none' &&
        ev.awards.map((a) => {
          const tally = new Map<string, number>()
          votes.filter((v) => v.awardId === a.id).forEach((v) => tally.set(v.candidateId, (tally.get(v.candidateId) ?? 0) + 1))
          const ranking = [...tally.entries()].sort((x, y) => y[1] - x[1])
          const total = ranking.reduce((s, r) => s + r[1], 0)
          return (
            <div key={a.id} className="card stack">
              <div className="row between">
                <h3>{a.name}</h3>
                <span className="small muted">
                  {total} votos ·{' '}
                  <button className="link" onClick={() => setEdit(structuredClone(a))}>
                    Editar prémio
                  </button>
                </span>
              </div>
              <p className="small muted">{rule(a)}</p>
              {a.winnerId && (
                <div className="alert alert-ok">
                  Vencedor escolhido: <b>{name(a.winnerId)}</b>
                </div>
              )}
              {ranking.length === 0 ? (
                <p className="small muted">Ainda sem votos.</p>
              ) : (
                <div className="list">
                  {ranking.slice(0, 8).map(([cid, n]) => (
                    <div key={cid} className="list-item">
                      <div className="grow">
                        <div className="t">{name(cid)}</div>
                        <div className="progress" style={{ marginTop: 6 }}>
                          <div style={{ width: `${(n / total) * 100}%` }} />
                        </div>
                      </div>
                      <b>{n}</b>
                      <button
                        className={`btn btn-sm ${a.winnerId === cid ? 'btn-gold' : 'btn-ghost'}`}
                        onClick={() =>
                          mutEv(ev.id, (x) => {
                            x.awards.find((y) => y.id === a.id)!.winnerId = cid
                          })
                        }
                      >
                        {a.winnerId === cid ? 'Vencedor' : 'Escolher'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

      {ev.votingMode !== 'none' && (
        <div className="row">
          <button className="btn btn-ghost" onClick={() => setEdit({ id: '', name: '', eligible: null })}>
            + Adicionar prémio
          </button>
        </div>
      )}

      <div className="card stack">
        <h3>Anunciar vencedores</h3>
        <p className="small muted">
          Os votos são secretos: ninguém vê em quem cada pessoa votou. Apura automaticamente os mais votados (ou escolhe à mão em cada prémio) e anuncia. Ao anunciar, a votação fecha e os
          vencedores aparecem na área de cada participante.
        </p>
        <div className="row">
          <button className="btn btn-ghost" disabled={ev.announced} onClick={autoWinners}>
            Apurar automaticamente
          </button>
          <button
            className="btn btn-gold"
            disabled={ev.announced || !ev.awards.some((a) => a.winnerId)}
            onClick={() => {
              mutEv(ev.id, (x) => {
                x.announced = true
                x.votingMode = 'closed'
              })
              toast('Vencedores anunciados!')
            }}
          >
            Anunciar vencedores
          </button>
          {ev.announced && (
            <button className="btn btn-ghost" onClick={() => mutEv(ev.id, (x) => (x.announced = false))}>
              Desfazer anúncio
            </button>
          )}
        </div>
      </div>

      {edit && <AwardModal ev={ev} award={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

function AwardModal({ ev, award, onClose }: { ev: LDEvent; award: Award; onClose: () => void }) {
  const db = useDB()
  const [a, setA] = useState(award)
  const [q, setQ] = useState('')
  const ps = db.participants.filter((p) => p.eventId === ev.id && fullyPaid(p, ev))
  const found = q ? ps.filter((p) => normalize(p.name).includes(normalize(q))).slice(0, 8) : []
  const mode: 'all' | 'except' | 'only' = a.eligible ? 'only' : a.excluded ? 'except' : 'all'
  const list = mode === 'only' ? a.eligible! : a.excluded ?? []
  const setList = (ids: string[]) => setA(mode === 'only' ? { ...a, eligible: ids } : { ...a, excluded: ids })
  return (
    <Modal onClose={onClose}>
      <h3>{a.id ? 'Editar prémio' : 'Novo prémio'}</h3>
      <div className="stack" style={{ marginTop: 16 }}>
        <div className="field">
          <label>Nome do prémio</label>
          <input className="input" value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} placeholder="Ex.: Casal do Ano" />
        </div>
        <div className="field">
          <label>Quem pode ser votado</label>
          <div className="seg" style={{ alignSelf: 'flex-start' }}>
            <button className={mode === 'all' ? 'on' : ''} onClick={() => setA({ ...a, eligible: null, excluded: undefined })}>
              Todos
            </button>
            <button className={mode === 'except' ? 'on' : ''} onClick={() => setA({ ...a, eligible: null, excluded: a.excluded ?? [] })}>
              Todos menos alguns
            </button>
            <button className={mode === 'only' ? 'on' : ''} onClick={() => setA({ ...a, eligible: a.eligible ?? [], excluded: undefined })}>
              Só os escolhidos
            </button>
          </div>
        </div>
        <p className="small muted">Só podem ser votados participantes com tudo pago.</p>
        {mode !== 'all' && (
          <>
            <input className="input" placeholder={mode === 'only' ? 'Procurar quem pode ser votado…' : 'Procurar quem fica de fora…'} value={q} onChange={(e) => setQ(e.target.value)} />
            {found.map((p) => (
              <button
                key={p.id}
                className="chip"
                onClick={() => {
                  if (!list.includes(p.id)) setList([...list, p.id])
                  setQ('')
                }}
              >
                + {p.name}
              </button>
            ))}
            <div className="chips">
              {list.map((id) => (
                <span key={id} className={`chip ${mode === 'only' ? 'on' : ''}`}>
                  {mode === 'except' && 'sem '}
                  {db.participants.find((p) => p.id === id)?.name}
                  <button className="link" onClick={() => setList(list.filter((x) => x !== id))}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </>
        )}
        <div className="row">
          <button
            className="btn btn-gold"
            disabled={!a.name.trim()}
            onClick={() => {
              mutEv(ev.id, (x) => {
                if (a.id) x.awards = x.awards.map((y) => (y.id === a.id ? a : y))
                else x.awards.push({ ...a, id: 'aw' + uid() })
              })
              onClose()
            }}
          >
            Guardar
          </button>
          {a.id && (
            <button
              className="btn btn-danger"
              onClick={() => {
                mutEv(ev.id, (x) => {
                  x.awards = x.awards.filter((y) => y.id !== a.id)
                })
                update((d) => {
                  d.votes = d.votes.filter((v) => v.awardId !== a.id)
                })
                onClose()
              }}
            >
              Apagar prémio
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ---------- Recebimentos ----------

export function ReceiptsTab({ ev, user }: { ev: LDEvent; user: User }) {
  const db = useDB()
  const [open, setOpen] = useState<string | null>(null)
  const ps = db.participants.filter((p) => p.eventId === ev.id)
  const all = ps.flatMap((p) => p.payments.map((x) => ({ ...x, who: p.name })))
  const mineOnly = user.role === 'promotor'
  const list = mineOnly ? all.filter((x) => x.receivedBy === user.id) : all
  const registered = list.filter((x) => x.receivedBy && x.kind === 'payment').reduce((s, x) => s + x.amount, 0)
  const unregistered = list.filter((x) => !x.receivedBy && x.kind === 'payment').reduce((s, x) => s + x.amount, 0)
  const adjusted = list.filter((x) => x.kind === 'adjust').reduce((s, x) => s + x.amount, 0)
  const refundsOut = list.filter((x) => x.kind === 'refund').reduce((s, x) => s + x.amount, 0)
  const groups = new Map<string, typeof list>()
  list.forEach((x) => {
    const k = x.receivedBy ?? '__none'
    groups.set(k, [...(groups.get(k) ?? []), x])
  })
  const receivers = [...groups.keys()].filter((k) => k !== '__none')

  return (
    <div className="stack">
      <div className="kpis">
        <Kpi hl k={mineOnly ? 'Recebido por ti' : 'Recebido e registado'} v={eur(registered)} />
        {!mineOnly && <Kpi k="Sem registo de quem recebeu" v={eur(unregistered)} />}
        <Kpi k="Diferenças acertadas" v={eur(adjusted)} />
        {refundsOut > 0 && <Kpi bad k="Devoluções feitas" v={eur(refundsOut)} />}
        {!mineOnly && <Kpi k="Pessoas a receber" v={receivers.length} />}
      </div>
      <p className="small muted">
        Cada pagamento fica com o nome de quem o recebeu, o valor e a hora. Os pagamentos anteriores a este registo aparecem como «Sem registo». As diferenças acertadas são
        valores perdoados numa prestação (ex.: faltaram 2 € de troco).
      </p>
      <div className="list">
        {[...groups.entries()]
          .sort((a, b) => (a[0] === '__none' ? -1 : b[1].length - a[1].length))
          .map(([k, items]) => {
            const u = db.users.find((x) => x.id === k)
            const total = items.reduce((s, x) => s + x.amount, 0)
            return (
              <div key={k}>
                <div className="list-item click" onClick={() => setOpen(open === k ? null : k)}>
                  <div className="grow">
                    <div className="t">
                      {k === '__none' ? 'Sem registo' : u?.name ?? '—'} {u?.role === 'promotor_chefe' && <span className="pill offer">chefe</span>}
                      {u?.role === 'admin' && <span className="pill offer">LastDance</span>}
                    </div>
                    <div className="s">
                      {k === '__none' ? 'pagamentos anteriores ao registo · ' : ''}
                      {items.length} pagamentos · {eur(total)}
                    </div>
                  </div>
                  <span className="chev">{open === k ? '⌄' : '›'}</span>
                </div>
                {open === k && (
                  <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                    {[...items]
                      .sort((a, b) => b.at.localeCompare(a.at))
                      .map((x) => (
                        <div key={x.id} className="list-item small" style={{ paddingLeft: 34 }}>
                          <span className="grow">
                            {x.who} · {x.kind === 'refund' ? 'devolução' : `${ordinal(x.installment)} prestação`} {x.kind === 'adjust' && '(diferença acertada)'}
                          </span>
                          <span className="muted">{dateTime(x.at)}</span>
                          <b>{eur(x.amount)}</b>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        {list.length === 0 && <div className="empty">Ainda sem pagamentos registados.</div>}
      </div>
    </div>
  )
}

// ---------- Em atraso ----------

export function OverdueTab({ ev }: { ev: LDEvent }) {
  const db = useDB()
  const ps = db.participants.filter((p) => p.eventId === ev.id)
  const rows = ps
    .map((p) => ({ p, od: overdueList(p, ev) }))
    .filter((r) => r.od.length)
    .sort((a, b) => b.od.length - a.od.length || a.p.name.localeCompare(b.p.name, 'pt'))
  const total = rows.reduce((s, r) => s + r.od.reduce((a, o) => a + o.left, 0), 0)

  const copy = () => {
    const txt = rows.map((r) => `${r.p.name}${r.p.turma ? ` (${r.p.turma})` : ''} — ${r.od.map((o) => `${ordinal(o.i)} ${eur(o.left)}`).join(', ')}`).join('\n')
    navigator.clipboard?.writeText(`Prestações em atraso · ${ev.name}\n\n${txt}`)
    toast('Lista copiada. Cola no grupo da turma.')
  }

  return (
    <div className="stack">
      <p className="small muted">
        Datas-limite: {ev.installments.map((i, k) => `${ordinal(k)} ${i.due ? dateShort(i.due) : 'sem data'}`).join(' · ')}. Uma prestação fica em atraso no dia a seguir à
        data-limite.
      </p>
      <div className="row between">
        <b>
          {rows.length} pessoas em atraso · {eur(total)} por receber
        </b>
        <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!rows.length}>
          Copiar lista
        </button>
      </div>
      <div className="list">
        {rows.map(({ p, od }) => (
          <div key={p.id} className="list-item">
            <div className="grow">
              <div className="t">{p.name}</div>
              <div className="s">
                {PTYPE_LONG[p.type]}
                {p.turma ? ` · ${p.turma}` : ''} · {p.phone} · {p.email}
              </div>
              <div className="pills" style={{ marginTop: 6 }}>
                {od.map((o) => (
                  <span key={o.i} className="pill overdue">
                    {ordinal(o.i)} · {eur(o.left)} · há {-daysFromNow(o.inst.due!)} dias
                  </span>
                ))}
              </div>
            </div>
            <b>{eur(od.reduce((a, o) => a + o.left, 0))}</b>
            <a
              className="btn btn-ghost btn-sm"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/351${p.phone.replace(/\D/g, '').slice(-9)}?text=${encodeURIComponent(
                `Olá ${p.name.split(' ')[0]}! Lembrete LastDance: tens ${od.map((o) => `a ${ordinal(o.i)} prestação (${eur(o.left)})`).join(' e ')} do ${ev.name} em atraso. Obrigado!`,
              )}`}
            >
              Lembrar
            </a>
          </div>
        ))}
        {rows.length === 0 && <div className="empty">Ninguém em atraso. 🎉</div>}
      </div>
    </div>
  )
}

// ---------- Mesas ----------

export function TablesTab({ ev, readOnly }: { ev: LDEvent; readOnly?: boolean }) {
  const db = useDB()
  const ps = useMemo(() => db.participants.filter((p) => p.eventId === ev.id && !isCancelled(p)), [db.participants, ev.id])
  const [n, setN] = useState(5)
  const [seats, setSeats] = useState(10)
  const [drag, setDrag] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [editTable, setEditTable] = useState<{ id: string; name: string; seats: number } | null>(null)
  const seated = ps.filter((p) => p.tableId && ev.tables.some((t) => t.id === p.tableId))
  const unseated = ps.filter((p) => !seated.includes(p)).sort((a, b) => (a.turma ?? '').localeCompare(b.turma ?? '') || a.name.localeCompare(b.name, 'pt'))
  const capacity = ev.tables.reduce((s, t) => s + t.seats, 0)
  const occ = (tid: string) => ps.filter((p) => p.tableId === tid).length

  const seat = (pid: string, tid: string | undefined) => {
    if (tid) {
      const t = ev.tables.find((x) => x.id === tid)!
      if (occ(tid) >= t.seats) return toast(`${t.name} está cheia.`)
    }
    update((d) => {
      d.participants.find((p) => p.id === pid)!.tableId = tid
    })
  }

  const autoSeat = (by: 'turma' | 'name') => {
    const order = [...unseated].sort((a, b) => (by === 'turma' ? (a.turma ?? 'zz').localeCompare(b.turma ?? 'zz') : 0) || a.name.localeCompare(b.name, 'pt'))
    update((d) => {
      const left = new Map(ev.tables.map((t) => [t.id, t.seats - occ(t.id)]))
      for (const p of order) {
        const t = ev.tables.find((t) => (left.get(t.id) ?? 0) > 0)
        if (!t) break
        d.participants.find((x) => x.id === p.id)!.tableId = t.id
        left.set(t.id, left.get(t.id)! - 1)
      }
    })
    toast('Convidados sentados.')
  }

  /** Abre uma página simples para imprimir ou guardar em PDF (Ctrl+P → Guardar como PDF). */
  const printTables = () => {
    const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
    const block = (title: string, people: typeof ps) =>
      `<section><h2>${esc(title)} <small>${people.length}</small></h2><ol>${people
        .map((p) => `<li>${esc(p.name)}${p.turma ? ` <i>${esc(p.turma)}</i>` : ''}${p.diet !== 'Nenhuma' ? ` <b>${esc(p.diet)}</b>` : ''}</li>`)
        .join('')}</ol></section>`
    const html = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>Mesas · ${esc(ev.name)}</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#222}h1{font-size:20px;margin:0 0 4px}p{margin:0 0 18px;color:#666}
      main{columns:3 220px;column-gap:24px}section{break-inside:avoid;border:1px solid #ccc;border-radius:8px;padding:10px 12px;margin:0 0 14px}
      h2{font-size:15px;margin:0 0 6px;color:#591017}small{color:#888;font-weight:400}ol{margin:0;padding-left:20px;font-size:13px;line-height:1.5}i{color:#777}b{color:#b05a00;font-weight:600;font-size:11px}
      </style></head><body><h1>Mesas · ${esc(ev.name)}</h1><p>${esc(dateShort(ev.date))} · ${esc(ev.location)} · ${ps.length - unseated.length} sentados</p><main>${ev.tables
      .map((t) => block(t.name, ps.filter((p) => p.tableId === t.id)))
      .join('')}${unseated.length ? block('Sem mesa', unseated) : ''}</main><script>window.onload=()=>window.print()</script></body></html>`
    const w = window.open('', '_blank')
    if (!w) return toast('O browser bloqueou a janela. Permite pop-ups para imprimir.')
    w.document.write(html)
    w.document.close()
  }

  const exportTables = () =>
    exportCSV(`mesas-${ev.code}`, [
      ['Mesa', 'Nome', 'Tipo', 'Turma', 'Alimentação'],
      ...ev.tables.flatMap((t) => ps.filter((p) => p.tableId === t.id).map((p) => [t.name, p.name, PTYPE_LABEL[p.type], p.turma ?? '', p.diet])),
      ...unseated.map((p) => ['Sem mesa', p.name, PTYPE_LABEL[p.type], p.turma ?? '', p.diet]),
    ])

  return (
    <div className="stack">
      <p className="muted">
        {seated.length} sentados · {unseated.length} sem mesa · {ev.tables.length} mesas com {capacity} lugares
      </p>
      {!readOnly && (
        <div className="row card" style={{ padding: 14 }}>
          <div className="field" style={{ width: 110 }}>
            <label>Nº de mesas</label>
            <input className="input" type="number" min="1" value={n} onChange={(e) => setN(+e.target.value)} />
          </div>
          <div className="field" style={{ width: 110 }}>
            <label>Lugares</label>
            <input className="input" type="number" min="1" value={seats} onChange={(e) => setSeats(+e.target.value)} />
          </div>
          <button
            className="btn btn-gold btn-sm"
            style={{ alignSelf: 'flex-end' }}
            onClick={() =>
              mutEv(ev.id, (x) => {
                const start = x.tables.length
                for (let i = 0; i < n; i++) x.tables.push({ id: 't' + uid(), name: `Mesa ${start + i + 1}`, seats })
              })
            }
          >
            Adicionar mesas
          </button>
          <span className="grow" />
          {ev.hasClasses && (
            <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end' }} onClick={() => autoSeat('turma')} disabled={!ev.tables.length}>
              Sentar por turma
            </button>
          )}
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end' }} onClick={() => autoSeat('name')} disabled={!ev.tables.length}>
            Sentar por nome
          </button>
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end' }} onClick={exportTables}>
            Exportar mesas
          </button>
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end' }} onClick={printTables} disabled={!ev.tables.length}>
            Imprimir / PDF
          </button>
        </div>
      )}

      <div className="split-1-2">
        <div
          className={`card ${over === '__none' ? 'drop' : ''}`}
          onDragOver={(e) => {
            if (readOnly) return
            e.preventDefault()
            setOver('__none')
          }}
          onDragLeave={() => setOver(null)}
          onDrop={() => {
            if (drag) seat(drag, undefined)
            setDrag(null)
            setOver(null)
          }}
        >
          <h3>Sem mesa</h3>
          <p className="small muted">{unseated.length} convidados. {!readOnly && 'Arrasta para uma mesa ou escolhe a mesa.'}</p>
          <input className="input" style={{ margin: '10px 0' }} placeholder="Procurar…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            {unseated
              .filter((p) => !q || normalize(p.name).includes(normalize(q)))
              .map((p) => (
                <div key={p.id} className="seat" draggable={!readOnly} onDragStart={() => setDrag(p.id)} style={{ alignItems: 'center' }}>
                  <span>
                    {p.name}
                    <span className="muted">
                      {' '}
                      · {PTYPE_LABEL[p.type]}
                      {p.turma ? ` · ${p.turma}` : ''}
                      {p.diet !== 'Nenhuma' ? ` · ${p.diet}` : ''}
                    </span>
                  </span>
                  {!readOnly && ev.tables.length > 0 && (
                    <select className="input" style={{ width: 'auto', padding: '3px 6px', fontSize: '0.78rem' }} value="" onChange={(e) => seat(p.id, e.target.value)}>
                      <option value="">Mesa…</option>
                      {ev.tables.map((t) => (
                        <option key={t.id} value={t.id} disabled={occ(t.id) >= t.seats}>
                          {t.name} ({t.seats - occ(t.id)} livres)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div className="tables-grid">
          {ev.tables.map((t) => {
            const at = ps.filter((p) => p.tableId === t.id)
            return (
              <div
                key={t.id}
                className={`table-card ${over === t.id ? 'drop' : ''}`}
                onDragOver={(e) => {
                  if (readOnly) return
                  e.preventDefault()
                  setOver(t.id)
                }}
                onDragLeave={() => setOver(null)}
                onDrop={() => {
                  if (drag) seat(drag, t.id)
                  setDrag(null)
                  setOver(null)
                }}
              >
                <div className="row between">
                  <b>{t.name}</b>
                  <span className={`small ${at.length >= t.seats ? 'gold' : 'muted'}`}>
                    {at.length}/{t.seats}
                  </span>
                </div>
                {at.map((p) => (
                  <div key={p.id} className="seat" draggable={!readOnly} onDragStart={() => setDrag(p.id)}>
                    <span>
                      {p.name}
                      {p.diet !== 'Nenhuma' && <span className="gold"> {p.diet}</span>}
                    </span>
                    {!readOnly && <button onClick={() => seat(p.id, undefined)}>×</button>}
                  </div>
                ))}
                {!readOnly && (
                  <div className="row small" style={{ marginTop: 8, gap: 8 }}>
                    <button
                      className="link"
                      onClick={() => setEditTable({ id: t.id, name: t.name, seats: t.seats })}
                    >
                      Editar
                    </button>
                    <button
                      className="link"
                      onClick={() => {
                        if (!confirm(`Remover ${t.name}? Os convidados ficam sem mesa.`)) return
                        update((d) => {
                          d.participants.forEach((p) => p.tableId === t.id && (p.tableId = undefined))
                          d.events.find((x) => x.id === ev.id)!.tables = ev.tables.filter((y) => y.id !== t.id)
                        })
                      }}
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {ev.tables.length === 0 && <div className="empty card">Ainda sem mesas. {!readOnly && 'Adiciona mesas acima.'}</div>}
        </div>
      </div>
      {editTable && (
        <Modal onClose={() => setEditTable(null)}>
          <h3>Editar mesa</h3>
          <form
            className="stack"
            style={{ marginTop: 16 }}
            onSubmit={(e) => {
              e.preventDefault()
              mutEv(ev.id, (x) => {
                const y = x.tables.find((y) => y.id === editTable.id)!
                y.name = editTable.name.trim() || y.name
                if (editTable.seats > 0) y.seats = editTable.seats
              })
              setEditTable(null)
            }}
          >
            <div className="grid-2">
              <div className="field">
                <label>Nome</label>
                <input className="input" value={editTable.name} onChange={(e) => setEditTable({ ...editTable, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Lugares</label>
                <input className="input" type="number" min="1" value={editTable.seats} onChange={(e) => setEditTable({ ...editTable, seats: +e.target.value })} />
              </div>
            </div>
            <button className="btn btn-gold">Guardar</button>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ---------- Cancelamentos e devoluções ----------

export function CancellationsTab({ ev, user }: { ev: LDEvent; user: User }) {
  const db = useDB()
  const canRefund = user.role === 'admin' || user.role === 'promotor_chefe'
  const list = db.participants.filter((p) => p.eventId === ev.id && isCancelled(p)).sort((a, b) => (b.cancelledAt ?? '').localeCompare(a.cancelledAt ?? ''))
  const [refundFor, setRefundFor] = useState<string | null>(null)
  const [value, setValue] = useState('')
  const name = (id?: string | null) => (id ? db.users.find((u) => u.id === id)?.name ?? '—' : 'sem registo')
  const pendingTotal = list.reduce((s, p) => s + refundPending(p), 0)
  const target = list.find((p) => p.id === refundFor)

  return (
    <div className="stack">
      <div className="kpis">
        <Kpi k="Cancelamentos" v={list.length} />
        <Kpi bad={pendingTotal > 0} k="Por devolver" v={eur(pendingTotal)} />
        <Kpi k="Já devolvido" v={eur(list.reduce((s, p) => s + refunded(p), 0))} />
        <Kpi hl k="Fica na empresa" v={eur(list.reduce((s, p) => s + Math.max(0, cashIn(p) + refunded(p) - (p.refundDue ?? 0)), 0))} />
      </div>
      <p className="small muted">
        Quem cancela deixa de contar para mesas, entrada, votação e comissões. Só o promotor chefe e a administração registam cancelamentos (na ficha da pessoa) e devoluções.
      </p>
      <div className="list">
        {list.map((p) => (
          <div key={p.id} className="list-item">
            <div className="grow">
              <div className="t">{p.name}</div>
              <div className="s">
                Cancelado a {dateShort(p.cancelledAt!)}
                {p.cancelReason ? ` · ${p.cancelReason}` : ''} · pagou {eur(cashIn(p) + refunded(p))} · a devolver {eur(p.refundDue ?? 0)}
              </div>
              {p.payments
                .filter((x) => x.kind === 'refund')
                .map((x) => (
                  <div key={x.id} className="s">
                    Devolvido {eur(x.amount)} por {name(x.receivedBy)} · {dateTime(x.at)}
                  </div>
                ))}
            </div>
            {refundPending(p) > 0 ? <span className="pill overdue">falta {eur(refundPending(p))}</span> : <span className="pill paid">resolvido</span>}
            {canRefund && refundPending(p) > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setRefundFor(p.id)
                  setValue(refundPending(p).toFixed(2).replace('.', ','))
                }}
              >
                Registar devolução
              </button>
            )}
          </div>
        ))}
        {list.length === 0 && <div className="empty">Sem cancelamentos.</div>}
      </div>
      {target && (
        <Modal onClose={() => setRefundFor(null)}>
          <h3>Registar devolução</h3>
          <p className="small muted">
            {target.name} · falta devolver {eur(refundPending(target))}
          </p>
          <div className="field" style={{ marginTop: 14 }}>
            <label>Valor devolvido (€)</label>
            <input className="input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          </div>
          <button
            className="btn btn-gold"
            style={{ marginTop: 14 }}
            onClick={() => {
              const v = Math.min(refundPending(target), parseFloat(value.replace(',', '.')) || 0)
              if (v <= 0) return
              update((d) => {
                d.participants
                  .find((x) => x.id === target.id)!
                  .payments.push({ id: 'pg' + uid(), installment: -1, amount: Math.round(v * 100) / 100, receivedBy: user.id, at: new Date().toISOString(), kind: 'refund' })
              })
              toast(`Devolução de ${eur(v)} registada.`)
              setRefundFor(null)
            }}
          >
            Registar
          </button>
        </Modal>
      )}
    </div>
  )
}
