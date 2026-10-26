import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { EventForm } from '../../components/EventForm'
import { Registrations } from '../../components/Registrations'
import { Kpi, Modal, Tabs, newPassword, toast } from '../../components/ui'
import { eur, eventPrice, eventStats, eventWhen, userCommission, commissionShares } from '../../data/logic'
import { uid } from '../../data/seed'
import { update, useDB } from '../../data/store'
import { CATEGORY_LABEL, type User } from '../../data/types'
import { AwardsTab, CancellationsTab, FinanceTab, OverdueTab, ReceiptsTab, TablesTab } from './EventTabs'

type Tab = 'inscritos' | 'financas' | 'premios' | 'recebimentos' | 'atraso' | 'cancelamentos' | 'mesas'

export default function EventPage({ eventId, user }: { eventId?: string; user: User }) {
  const params = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const db = useDB()
  const id = eventId ?? params.id
  const ev = db.events.find((e) => e.id === id)
  const [tab, setTab] = useState<Tab>((sp.get('tab') as Tab) || 'inscritos')
  const [modal, setModal] = useState<null | 'edit' | 'team' | 'classes'>(null)
  const [pass, setPass] = useState<string | null>(null)

  if (!ev) return <div className="empty">Evento não encontrado.</div>
  const isAdmin = user.role === 'admin'
  const isCom = user.role === 'comercial'
  const isChief = user.role === 'promotor_chefe'
  const isProm = user.role === 'promotor_chefe' || user.role === 'promotor'
  if (isCom && !commissionShares(ev).some((s) => s.userId === user.id)) return <div className="empty">Não tens acesso a este evento.</div>

  const s = eventStats(ev, db)
  const promoters = db.users.filter((u) => u.eventId === ev.id)
  const chief = promoters.find((u) => u.role === 'promotor_chefe')
  const shares = commissionShares(ev)
    .map((sh) => {
      const u = db.users.find((x) => x.id === sh.userId)
      return `${u?.name} ${sh.pct}%${u?.isPartner ? ' (sócio, sem comissão)' : ''}`
    })
    .join(' / ')

  const tabs = [
    { id: 'inscritos' as const, label: 'Inscritos', count: s.ps.length },
    ...(isAdmin ? [{ id: 'financas' as const, label: 'Finanças' }, { id: 'premios' as const, label: 'Prémios' }] : []),
    ...(!isCom ? [{ id: 'recebimentos' as const, label: user.role === 'promotor' ? 'Os meus recebimentos' : 'Recebimentos' }] : []),
    ...(!isCom ? [{ id: 'atraso' as const, label: 'Em atraso', count: s.overdueCount, red: true }] : []),
    ...((isAdmin || isChief || isCom) && s.cancelled.length ? [{ id: 'cancelamentos' as const, label: 'Cancelamentos', count: s.cancelled.length }] : []),
    { id: 'mesas' as const, label: 'Mesas', count: ev.tables.length },
  ]

  const resetChiefPass = () => {
    if (!chief) return
    const p = newPassword()
    update((d) => {
      d.users.find((u) => u.id === chief.id)!.password = p
    })
    setPass(p)
  }

  return (
    <div>
      {!isProm && (
        <Link to="/gestao" className="small muted">
          ‹ Voltar aos eventos
        </Link>
      )}
      {isProm && (
        <>
          <h1 className="page-title">O teu evento</h1>
          <p className="muted" style={{ marginBottom: 16 }}>
            Controla quem já pagou, em que prestação vai cada pessoa e organiza as mesas do jantar.
          </p>
        </>
      )}
      <h2 className="page-title" style={{ marginTop: 10 }}>
        {ev.name} {ev.archived && <span className="pill missing">arquivado</span>}
      </h2>
      <p className="muted">
        {CATEGORY_LABEL[ev.category]} · {eventWhen(ev)} · {ev.location}
      </p>
      <p className="muted">
        {eur(eventPrice(ev))} em {ev.installments.length} prestações: {ev.installments.map((i) => eur(i.amount)).join(' + ')} · código <b className="gold">{ev.code}</b>
      </p>
      {(!!ev.modalities?.length || !!ev.extras?.length) && (
        <p className="muted small">
          {!!ev.modalities?.length && `Modalidades: ${ev.modalities.map((m) => `${m.name} ${eur(m.price)}`).join(' · ')}`}
          {!!ev.modalities?.length && !!ev.extras?.length && ' — '}
          {!!ev.extras?.length && `Extras: ${ev.extras.map((x) => `${x.name} +${eur(x.price)}`).join(' · ')}`}
        </p>
      )}
      {isChief && (
        <div className="row small" style={{ marginTop: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setModal('team')}>
            A minha equipa ({promoters.length - 1})
          </button>
        </div>
      )}
      <p className="muted">{ev.hasClasses ? `Turmas: ${ev.classes.join(', ')}` : 'Escola sem turmas'}</p>
      {isAdmin && (
        <>
          <div className="row small" style={{ marginTop: 10, gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal('classes')}>
              Editar turmas
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal('edit')}>
              Editar evento
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal('team')}>
              Equipa do promotor ({promoters.length})
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                update((d) => {
                  const e = d.events.find((x) => x.id === ev.id)!
                  e.archived = !e.archived
                })
                toast(ev.archived ? 'Evento reativado.' : 'Evento arquivado. O código deixa de aceitar inscrições.')
              }}
            >
              {ev.archived ? 'Reativar evento' : 'Arquivar evento'}
            </button>
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>
            Comerciais: {shares} · comissão de {eur(ev.commission)} por pessoa
          </p>
          <p className="small muted">
            Acesso do promotor: {chief ? chief.email : 'sem promotor chefe'}{' '}
            {chief && (
              <button className="link" onClick={resetChiefPass}>
                Repor palavra-passe
              </button>
            )}
          </p>
          {pass && (
            <div className="alert alert-info" style={{ marginTop: 8 }}>
              Nova palavra-passe do promotor: <b>{pass}</b>
            </div>
          )}
        </>
      )}
      {isCom && (
        <div className="alert alert-info small" style={{ marginTop: 12 }}>
          Modo de consulta: vês tudo o que o promotor vê, mas não podes alterar nada.
        </div>
      )}

      <div className="kpis" style={{ marginTop: 20 }}>
        <Kpi k="Inscritos" v={`${s.paying} + ${s.offers} ofertas`} />
        <Kpi hl k="Recebido em mão" v={eur(s.received)} />
        <Kpi k="Falta receber" v={eur(s.toReceive)} />
        <Kpi k="Já entraram" v={`${s.entered} de ${s.ps.length}`} />
        {s.cancelled.length > 0 && <Kpi k={`Cancelados · ${eur(s.refundsPending)} por devolver`} v={s.cancelled.length} />}
        {isAdmin && <Kpi k="Comissões a pagar" v={eur(s.commissionToPay)} />}
        {isAdmin && <Kpi k="Comissão que fica na empresa" v={eur(s.commissionKept)} />}
        {isCom && <Kpi hl k="A tua comissão prevista" v={eur(userCommission(ev, db, user.id))} />}
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'inscritos' && <Registrations participants={s.all} user={user} exportName={`inscritos-${ev.code}`} eventId={isCom ? undefined : ev.id} />}
      {tab === 'financas' && isAdmin && <FinanceTab ev={ev} />}
      {tab === 'premios' && isAdmin && <AwardsTab ev={ev} />}
      {tab === 'recebimentos' && <ReceiptsTab ev={ev} user={user} />}
      {tab === 'atraso' && <OverdueTab ev={ev} />}
      {tab === 'cancelamentos' && <CancellationsTab ev={ev} user={user} />}
      {tab === 'mesas' && <TablesTab ev={ev} readOnly={isCom} />}

      {modal === 'edit' && (
        <Modal wide onClose={() => setModal(null)}>
          <h3>Editar evento</h3>
          <div style={{ marginTop: 16 }}>
            <EventForm existing={ev} onDone={() => setModal(null)} />
          </div>
          <button
            className="btn btn-danger btn-sm"
            style={{ marginTop: 20 }}
            onClick={() => {
              if (!confirm(`Apagar o evento e as ${s.ps.length} inscrições? Esta ação não pode ser desfeita.`)) return
              update((d) => {
                d.events = d.events.filter((x) => x.id !== ev.id)
                d.participants = d.participants.filter((p) => p.eventId !== ev.id)
                d.users = d.users.filter((u) => u.eventId !== ev.id)
              })
              nav('/gestao')
            }}
          >
            Apagar evento
          </button>
        </Modal>
      )}
      {modal === 'classes' && <ClassesModal evId={ev.id} onClose={() => setModal(null)} />}
      {modal === 'team' && <PromoterTeamModal evId={ev.id} chief={isChief} onClose={() => setModal(null)} />}
    </div>
  )
}

