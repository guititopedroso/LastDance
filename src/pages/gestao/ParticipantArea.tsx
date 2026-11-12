import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/icons'
import { ChoicesEditor, applyChoices } from '../../components/Registrations'
import { GuestsCard } from '../../components/Guests'
import { QR, StatusPill, toast } from '../../components/ui'
import {
  canHost,
  cashIn,
  dateLong,
  dateShort,
  dateTime,
  daysFromNow,
  eur,
  eventPast,
  eventWhen,
  fullyPaid,
  guestsOf,
  instAmount,
  instStatus,
  isCancelled,
  missing,
  ordinal,
  paidFor,
  plan,
  refundPending,
  refunded,
  totalDue,
  totalPaid,
} from '../../data/logic'
import { update, useDB } from '../../data/store'
import { DIETS, PTYPE_LONG, type Participant } from '../../data/types'

export default function ParticipantArea({ p }: { p: Participant }) {
  const db = useDB()
  const [sp] = useSearchParams()
  const [editing, setEditing] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [f, setF] = useState({ phone: p.phone, diet: p.diet, health: p.health ?? '' })
  const ev = db.events.find((e) => e.id === p.eventId)!
  const rows = plan(p, ev)
  const paidCount = rows.filter((r) => r.status === 'paid').length
  const next = ev.installments.map((inst, i) => ({ inst, i })).find(({ i }) => rows[i].status !== 'paid')
  const rolled = rows.some((r) => r.rolled)
  const table = ev.tables.find((t) => t.id === p.tableId)
  const mates = table ? db.participants.filter((x) => x.tableId === table.id && x.id !== p.id && !isCancelled(x)) : []
  const allPaid = fullyPaid(p, ev)
  const cancelled = isCancelled(p)
  const past = eventPast(ev)
  const chief = db.users.find((u) => u.eventId === ev.id && u.role === 'promotor_chefe')
  const userName = (id: string | null) => (id ? db.users.find((u) => u.id === id)?.name : null)
  const canChoose = !cancelled && !past && !!(ev.modalities?.length || ev.extras?.length)
  const due = totalDue(p, ev)

  const saveData = () => {
    update((d) => {
      const x = d.participants.find((y) => y.id === p.id)!
      x.phone = f.phone.trim()
      x.diet = f.diet
      x.health = f.health.trim() || undefined
    })
    setEditing(false)
    toast('Dados atualizados.')
  }

  return (
    <div className="stack" style={{ maxWidth: 720, margin: '0 auto' }}>
      {sp.get('novo') && <div className="alert alert-ok">Inscrição feita! 🎉 Guarda o teu email e palavra-passe: é com eles que voltas a esta área.</div>}
      <div>
        <h1 className="page-title">A minha área</h1>
        <p className="muted">Aqui vês as tuas prestações, os teus acompanhantes, a tua mesa e os teus dados. Com tudo pago, desbloqueias o QR e a app do evento.</p>
      </div>
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(226, 166, 92, 0.18), rgba(255,255,255,0.03))', borderColor: 'rgba(226, 166, 92, 0.35)' }}>
        <span className="badge">{ev.code}</span>
        <h2 style={{ margin: '12px 0 6px' }}>{ev.name}</h2>
        <p className="muted">
          {eventWhen(ev)} · {ev.location}
        </p>
        {!cancelled && daysFromNow(ev.date) > 0 && (
          <p className="script gold" style={{ fontSize: '1.6rem', marginTop: 10 }}>
            Faltam {daysFromNow(ev.date)} dias para a tua noite
          </p>
        )}
        {past && !cancelled && <p className="script gold" style={{ fontSize: '1.5rem', marginTop: 10 }}>Obrigado por teres feito parte desta noite ✨</p>}
      </div>

      {allPaid && !cancelled && (
        <Link to="/app" className="card app-cta">
          <div className="icon-bubble" style={{ margin: 0, flexShrink: 0 }}>
            <Icon name="sparkle" />
          </div>
          <div className="grow">
            <b>A tua app LastDance está desbloqueada</b>
            <div className="small muted">QR de entrada, votações do Rei e da Rainha e as fotos da noite.</div>
          </div>
          <span className="btn btn-gold btn-sm">Abrir</span>
        </Link>
      )}

      {cancelled && (
        <div className="card stack">
          <h3>Inscrição cancelada</h3>
          <p className="muted">
            A tua inscrição foi cancelada a {dateLong(p.cancelledAt!.slice(0, 10))}
            {p.cancelReason ? ` (${p.cancelReason})` : ''}.
          </p>
          <dl className="kv">
            <dt>Pagaste</dt>
            <dd>{eur(cashIn(p) + refunded(p))}</dd>
            <dt>A devolver</dt>
            <dd>{eur(p.refundDue ?? 0)}</dd>
            <dt>Já devolvido</dt>
            <dd>{eur(refunded(p))}</dd>
          </dl>
          {refundPending(p) > 0 && <div className="alert alert-info small">Falta devolver-te {eur(refundPending(p))}. Fala com o promotor do teu evento.</div>}
        </div>
      )}

      {!cancelled && (
        <div className="card stack">
          <h3>Prestações</h3>
          {p.offer ? (
            <div className="alert alert-info">A tua inscrição é uma oferta. Não tens nada a pagar.</div>
          ) : (
            <>
              <p className="muted">
                O teu baile custa <b style={{ color: 'var(--white)' }}>{eur(due)}</b>, dividido em {ev.installments.length} prestações. Já pagaste {eur(totalPaid(p))}
                {missing(p, ev) > 0 ? ` · faltam ${eur(missing(p, ev))}.` : '.'}
              </p>
              <div className="progress">
                <div style={{ width: `${due ? Math.min(100, (totalPaid(p) / due) * 100) : 100}%` }} />
              </div>
              {next && (
                <div className={`alert ${instStatus(p, ev, next.i) === 'overdue' ? 'alert-err' : 'alert-info'}`}>
                  {rows[next.i].status === 'overdue' ? '⚠ Tens uma prestação em atraso: ' : 'Próxima prestação: '}a {ordinal(next.i)}, {eur(rows[next.i].left)}
                  {next.inst.due &&
                    (daysFromNow(next.inst.due) >= 0
                      ? `, até ${dateShort(next.inst.due)} (daqui a ${daysFromNow(next.inst.due)} dias).`
                      : `, desde ${dateShort(next.inst.due)}. Paga ao teu promotor o quanto antes.`)}
                </div>
              )}
              <div className="list">
                {ev.installments.map((inst, i) => {
                  const st = rows[i].status
                  const paid = rows[i].paid
                  return (
                    <div key={i} className="list-item">
                      <div className="grow">
                        <div className="t">{ordinal(i)} prestação</div>
                        <div className="s">{inst.due ? `Até ${dateShort(inst.due)}` : 'Sem data-limite'}</div>
                      </div>
                      <b>{eur(rows[i].amount)}</b>
                      <StatusPill s={st} label={st === 'partial' || (st === 'overdue' && paid > 0) ? `Parcial · ${eur(paid)}` : undefined} />
                    </div>
                  )
                })}
              </div>
              {p.payments.length > 0 && (
                <details>
                  <summary className="small" style={{ cursor: 'pointer', color: 'var(--accent-light)' }}>
                    Histórico de pagamentos ({p.payments.length})
                  </summary>
                  <div className="list" style={{ marginTop: 10 }}>
                    {[...p.payments]
                      .sort((a, b) => b.at.localeCompare(a.at))
                      .map((x) => (
                        <div key={x.id} className="list-item small">
                          <span className="grow">
                            {x.kind === 'refund' ? 'Devolução' : `${ordinal(x.installment)} prestação`}
                            {x.kind === 'adjust' ? ' (acerto)' : ''}
                            <span className="muted"> · {x.receivedBy ? `recebido por ${userName(x.receivedBy)}` : 'registo antigo'}{x.at ? ` · ${dateTime(x.at)}` : ''}</span>
                          </span>
                          <b>{eur(x.amount)}</b>
                        </div>
                      ))}
                  </div>
                </details>
              )}
              {rolled && <p className="small gold">Numa prestação pagaste um valor diferente do previsto: a diferença foi dividida pelas prestações seguintes.</p>}
              <p className="small muted">
                Pagas cada prestação ao promotor do teu evento, que a regista aqui. Se numa prestação só puderes pagar uma parte, o que falta é dividido pelas
                prestações seguintes. Não há pagamentos online.
              </p>
            </>
          )}
        </div>
      )}

      {canChoose && !p.offer && (
        <div className="card stack">
          <h3>Modalidade e extras</h3>
          {choosing ? (
            <ChoicesEditor
              p={p}
              ev={ev}
              onCancel={() => setChoosing(false)}
              onSave={(m, x) => {
                applyChoices(p.id, m, x ?? [])
                setChoosing(false)
                toast('Escolha guardada. As prestações em falta foram atualizadas.')
              }}
            />
          ) : (
            <>
              <p className="muted">
                {ev.modalities?.find((m) => m.id === p.modalityId)?.name ?? 'Completo'}
                {(p.extras ?? []).length > 0 ? ` · ${p.extras!.map((x) => ev.extras?.find((e) => e.id === x)?.name).join(', ')}` : ' · sem extras'}
              </p>
              <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setChoosing(true)}>
                Mudar modalidade ou extras
              </button>
            </>
          )}
        </div>
      )}

      {!cancelled && (canHost(p) || guestsOf(db, p).length > 0) && <GuestsCard host={p} ev={ev} past={past} />}

      {!cancelled && (
        <div className="card stack" style={{ textAlign: 'center', alignItems: 'center' }}>
          <h3>QR de entrada</h3>
          {p.enteredAt ? (
            <div className="alert alert-ok">Entraste às {dateTime(p.enteredAt)}. Boa festa! 🎉</div>
          ) : allPaid ? (
            <>
              <QR value={p.qr} size={220} />
              <p className="small muted">Mostra este QR à entrada, com o teu Cartão de Cidadão. É sempre o mesmo e só funciona uma vez.</p>
            </>
          ) : (
            <>
              <div className="icon-bubble" style={{ margin: '0 auto' }}>
                <Icon name="lock" />
              </div>
              <b>QR ainda não disponível</b>
              <p className="small muted">
                Fica disponível quando todas as prestações estiverem pagas, junto com a app do evento (votações e fotos). Faltam {eur(missing(p, ev))}.
              </p>
            </>
          )}
        </div>
      )}

      {!cancelled && (
        <div className="card stack">
          <h3>Mesa</h3>
          {table ? (
            <>
              <p style={{ fontSize: '1.3rem', fontWeight: 700 }} className="gold">
                {table.name}
              </p>
              {mates.length > 0 && (
                <p className="muted small">
                  Com{' '}
                  {mates
                    .slice(0, 3)
                    .map((m) => m.name.split(' ')[0])
                    .join(', ')}
                  {mates.length > 3 ? ` e mais ${mates.length - 3} colegas` : ''}
                </p>
              )}
            </>
          ) : (
            <p className="muted">Ainda sem mesa. A organização distribui as mesas antes do evento.</p>
          )}
        </div>
      )}


      {chief && (
        <div className="card row" style={{ flexWrap: 'nowrap' }}>
          <div className="icon-bubble" style={{ margin: 0, flexShrink: 0 }}>
            <Icon name="user" />
          </div>
          <div className="grow">
            <div className="small muted">O teu promotor</div>
            <b>{chief.name}</b>
            {chief.phone && <div className="small muted">{chief.phone}</div>}
          </div>
          {chief.phone && (
            <a className="btn btn-ghost btn-sm" href={`https://wa.me/351${chief.phone.replace(/\D/g, '').slice(-9)}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          )}
        </div>
      )}

      <div className="card stack">
        <div className="row between">
          <h3>Os teus dados</h3>
          {!editing && !cancelled && (
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
              Editar
            </button>
          )}
        </div>
        {editing ? (
          <div className="stack">
            <div className="field">
              <label>Telemóvel</label>
              <input className="input" type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Restrições alimentares</label>
              <select className="input" value={f.diet} onChange={(e) => setF({ ...f, diet: e.target.value })}>
                {DIETS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Saúde (opcional)</label>
              <input className="input" value={f.health} onChange={(e) => setF({ ...f, health: e.target.value })} />
            </div>
            <div className="row">
              <button className="btn btn-gold btn-sm" onClick={saveData} disabled={f.phone.replace(/\D/g, '').length < 9}>
                Guardar
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <dl className="kv">
            <dt>Nome</dt>
            <dd>{p.name}</dd>
            <dt>Email</dt>
            <dd>{p.email}</dd>
            <dt>Telemóvel</dt>
            <dd>{p.phone}</dd>
            <dt>Nascimento</dt>
            <dd>{p.birth ? dateLong(p.birth) : '—'}</dd>
            <dt>Tipo</dt>
            <dd>
              {PTYPE_LONG[p.type]}
              {p.turma ? ` · ${p.turma}` : ''}
            </dd>
            {p.guardianName && (
              <>
                <dt>Encarregado</dt>
                <dd>
                  {p.guardianName} · {p.guardianPhone}
                </dd>
              </>
            )}
            <dt>Alimentação</dt>
            <dd>{p.diet}</dd>
            <dt>Saúde</dt>
            <dd>{p.health || 'Nada indicado'}</dd>
          </dl>
        )}
        <p className="small muted">
          Para mudar o nome, o email ou outros dados, ou se quiseres que apaguemos os teus dados, contacta o promotor do evento.{' '}
          <Link to="/privacidade" className="gold">
            Política de privacidade
          </Link>
        </p>
      </div>
    </div>
  )
}
