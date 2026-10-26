import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EventForm } from '../../components/EventForm'
import { Registrations } from '../../components/Registrations'
import { Kpi, Modal, Tabs, newPassword, toast } from '../../components/ui'
import { cashIn, dateLong, dateShort, eur, eventPrice, eventStats, eventWhen, isCancelled, refundPending, refunded, sellersLabel } from '../../data/logic'
import { uid } from '../../data/seed'
import { API_MODE, hasDemoData, importDemoData, removeDemoData, update, useDB, useSession } from '../../data/store'
import { CATEGORIES, CATEGORY_LABEL, EXPENSE_CATEGORIES, PARTNER_TYPES, type Category, type DB, type Expense, type Partner, type PartnerType, type Venue } from '../../data/types'

type Tab = 'painel' | 'eventos' | 'inscricoes' | 'cancelamentos' | 'contas' | 'quintas' | 'parceiros' | 'despesas' | 'equipa'

function CategoryChips({ value, onChange, db }: { value: '' | Category; onChange: (c: '' | Category) => void; db: DB }) {
  const active = db.events.filter((e) => !e.archived)
  return (
    <div className="chips" style={{ marginBottom: 16 }}>
      <button className={`chip ${value === '' ? 'on' : ''}`} onClick={() => onChange('')}>
        Todas <span className="count">{active.length}</span>
      </button>
      {CATEGORIES.map((c) => (
        <button key={c} className={`chip ${value === c ? 'on' : ''}`} onClick={() => onChange(c)}>
          {CATEGORY_LABEL[c]} <span className="count">{active.filter((e) => e.category === c).length}</span>
        </button>
      ))}
    </div>
  )
}