function ClassesModal({ evId, onClose }: { evId: string; onClose: () => void }) {
  const db = useDB()
  const ev = db.events.find((e) => e.id === evId)!
  const [has, setHas] = useState(ev.hasClasses)
  const [text, setText] = useState(ev.classes.join(', '))
  return (
    <Modal onClose={onClose}>
      <h3>Turmas</h3>
      <div className="stack" style={{ marginTop: 16 }}>
        <div className="seg" style={{ alignSelf: 'flex-start' }}>
          <button className={has ? 'on' : ''} onClick={() => setHas(true)}>
            Com turmas
          </button>
          <button className={!has ? 'on' : ''} onClick={() => setHas(false)}>
            Sem turmas
          </button>
        </div>
        {has && <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} />}
        <button
          className="btn btn-gold"
          onClick={() => {
            update((d) => {
              const e = d.events.find((x) => x.id === evId)!
              e.hasClasses = has
              e.classes = has
                ? text
                    .split(/[,\n]/)
                    .map((x) => x.trim())
                    .filter(Boolean)
                : []
            })
            onClose()
          }}
        >
          Guardar
        </button>
      </div>
    </Modal>
  )
}

/** Equipa do promotor. A administração gere todos; o promotor chefe gere os promotores da sua equipa. */
export function PromoterTeamModal({ evId, chief, onClose }: { evId: string; chief?: boolean; onClose: () => void }) {
  const db = useDB()
  const team = db.users.filter((u) => u.eventId === evId)
  const [n, setN] = useState({ name: '', email: '', phone: '', chief: false })
  const [pass, setPass] = useState<string | null>(null)
  return (
    <Modal onClose={onClose}>
      <h3>{chief ? 'A minha equipa' : 'Equipa do promotor'}</h3>
      <p className="small muted">O promotor chefe vê todos os recebimentos do evento. Os promotores da equipa recebem pagamentos e veem só os seus.</p>
      {pass && (
        <div className="alert alert-info" style={{ marginTop: 10 }}>
          Nova palavra-passe: <b>{pass}</b>
        </div>
      )}
      <div className="list" style={{ marginTop: 14 }}>
        {team.map((u) => (
          <div key={u.id} className="list-item">
            <div className="grow">
              <div className="t">
                {u.name} {u.role === 'promotor_chefe' && <span className="pill offer">chefe</span>}
              </div>
              <div className="s">{u.email}</div>
              <input
                className="input"
                style={{ marginTop: 6, padding: '6px 10px', fontSize: '0.85rem', maxWidth: 220 }}
                placeholder="Telemóvel"
                type="tel"
                defaultValue={u.phone ?? ''}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v !== (u.phone ?? ''))
                    update((d) => {
                      d.users.find((x) => x.id === u.id)!.phone = v || undefined
                    })
                }}
              />
            </div>
            {(!chief || u.role === 'promotor') && (
            <>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const p = newPassword()
                update((d) => {
                  d.users.find((x) => x.id === u.id)!.password = p
                })
                setPass(p)
              }}
            >
              Repor
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() =>
                confirm(`Remover ${u.name}?`) &&
                update((d) => {
                  d.users = d.users.filter((x) => x.id !== u.id)
                })
              }
            >
              ×
            </button>
            </>
            )}
          </div>
        ))}
        {team.length === 0 && <div className="empty">Sem promotores.</div>}
      </div>
      <form
        className="stack"
        style={{ marginTop: 16 }}
        onSubmit={(e) => {
          e.preventDefault()
          if (db.users.some((u) => u.email.toLowerCase() === n.email.toLowerCase())) return toast('Já existe uma conta com esse email.')
          const pass = newPassword()
          update((d) => {
            d.users.push({ id: 'u' + uid(), name: n.name, email: n.email, phone: n.phone || undefined, password: pass, role: n.chief && !chief ? 'promotor_chefe' : 'promotor', eventId: evId })
          })
          setPass(pass)
          setN({ name: '', email: '', phone: '', chief: false })
          toast('Promotor adicionado.')
        }}
      >
        <div className="grid-2">
          <input className="input" placeholder="Nome" required value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} />
          <input className="input" placeholder="Email" type="email" required value={n.email} onChange={(e) => setN({ ...n, email: e.target.value })} />
          <input className="input" placeholder="Telemóvel (os alunos veem o do chefe)" type="tel" value={n.phone} onChange={(e) => setN({ ...n, phone: e.target.value })} />
        </div>
        {!chief && (
          <label className="check">
            <input type="checkbox" checked={n.chief} onChange={(e) => setN({ ...n, chief: e.target.checked })} /> Promotor chefe
          </label>
        )}
        <button className="btn btn-gold" style={{ alignSelf: 'flex-start' }}>
          Adicionar promotor
        </button>
      </form>
    </Modal>
  )
}
