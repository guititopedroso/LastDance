// Acompanhantes: o aluno adiciona-os na sua área (sem conta própria) e paga as prestações deles.
// A gestão vê os totais por modalidade (completo / só jantar / só cocktail / só festa) e quem leva quem.
import { useMemo, useState } from 'react'
import {
  BASE_MODALITY,
  canHost,
  dateShort,
  eur,
  eventPrice,
  exportCSV,
  fullyPaid,
  guestsOf,
  isCancelled,
  isGuest,
  missing,
  modalityName,
  ordinal,
  personPrice,
  plan,
  recalcAmounts,
  totalDue,
  totalPaid,
} from '../data/logic'
import { uid } from '../data/seed'
import { update, useDB } from '../data/store'
import { DIETS, MAX_GUESTS, type LDEvent, type Participant } from '../data/types'
import { Kpi, QR, StatusPill, toast } from './ui'

type GuestForm = { name: string; birth: string; phone: string; diet: string; mod: string; consent: boolean }
const blank = (): GuestForm => ({ name: '', birth: '', phone: '', diet: 'Nenhuma', mod: '', consent: false })

/** Escolha da modalidade (com preço total de cada uma). */
function ModalityPicker({ ev, value, onChange }: { ev: LDEvent; value: string; onChange: (v: string) => void }) {
  const opts = [{ id: '', name: BASE_MODALITY, price: eventPrice(ev) }, ...(ev.modalities ?? [])]
  return (
    <div className="field">
      <label>O que inclui *</label>
      <div className="stack" style={{ gap: 6 }}>
        {opts.map((m) => (
          <label key={m.id} className="check">
            <input type="radio" name="guest-mod" checked={value === m.id} onChange={() => onChange(m.id)} />
            {m.name} · {eur(m.price)}
          </label>
        ))}
      </div>
    </div>
  )
}