export default function AdminHome() {
  const db = useDB()
  const { user } = useSession()
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>(() => (sessionStorage.getItem('ld-admin-tab') as Tab) || 'painel')
  const [cat, setCat] = useState<'' | Category>('')
  const go = (t: Tab) => {
    setTab(t)
    try {
      sessionStorage.setItem('ld-admin-tab', t)
    } catch {}
  }

  const events = useMemo(() => db.events.filter((e) => !e.archived && (!cat || e.category === cat)).sort((a, b) => a.date.localeCompare(b.date)), [db.events, cat])
  const stats = useMemo(() => new Map(events.map((e) => [e.id, eventStats(e, db)])), [events, db])
  const sum = (k: keyof ReturnType<typeof eventStats>) => [...stats.values()].reduce((s, x) => s + (x[k] as number), 0)
  const expensesTotal = db.expenses.reduce((s, x) => s + x.amount, 0)

  return (
    <div>
      <h1 className="page-title">Administração</h1>
      <p className="muted">Vês todos os eventos e inscrições, e podes editar o que for preciso.</p>
      <Tabs
        value={tab}
        onChange={go}
        tabs={[
          { id: 'painel', label: 'Painel' },
          { id: 'eventos', label: 'Eventos e códigos' },
          { id: 'inscricoes', label: 'Todas as inscrições' },
          { id: 'cancelamentos', label: 'Cancelamentos', count: db.participants.filter(isCancelled).length },
          { id: 'contas', label: 'Contas' },
          { id: 'quintas', label: 'Quintas' },
          { id: 'parceiros', label: 'Parceiros' },
          { id: 'despesas', label: 'Despesas gerais' },
          { id: 'equipa', label: 'Equipa e acessos' },
        ]}
      />

      {tab === 'painel' && (
        <>
          <CategoryChips value={cat} onChange={setCat} db={db} />
          <div className="kpis">
            <Kpi hl k="Receita prevista" v={eur(sum('expected'))} />
            <Kpi k="Já recebido" v={eur(sum('received'))} />
            <Kpi k="Ainda por receber" v={eur(sum('toReceive'))} />
            <Kpi bad k={`Em atraso · ${sum('overdueCount')} pessoas`} v={eur(sum('overdueAmount'))} />
            <Kpi k="Comissões a pagar" v={eur(sum('commissionToPay'))} />
            <Kpi k="Comissões que ficam na empresa" v={eur(sum('commissionKept'))} />
            <Kpi k={`Inscritos (${sum('offers')} ofertas)`} v={sum('paying') + sum('offers')} />
            <Kpi bad={sum('refundsPending') > 0} k={`Cancelamentos · ${eur(sum('refundsPending'))} por devolver`} v={[...stats.values()].reduce((a, x) => a + x.cancelled.length, 0)} />
            <Kpi k="Eventos" v={events.length} />
          </div>
          <h3 style={{ margin: '28px 0 12px' }}>Eventos</h3>
          <div className="list">
            {events.map((e) => {
              const s = stats.get(e.id)!
              return (
                <div key={e.id} className="list-item click" onClick={() => nav(`evento/${e.id}`)}>
                  <div className="grow">
                    <div className="t">{e.name}</div>
                    <div className="s">
                      {CATEGORY_LABEL[e.category]} · {dateLong(e.date)} · {s.paying} pagantes + {s.offers} ofertas · {sellersLabel(e, db.users)}
                    </div>
                    <div className="progress" style={{ marginTop: 8, maxWidth: 420 }}>
                      <div style={{ width: `${s.expected ? (s.received / s.expected) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <b>{eur(s.received)}</b>
                    <div className="s">de {eur(s.expected)}</div>
                    {s.overdueCount > 0 && <span className="pill overdue">{s.overdueCount} em atraso</span>}
                  </div>
                  <span className="chev">›</span>
                </div>
              )
            })}
            {events.length === 0 && <div className="empty">Sem eventos nesta categoria.</div>}
          </div>
        </>
      )}

      {tab === 'eventos' && <EventsTab />}

      {tab === 'inscricoes' && user && <AllRegistrations />}

      {tab === 'contas' && (
        <>
          <CategoryChips value={cat} onChange={setCat} db={db} />
          <div className="kpis">
            <Kpi hl k="Lucro previsto" v={eur(sum('margin') - expensesTotal)} />
            <Kpi k="Receita prevista" v={eur(sum('expected'))} />
            <Kpi k="Quintas" v={eur(sum('venueCost'))} />
            <Kpi k="Parceiros" v={eur(sum('partnersCost'))} />
            <Kpi k="Comissões a pagar" v={eur(sum('commissionToPay'))} />
            <Kpi k="Despesas gerais" v={eur(expensesTotal)} />
          </div>
          <p className="small muted" style={{ margin: '14px 0' }}>
            Lucro = receita prevista − quintas − parceiros − comissões a pagar − despesas gerais. As comissões dos sócios não contam como custo.
          </p>
          {[...stats.values()].some((s) => s.belowMin || s.noVenue) && (
            <div className="alert alert-warn" style={{ marginBottom: 14 }}>
              {[...stats.values()].filter((s) => s.noVenue).length > 0 && `${[...stats.values()].filter((s) => s.noVenue).length} evento(s) com a quinta por definir. `}
              {[...stats.values()].filter((s) => s.belowMin).length > 0 && `${[...stats.values()].filter((s) => s.belowMin).length} evento(s) abaixo do mínimo da quinta.`}
            </div>
          )}
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th className="num">Receita</th>
                  <th className="num">Quinta</th>
                  <th className="num">Parceiros</th>
                  <th className="num">Comissões</th>
                  <th className="num">Margem</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const s = stats.get(e.id)!
                  return (
                    <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => nav(`evento/${e.id}?tab=financas`)}>
                      <td>
                        <b>{e.name}</b>
                        <div className="small muted">
                          {dateLong(e.date)} · {e.location} {s.belowMin && <span className="pill overdue">abaixo do mínimo</span>} {s.noVenue && <span className="pill partial">quinta por definir</span>}
                        </div>
                      </td>
                      <td className="num">{eur(s.expected)}</td>
                      <td className="num">{eur(s.venueCost)}</td>
                      <td className="num">{eur(s.partnersCost)}</td>
                      <td className="num">{eur(s.commissionToPay)}</td>
                      <td className="num" style={{ color: s.margin < 0 ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>
                        {eur(s.margin)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'quintas' && <VenuesTab />}
      {tab === 'parceiros' && <PartnersTab />}
      {tab === 'despesas' && <ExpensesTab />}
      {tab === 'cancelamentos' && <AllCancellations />}
      {tab === 'equipa' && <TeamTab />}
    </div>
  )
}

function AllRegistrations() {
  const db = useDB()
  const { user } = useSession()
  const [evId, setEvId] = useState('')
  const ps = useMemo(() => {
    const active = new Set(db.events.filter((e) => !e.archived).map((e) => e.id))
    return db.participants.filter((p) => (evId ? p.eventId === evId : active.has(p.eventId)))
  }, [db.participants, db.events, evId])
  return (
    <>
      <div className="field" style={{ maxWidth: 520, marginBottom: 14 }}>
        <label>Evento</label>
        <select className="input" value={evId} onChange={(e) => setEvId(e.target.value)}>
          <option value="">Todos os eventos</option>
          {db.events
            .filter((e) => !e.archived)
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
        </select>
      </div>
      <Registrations participants={ps} user={user!} showEvent={!evId} exportName="inscricoes-lastdance" />
    </>
  )
}

function EventsTab() {
  const db = useDB()
  const nav = useNavigate()
  const [arch, setArch] = useState(false)
  const [cat, setCat] = useState<'' | Category>('')
  const list = db.events.filter((e) => e.archived === arch && (!cat || e.category === cat)).sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div className="split">
      <div className="card">
        <h3>Criar evento e código</h3>
        <p className="small muted" style={{ marginBottom: 16 }}>
          O código é o que entregas à comissão de finalistas para divulgar.
        </p>
        <EventForm onDone={(id) => nav(`evento/${id}`)} />
      </div>
      <div>
        <div className="row between" style={{ marginBottom: 12 }}>
          <h3>Os teus eventos</h3>
          <div className="seg">
            <button className={!arch ? 'on' : ''} onClick={() => setArch(false)}>
              Em curso {db.events.filter((e) => !e.archived).length}
            </button>
            <button className={arch ? 'on' : ''} onClick={() => setArch(true)}>
              Arquivados {db.events.filter((e) => e.archived).length}
            </button>
          </div>
        </div>
        <CategoryChips value={cat} onChange={setCat} db={db} />
        <div className="list">
          {list.map((e) => (
            <div key={e.id} className="list-item click" onClick={() => nav(`evento/${e.id}`)}>
              <div className="grow">
                <div className="t">{e.name}</div>
                <div className="s">
                  {CATEGORY_LABEL[e.category]} · {eventWhen(e)} · {e.location}
                </div>
                <div className="row small" style={{ gap: 8, marginTop: 6 }}>
                  <span className="badge" style={{ padding: '2px 10px' }}>
                    {e.code}
                  </span>
                  <span className="muted">
                    {eur(eventPrice(e))} em {e.installments.length}x · comissão {eur(e.commission)}
                  </span>
                </div>
              </div>
              <span className="chev">›</span>
            </div>
          ))}
          {list.length === 0 && <div className="empty">Nenhum evento.</div>}
        </div>
      </div>
    </div>
  )
}

function VenuesTab() {
  const db = useDB()
  const [edit, setEdit] = useState<Venue | null>(null)
  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <h3>Quintas e espaços</h3>
        <button className="btn btn-gold btn-sm" onClick={() => setEdit({ id: '', name: '', costPerPerson: 40, minimum: 100, capacity: 300 })}>
          + Adicionar quinta
        </button>
      </div>
      <p className="small muted" style={{ marginBottom: 14 }}>
        Cada quinta serve qualquer categoria. O custo de um evento é lugares × custo por pessoa, com o mínimo da quinta.
      </p>
      <div className="list">
        {db.venues.map((v) => (
          <div key={v.id} className="list-item click" onClick={() => setEdit(v)}>
            <div className="grow">
              <div className="t">{v.name}</div>
              <div className="s">
                {eur(v.costPerPerson)} por pessoa · mínimo {v.minimum} · capacidade {v.capacity}
              </div>
            </div>
            <span className="small muted">{db.events.filter((e) => e.venueId === v.id).length} evento(s)</span>
            <span className="chev">›</span>
          </div>
        ))}
      </div>
      {edit && (
        <Modal onClose={() => setEdit(null)}>
          <h3>{edit.id ? 'Editar quinta' : 'Nova quinta'}</h3>
          <form
            className="stack"
            style={{ marginTop: 16 }}
            onSubmit={(e) => {
              e.preventDefault()
              update((d) => {
                if (edit.id) d.venues = d.venues.map((v) => (v.id === edit.id ? edit : v))
                else d.venues.push({ ...edit, id: 'v' + uid() })
              })
              setEdit(null)
              toast('Quinta guardada.')
            }}
          >
            <div className="field">
              <label>Nome</label>
              <input className="input" required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </div>
            <div className="grid-3">
              <div className="field">
                <label>Custo por pessoa (€)</label>
                <input className="input" type="number" step="0.5" value={edit.costPerPerson} onChange={(e) => setEdit({ ...edit, costPerPerson: +e.target.value })} />
              </div>
              <div className="field">
                <label>Mínimo de pessoas</label>
                <input className="input" type="number" value={edit.minimum} onChange={(e) => setEdit({ ...edit, minimum: +e.target.value })} />
              </div>
              <div className="field">
                <label>Capacidade</label>
                <input className="input" type="number" value={edit.capacity} onChange={(e) => setEdit({ ...edit, capacity: +e.target.value })} />
              </div>
            </div>
            <div className="row">
              <button className="btn btn-gold">Guardar</button>
              {edit.id && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    if (db.events.some((e) => e.venueId === edit.id)) return toast('Esta quinta tem eventos associados.')
                    update((d) => {
                      d.venues = d.venues.filter((v) => v.id !== edit.id)
                    })
                    setEdit(null)
                  }}
                >
                  Apagar
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

function PartnersTab() {
  const db = useDB()
  const [edit, setEdit] = useState<Partner | null>(null)
  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <h3>Parceiros</h3>
        <button className="btn btn-gold btn-sm" onClick={() => setEdit({ id: '', type: 'DJ', name: '', baseCost: 400 })}>
          + Adicionar parceiro
        </button>
      </div>
      <p className="small muted" style={{ marginBottom: 14 }}>
        Só a administração vê os parceiros. Em cada evento escolhes quem está destacado, no separador «Finanças» do evento ou ao criá-lo.
      </p>
      {PARTNER_TYPES.map((t) => (
        <div key={t} style={{ marginBottom: 18 }}>
          <div className="label" style={{ marginBottom: 6 }}>
            {t}s
          </div>
          <div className="list">
            {db.partners
              .filter((p) => p.type === t)
              .map((p) => (
                <div key={p.id} className="list-item click" onClick={() => setEdit(p)}>
                  <div className="grow">
                    <div className="t">{p.name}</div>
                    <div className="s">{eur(p.baseCost)} habitual</div>
                  </div>
                  <span className="small muted">{db.events.filter((e) => e.partners.some((x) => x.partnerId === p.id)).length} evento(s)</span>
                  <span className="chev">›</span>
                </div>
              ))}
          </div>
        </div>
      ))}
      {edit && (
        <Modal onClose={() => setEdit(null)}>
          <h3>{edit.id ? 'Editar parceiro' : 'Novo parceiro'}</h3>
          <form
            className="stack"
            style={{ marginTop: 16 }}
            onSubmit={(e) => {
              e.preventDefault()
              update((d) => {
                if (edit.id) d.partners = d.partners.map((v) => (v.id === edit.id ? edit : v))
                else d.partners.push({ ...edit, id: 'pa' + uid() })
              })
              setEdit(null)
              toast('Parceiro guardado.')
            }}
          >
            <div className="grid-2">
              <div className="field">
                <label>Tipo</label>
                <select className="input" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as PartnerType })}>
                  {PARTNER_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Valor habitual (€)</label>
                <input className="input" type="number" value={edit.baseCost} onChange={(e) => setEdit({ ...edit, baseCost: +e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Nome</label>
              <input className="input" required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </div>
            <div className="row">
              <button className="btn btn-gold">Guardar</button>
              {edit.id && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    update((d) => {
                      d.partners = d.partners.filter((v) => v.id !== edit.id)
                      d.events.forEach((ev) => (ev.partners = ev.partners.filter((x) => x.partnerId !== edit.id)))
                    })
                    setEdit(null)
                  }}
                >
                  Apagar
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

function ExpensesTab() {
  const db = useDB()
  const partnersUsers = db.users.filter((u) => u.isPartner)
  const blank = (): Expense => ({ id: '', description: '', category: 'Material', amount: 0, date: new Date().toISOString().slice(0, 10), paidBy: 'empresa', reimbursed: true })
  const [f, setF] = useState<Expense>(blank)
  const who = (id: string) => (id === 'empresa' ? 'Empresa' : db.users.find((u) => u.id === id)?.name ?? '—')
  const total = db.expenses.reduce((s, x) => s + x.amount, 0)
  const toReimburse = db.expenses.filter((x) => x.paidBy !== 'empresa' && !x.reimbursed).reduce((s, x) => s + x.amount, 0)
  const sorted = [...db.expenses].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <>
      <div className="kpis">
        <Kpi hl k="Despesas gerais" v={eur(total)} />
        <Kpi bad={toReimburse > 0} k="Por reembolsar a sócios" v={eur(toReimburse)} />
        {EXPENSE_CATEGORIES.map((c) => {
          const v = db.expenses.filter((x) => x.category === c).reduce((s, x) => s + x.amount, 0)
          return v ? <Kpi key={c} k={c} v={eur(v)} /> : null
        })}
      </div>
      <div className="cards-2" style={{ alignItems: 'start', marginTop: 22 }}>
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault()
            const x = { ...f, reimbursed: f.paidBy === 'empresa' ? true : f.reimbursed }
            update((d) => {
              if (f.id) d.expenses = d.expenses.map((y) => (y.id === f.id ? x : y))
              else d.expenses.push({ ...x, id: 'x' + uid() })
            })
            setF(blank())
            toast('Despesa guardada.')
          }}
        >
          <h3>{f.id ? 'Editar despesa' : 'Nova despesa'}</h3>
          <p className="small muted">Coisas que a empresa vai comprando. Descontam ao lucro total (não a um evento em concreto).</p>
          <div className="field">
            <label>Descrição</label>
            <input className="input" required value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Categoria</label>
              <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Valor (€)</label>
              <input className="input" type="number" step="0.01" required value={f.amount || ''} onChange={(e) => setF({ ...f, amount: +e.target.value })} />
            </div>
            <div className="field">
              <label>Data</label>
              <input className="input" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
            </div>
            <div className="field">
              <label>Quem pagou</label>
              <select className="input" value={f.paidBy} onChange={(e) => setF({ ...f, paidBy: e.target.value, reimbursed: e.target.value === 'empresa' })}>
                <option value="empresa">Empresa</option>
                {partnersUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (do bolso)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="row">
            <button className="btn btn-gold">{f.id ? 'Guardar' : 'Adicionar despesa'}</button>
            {f.id && (
              <button type="button" className="btn btn-ghost" onClick={() => setF(blank())}>
                Cancelar
              </button>
            )}
          </div>
        </form>
        <div className="list">
          {sorted.map((x) => (
            <div key={x.id} className="list-item">
              <div className="grow">
                <div className="t">{x.description}</div>
                <div className="s">
                  {dateLong(x.date)} · {x.category} · pago por {who(x.paidBy)}
                  {x.paidBy !== 'empresa' && !x.reimbursed && <span className="pill overdue" style={{ marginLeft: 6 }}>por reembolsar</span>}
                </div>
              </div>
              <b>{eur(x.amount)}</b>
              <div className="row" style={{ gap: 4 }}>
                {x.paidBy !== 'empresa' && !x.reimbursed && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      update((d) => {
                        d.expenses.find((y) => y.id === x.id)!.reimbursed = true
                      })
                    }
                  >
                    Reembolsado
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setF(x)}>
                  Editar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    confirm('Apagar esta despesa?') &&
                    update((d) => {
                      d.expenses = d.expenses.filter((y) => y.id !== x.id)
                    })
                  }
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function TeamTab() {
  const db = useDB()
  const [nu, setNu] = useState({ name: '', email: '', role: 'admin' as 'admin' | 'comercial', isPartner: true })
  const [ns, setNs] = useState({ name: '', email: '' })
  const [pass, setPass] = useState<{ who: string; p: string } | null>(null)
  const team = db.users.filter((u) => u.role === 'admin' || u.role === 'comercial')
  const staff = db.users.filter((u) => u.role === 'staff')
  const resetPass = (id: string, name: string) => {
    const p = newPassword()
    update((d) => {
      d.users.find((u) => u.id === id)!.password = p
    })
    setPass({ who: name, p })
  }
  const emailTaken = (e: string) => db.users.some((u) => u.email.toLowerCase() === e.toLowerCase())

  return (
    <div className="stack">
      {API_MODE && (
        <div className="card stack">
          <h3>Dados de demonstração</h3>
          <p className="small muted">
            Para testares a plataforma com eventos e alunos fictícios. Ficam todos marcados como demonstração e podes apagá-los de uma vez antes de começar a usar a sério. As contas de
            demonstração usam a palavra-passe demo1234 (por exemplo admin@lastdance.pt).
          </p>
          <div className="row">
            {!hasDemoData(db) ? (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => confirm('Carregar cerca de 1200 inscrições fictícias para testar?') && (importDemoData(), toast('A enviar dados de demonstração…'))}
              >
                Carregar dados de demonstração
              </button>
            ) : (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => confirm('Apagar todos os dados de demonstração? Os teus dados reais não são tocados.') && (removeDemoData(), toast('Dados de demonstração apagados.'))}
              >
                Apagar dados de demonstração
              </button>
            )}
          </div>
        </div>
      )}
      <p className="muted">Cada pessoa entra com o seu email e palavra-passe. Os sócios não têm comissão individual: a parte deles nos eventos fica para o lucro da empresa.</p>
      {pass && (
        <div className="alert alert-info">
          Nova palavra-passe de {pass.who}: <b>{pass.p}</b>
        </div>
      )}
      <div className="list">
        {team.map((u) => (
          <div key={u.id} className="list-item">
            <div className="grow">
              <div className="t">{u.name}</div>
              <div className="s">{u.email}</div>
            </div>
            <label className="check small">
              <input
                type="checkbox"
                checked={!!u.isPartner}
                onChange={(e) =>
                  update((d) => {
                    d.users.find((x) => x.id === u.id)!.isPartner = e.target.checked
                  })
                }
              />
              Sócio (sem comissão)
            </label>
            <label className="check small">
              <input
                type="checkbox"
                checked={u.role === 'admin'}
                onChange={(e) =>
                  update((d) => {
                    d.users.find((x) => x.id === u.id)!.role = e.target.checked ? 'admin' : 'comercial'
                  })
                }
              />
              Acesso de administrador
            </label>
            <button className="btn btn-ghost btn-sm" onClick={() => resetPass(u.id, u.name)}>
              Repor palavra-passe
            </button>
          </div>
        ))}
      </div>
      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault()
          if (emailTaken(nu.email)) return toast('Já existe uma conta com esse email.')
          const p = newPassword()
          update((d) => {
            d.users.push({ id: 'u' + uid(), name: nu.name, email: nu.email, password: p, role: nu.role, isPartner: nu.isPartner })
          })
          setPass({ who: nu.name, p })
          setNu({ name: '', email: '', role: 'admin', isPartner: true })
          toast('Acesso criado. Envia a palavra-passe à pessoa.')
        }}
      >
        <h3>Criar acesso</h3>
        <div className="grid-2">
          <div className="field">
            <label>Nome</label>
            <input className="input" required value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" required value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <label className="check">
            <input type="checkbox" checked={nu.isPartner} onChange={(e) => setNu({ ...nu, isPartner: e.target.checked })} /> Sócio (sem comissão)
          </label>
          <label className="check">
            <input type="checkbox" checked={nu.role === 'admin'} onChange={(e) => setNu({ ...nu, role: e.target.checked ? 'admin' : 'comercial' })} /> Acesso de administrador
          </label>
        </div>
        <button className="btn btn-gold" style={{ alignSelf: 'flex-start' }}>
          Criar acesso
        </button>
      </form>

      <h3 style={{ marginTop: 20 }}>Staff (validação de entradas)</h3>
      <p className="small muted">O staff só vê a página de entradas: lê o QR, confere o Cartão de Cidadão e regista a entrada. Podes limitar cada pessoa a alguns eventos.</p>
      <div className="list">
        {staff.map((u) => (
          <div key={u.id} className="list-item" style={{ flexWrap: 'wrap' }}>
            <div className="grow">
              <div className="t">{u.name}</div>
              <div className="s">{u.email}</div>
            </div>
            <details style={{ minWidth: 220 }}>
              <summary className="small" style={{ cursor: 'pointer' }}>
                {u.staffEventIds?.length ? `${u.staffEventIds.length} evento(s)` : 'Todos os eventos'}
              </summary>
              <div className="stack" style={{ gap: 4, marginTop: 8 }}>
                {db.events
                  .filter((e) => !e.archived)
                  .map((e) => (
                    <label key={e.id} className="check small">
                      <input
                        type="checkbox"
                        checked={!!u.staffEventIds?.includes(e.id)}
                        onChange={(ev) =>
                          update((d) => {
                            const x = d.users.find((y) => y.id === u.id)!
                            const cur = x.staffEventIds ?? []
                            x.staffEventIds = ev.target.checked ? [...cur, e.id] : cur.filter((y) => y !== e.id)
                          })
                        }
                      />
                      {e.name}
                    </label>
                  ))}
                <span className="small muted">Nenhum marcado = acesso a todos.</span>
              </div>
            </details>
            <button className="btn btn-ghost btn-sm" onClick={() => resetPass(u.id, u.name)}>
              Repor palavra-passe
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() =>
                confirm(`Remover o acesso de ${u.name}?`) &&
                update((d) => {
                  d.users = d.users.filter((x) => x.id !== u.id)
                })
              }
            >
              Remover
            </button>
          </div>
        ))}
      </div>
      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault()
          if (emailTaken(ns.email)) return toast('Já existe uma conta com esse email.')
          const p = newPassword()
          update((d) => {
            d.users.push({ id: 'u' + uid(), name: ns.name, email: ns.email, password: p, role: 'staff', staffEventIds: [] })
          })
          setPass({ who: ns.name, p })
          setNs({ name: '', email: '' })
          toast('Acesso de staff criado. Envia a palavra-passe à pessoa.')
        }}
      >
        <h3>Criar acesso de staff</h3>
        <div className="grid-2">
          <div className="field">
            <label>Nome</label>
            <input className="input" required value={ns.name} onChange={(e) => setNs({ ...ns, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" required value={ns.email} onChange={(e) => setNs({ ...ns, email: e.target.value })} />
          </div>
        </div>
        <button className="btn btn-gold" style={{ alignSelf: 'flex-start' }}>
          Criar acesso de staff
        </button>
      </form>
    </div>
  )
}

function AllCancellations() {
  const db = useDB()
  const nav = useNavigate()
  const list = db.participants.filter(isCancelled).sort((a, b) => (b.cancelledAt ?? '').localeCompare(a.cancelledAt ?? ''))
  const pending = list.reduce((s, p) => s + refundPending(p), 0)
  return (
    <div className="stack">
      <div className="kpis">
        <Kpi k="Cancelamentos" v={list.length} />
        <Kpi bad={pending > 0} k="Por devolver" v={eur(pending)} />
        <Kpi k="Já devolvido" v={eur(list.reduce((s, p) => s + refunded(p), 0))} />
        <Kpi hl k="Fica na empresa" v={eur(list.reduce((s, p) => s + Math.max(0, cashIn(p) + refunded(p) - (p.refundDue ?? 0)), 0))} />
      </div>
      <p className="small muted">Para registar uma devolução, abre o evento → separador «Cancelamentos». Os cancelamentos fazem-se na ficha de cada pessoa.</p>
      <div className="list">
        {list.map((p) => {
          const ev = db.events.find((e) => e.id === p.eventId)
          return (
            <div key={p.id} className="list-item click" onClick={() => ev && nav(`evento/${ev.id}?tab=cancelamentos`)}>
              <div className="grow">
                <div className="t">{p.name}</div>
                <div className="s">
                  {ev?.name} · cancelado a {dateShort(p.cancelledAt!)}
                  {p.cancelReason ? ` · ${p.cancelReason}` : ''} · pagou {eur(cashIn(p) + refunded(p))} · a devolver {eur(p.refundDue ?? 0)}
                </div>
              </div>
              {refundPending(p) > 0 ? <span className="pill overdue">falta {eur(refundPending(p))}</span> : <span className="pill paid">resolvido</span>}
              <span className="chev">›</span>
            </div>
          )
        })}
        {list.length === 0 && <div className="empty">Sem cancelamentos.</div>}
      </div>
    </div>
  )
}