function GuestFields({ ev, f, setF, isNew }: { ev: LDEvent; f: GuestForm; setF: (f: GuestForm) => void; isNew: boolean }) {
  return (
    <div className="stack">
      <div className="field">
        <label>Nome completo (como no documento de identificação) *</label>
        <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus={isNew} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Data de nascimento *</label>
          <input className="input" type="date" value={f.birth} onChange={(e) => setF({ ...f, birth: e.target.value })} />
        </div>
        <div className="field">
          <label>Telemóvel (opcional)</label>
          <input className="input" type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </div>
      </div>
      {!!ev.modalities?.length && <ModalityPicker ev={ev} value={f.mod} onChange={(mod) => setF({ ...f, mod })} />}
      <div className="field">
        <label>Restrições alimentares</label>
        <select className="input" value={f.diet} onChange={(e) => setF({ ...f, diet: e.target.value })}>
          {DIETS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      {isNew && (
        <label className="check small">
          <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
          <span>
            O meu acompanhante sabe que estes dados ficam na LastDance para organizar o evento e aceita a{' '}
            <a href="/privacidade" target="_blank" rel="noreferrer" className="gold">
              política de privacidade
            </a>
            .
          </span>
        </label>
      )}
    </div>
  )
}

const valid = (f: GuestForm, isNew: boolean) => f.name.trim().length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(f.birth) && (!isNew || f.consent)

/** Prestações de um acompanhante (separadas das do aluno). */
function GuestInstallments({ g, ev }: { g: Participant; ev: LDEvent }) {
  const rows = plan(g, ev)
  return (
    <div className="list">
      {ev.installments.map((inst, i) => {
        const st = rows[i].status
        return (
          <div key={i} className="list-item small">
            <div className="grow">
              <div className="t">{ordinal(i)} prestação</div>
              <div className="s">{inst.due ? `Até ${dateShort(inst.due)}` : 'Sem data-limite'}</div>
            </div>
            <b>{eur(rows[i].amount)}</b>
            <StatusPill s={st} label={st === 'partial' || (st === 'overdue' && rows[i].paid > 0) ? `Parcial · ${eur(rows[i].paid)}` : undefined} />
          </div>
        )
      })}
    </div>
  )
}

function guestStatus(g: Participant, ev: LDEvent): { s: 'paid' | 'overdue' | 'missing'; label: string } {
  if (fullyPaid(g, ev)) return { s: 'paid', label: 'Tudo pago' }
  const late = plan(g, ev).some((r) => r.status === 'overdue')
  return { s: late ? 'overdue' : 'missing', label: `${late ? 'Em atraso · ' : ''}faltam ${eur(missing(g, ev))}` }
}

/** Cartão "Acompanhantes" da área do aluno. */
export function GuestsCard({ host, ev, past }: { host: Participant; ev: LDEvent; past: boolean }) {
  const db = useDB()
  const all = guestsOf(db, host)
  const active = all.filter((g) => !isCancelled(g))
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState<GuestForm>(blank)
  const [open, setOpen] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [ef, setEf] = useState<GuestForm>(blank)
  const room = MAX_GUESTS - active.length
  const full = !!ev.capacity && db.participants.filter((x) => x.eventId === ev.id && !isCancelled(x)).length >= ev.capacity
  const mayAdd = canHost(host) && !past && room > 0 && !full

  const add = () => {
    const id = 'p' + uid()
    update((d) => {
      const g: Participant = {
        id,
        eventId: ev.id,
        name: f.name.trim(),
        birth: f.birth,
        phone: f.phone.trim(),
        email: '',
        password: '',
        type: 'convidado',
        diet: f.diet,
        consent: true,
        createdAt: new Date().toISOString(),
        offer: false,
        payments: [],
        qr: `LD-${ev.code}-${id.toUpperCase()}`,
        tableId: host.tableId,
        hostId: host.id,
        modalityId: f.mod || undefined,
      }
      g.customAmounts = recalcAmounts(g, ev, f.mod || undefined, [])
      d.participants.push(g)
    })
    toast(`${f.name.trim()} adicionado. Paga as prestações ao teu promotor.`)
    setF(blank())
    setAdding(false)
    setOpen(id)
  }

  const saveEdit = (g: Participant) => {
    update((d) => {
      const x = d.participants.find((y) => y.id === g.id)!
      x.name = ef.name.trim()
      x.birth = ef.birth
      x.phone = ef.phone.trim()
      x.diet = ef.diet
      const mod = ef.mod || undefined
      if (mod !== x.modalityId) {
        x.customAmounts = recalcAmounts(x, ev, mod, x.extras ?? [])
        x.modalityId = mod
      }
    })
    setEditing(null)
    toast('Acompanhante atualizado.')
  }

  const remove = (g: Participant) => {
    if (!confirm(`Retirar ${g.name} dos teus acompanhantes?`)) return
    update((d) => {
      d.participants = d.participants.filter((y) => y.id !== g.id)
    })
    toast('Acompanhante retirado.')
  }

  const owed = active.reduce((s, g) => s + missing(g, ev), 0)

  return (
    <div className="card stack">
      <div className="row between">
        <h3>Acompanhantes</h3>
        <span className="badge">
          {active.length}/{MAX_GUESTS}
        </span>
      </div>
      <p className="muted small">
        Leva quem quiseres (até {MAX_GUESTS} pessoas). Não precisam de conta: ficam associados a ti e és tu que pagas as prestações de cada um ao promotor, separadas das
        tuas. Os acompanhantes não votam nem podem ser votados nos prémios.
      </p>
      {active.length > 0 && owed > 0.001 && (
        <div className="alert alert-info small">
          Falta pagar {eur(owed)} pelos teus acompanhantes (para além das tuas prestações).
        </div>
      )}

      {all.length > 0 && (
        <div className="list">
          {all.map((g) => {
            const cancelled = isCancelled(g)
            const st = guestStatus(g, ev)
            const isOpen = open === g.id
            return (
              <div key={g.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, opacity: cancelled ? 0.65 : 1 }}>
                <div className="row" style={{ flexWrap: 'nowrap', cursor: 'pointer' }} onClick={() => setOpen(isOpen ? null : g.id)}>
                  <div className="grow">
                    <div className="t">{g.name}</div>
                    <div className="s">
                      {modalityName(ev, g)} · {eur(totalDue(g, ev))}
                      {g.enteredAt ? ' · ✓ já entrou' : ''}
                    </div>
                  </div>
                  {cancelled ? <StatusPill s="overdue" label="Cancelado" /> : <StatusPill s={st.s} label={st.label} />}
                  <span className="chev">{isOpen ? '▾' : '›'}</span>
                </div>

                {isOpen && !cancelled && editing !== g.id && (
                  <div className="stack">
                    <GuestInstallments g={g} ev={ev} />
                    <p className="small muted">
                      Pagas as prestações de {g.name.split(' ')[0]} ao promotor, como as tuas. Pago até agora: {eur(totalPaid(g))} de {eur(totalDue(g, ev))}.
                    </p>
                    {g.enteredAt ? null : fullyPaid(g, ev) ? (
                      <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
                        <QR value={g.qr} size={180} />
                        <p className="small muted">
                          QR de entrada de {g.name.split(' ')[0]}. Envia-lhe uma captura deste ecrã: mostra-o à entrada com o documento de identificação. Só funciona uma vez.
                        </p>
                      </div>
                    ) : (
                      <p className="small muted">🔒 O QR de entrada de {g.name.split(' ')[0]} aparece aqui quando estiverem todas as prestações pagas.</p>
                    )}
                    {!g.enteredAt && !past && (
                      <div className="row">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setEf({ name: g.name, birth: g.birth, phone: g.phone ?? '', diet: g.diet, mod: g.modalityId ?? '', consent: true })
                            setEditing(g.id)
                          }}
                        >
                          Editar
                        </button>
                        {g.payments.length === 0 ? (
                          <button className="btn btn-danger btn-sm" onClick={() => remove(g)}>
                            Retirar
                          </button>
                        ) : (
                          <span className="small muted">Já tem pagamentos: para o cancelar, fala com o promotor.</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {editing === g.id && (
                  <div className="stack">
                    <GuestFields ev={ev} f={ef} setF={setEf} isNew={false} />
                    {(ef.mod || '') !== (g.modalityId ?? '') && (
                      <div className="alert alert-info small">Novo total: {eur(personPrice(ev, ef.mod || undefined, g.extras))}. As prestações em falta são recalculadas.</div>
                    )}
                    <div className="row">
                      <button className="btn btn-gold btn-sm" disabled={!valid(ef, false)} onClick={() => saveEdit(g)}>
                        Guardar
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {adding ? (
        <div className="stack" style={{ borderTop: '1px solid var(--line, rgba(255,255,255,0.1))', paddingTop: 14 }}>
          <b>Novo acompanhante</b>
          <GuestFields ev={ev} f={f} setF={setF} isNew />
          <div className="alert alert-info small">
            {f.name.trim().split(' ')[0] || 'O acompanhante'} paga {eur(personPrice(ev, f.mod || undefined, []))} em {ev.installments.length} prestações, que tu entregas ao
            promotor.
          </div>
          <div className="row">
            <button className="btn btn-gold btn-sm" disabled={!valid(f, true)} onClick={add}>
              Adicionar acompanhante
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => (setAdding(false), setF(blank()))}>
              Cancelar
            </button>
          </div>
        </div>
      ) : mayAdd ? (
        <button className="btn btn-gold btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setAdding(true)}>
          + Adicionar acompanhante
        </button>
      ) : (
        !past &&
        canHost(host) && (
          <p className="small muted">{full ? 'O evento está lotado: já não dá para adicionar acompanhantes.' : `Já tens ${MAX_GUESTS} acompanhantes, que é o máximo.`}</p>
        )
      )}
    </div>
  )
}

// ---------- Gestão: totais por modalidade e acompanhantes ----------

/** Totais de pessoas por modalidade (alunos + acompanhantes) e lista de quem leva acompanhantes. */
export function GuestsTotals({ events, showEvent }: { events: LDEvent[]; showEvent?: boolean }) {
  const db = useDB()
  const evById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events])
  const ps = useMemo(() => db.participants.filter((p) => evById.has(p.eventId) && !isCancelled(p)), [db.participants, evById])
  const guests = ps.filter(isGuest)

  // Agrupa por nome da modalidade (vários eventos podem ter "Só jantar")
  const byMod = useMemo(() => {
    const m = new Map<string, { students: number; guests: number; paid: number }>()
    const names = [BASE_MODALITY, ...new Set(events.flatMap((e) => (e.modalities ?? []).map((x) => x.name)))]
    names.forEach((n) => m.set(n, { students: 0, guests: 0, paid: 0 }))
    ps.forEach((p) => {
      const ev = evById.get(p.eventId)!
      const r = m.get(modalityName(ev, p))!
      if (isGuest(p)) r.guests++
      else r.students++
      if (fullyPaid(p, ev)) r.paid++
    })
    return [...m.entries()]
  }, [ps, events, evById])

  const hosts = useMemo(() => {
    const m = new Map<string, Participant[]>()
    guests.forEach((g) => m.set(g.hostId!, [...(m.get(g.hostId!) ?? []), g]))
    return [...m.entries()]
      .map(([id, gs]) => ({ host: db.participants.find((x) => x.id === id), gs }))
      .sort((a, b) => b.gs.length - a.gs.length || (a.host?.name ?? '').localeCompare(b.host?.name ?? '', 'pt'))
  }, [guests, db.participants])

  const doExport = () => {
    exportCSV('acompanhantes', [
      ['Acompanhante', 'Nascimento', 'Telemóvel', 'Modalidade', 'Alimentação', 'Acompanhante de', 'Telemóvel do aluno', 'Evento', 'Mesa', 'Total', 'Pago', 'Em falta', 'Entrou'],
      ...hosts.flatMap(({ host, gs }) =>
        gs.map((g) => {
          const ev = evById.get(g.eventId)!
          return [
            g.name, g.birth, g.phone, modalityName(ev, g), g.diet, host?.name ?? '', host?.phone ?? '', ev.name, ev.tables.find((t) => t.id === g.tableId)?.name ?? '',
            totalDue(g, ev).toFixed(2).replace('.', ','), totalPaid(g).toFixed(2).replace('.', ','), missing(g, ev).toFixed(2).replace('.', ','), g.enteredAt ? 'Sim' : '',
          ]
        }),
      ),
    ])
  }

  const total = ps.length
  return (
    <div className="stack">
      <div className="kpis">
        <Kpi hl k="Total de pessoas" v={total} />
        <Kpi k="Alunos inscritos" v={total - guests.length} />
        <Kpi k={`Acompanhantes · levados por ${hosts.length} alunos`} v={guests.length} />
        {byMod.map(([name, r]) => (
          <Kpi key={name} k={name} v={r.students + r.guests} />
        ))}
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Modalidade</th>
              <th className="num">Alunos</th>
              <th className="num">Acompanhantes</th>
              <th className="num">Total</th>
              <th className="num">Com tudo pago</th>
            </tr>
          </thead>
          <tbody>
            {byMod.map(([name, r]) => (
              <tr key={name}>
                <td>
                  <b>{name}</b>
                </td>
                <td className="num">{r.students}</td>
                <td className="num">{r.guests}</td>
                <td className="num">
                  <b>{r.students + r.guests}</b>
                </td>
                <td className="num">{r.paid}</td>
              </tr>
            ))}
            <tr>
              <td>
                <b>Total</b>
              </td>
              <td className="num">{total - guests.length}</td>
              <td className="num">{guests.length}</td>
              <td className="num">
                <b>{total}</b>
              </td>
              <td className="num">{byMod.reduce((s, [, r]) => s + r.paid, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="row between">
        <h3>Quem leva acompanhantes</h3>
        <button className="btn btn-ghost btn-sm" onClick={doExport} disabled={!guests.length}>
          ⬇ Exportar para Excel
        </button>
      </div>
      <div className="list">
        {hosts.map(({ host, gs }) => {
          const ev = evById.get(gs[0].eventId)!
          const owed = gs.reduce((s, g) => s + missing(g, ev), 0)
          return (
            <div key={host?.id ?? gs[0].id} className="list-item" style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <div className="t">
                  {host?.name ?? '—'} <span className="muted small">· {gs.length} acompanhante(s)</span>
                </div>
                <div className="s">
                  {host?.turma ? `${host.turma} · ` : ''}
                  {host?.phone ?? ''}
                  {showEvent ? ` · ${ev.name}` : ''}
                </div>
                <div className="pills" style={{ marginTop: 6 }}>
                  {gs.map((g) => {
                    const st = guestStatus(g, ev)
                    return <StatusPill key={g.id} s={st.s} label={`${g.name} · ${modalityName(ev, g)}${st.s === 'paid' ? ' ✓' : ''}`} />
                  })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {owed > 0.001 ? <b>{eur(owed)}</b> : <span className="gold">Tudo pago</span>}
                {owed > 0.001 && <div className="s">em falta</div>}
              </div>
            </div>
          )
        })}
        {hosts.length === 0 && <div className="empty">Ainda nenhum aluno adicionou acompanhantes.</div>}
      </div>
      <p className="small muted">
        Os acompanhantes são adicionados pelos alunos na área deles (máx. {MAX_GUESTS} por aluno) e aparecem também na lista de inscritos, nas mesas e na entrada. Recebe os
        pagamentos deles na lista de inscritos (procura pelo nome do aluno).
      </p>
    </div>
  )
}
