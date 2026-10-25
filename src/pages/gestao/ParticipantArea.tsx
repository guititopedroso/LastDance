import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/icons'
import { QR, StatusPill, toast } from '../../components/ui'
import { dateLong, dateShort, dateTime, daysFromNow, eur, eventPrice, eventWhen, fullyPaid, instStatus, missing, normalize, ordinal, paidFor, totalPaid, votingOpen } from '../../data/logic'
import { update, useDB } from '../../data/store'
import { PTYPE_LONG, type Participant } from '../../data/types'

export default function ParticipantArea({ p }: { p: Participant }) {
  const db = useDB()
  const [sp] = useSearchParams()
  const ev = db.events.find((e) => e.id === p.eventId)!
  const paidCount = ev.installments.filter((_, i) => instStatus(p, ev, i) === 'paid').length
  const next = ev.installments.map((inst, i) => ({ inst, i })).find(({ i }) => instStatus(p, ev, i) !== 'paid')
  const table = ev.tables.find((t) => t.id === p.tableId)
  const mates = table ? db.participants.filter((x) => x.tableId === table.id && x.id !== p.id) : []
  const allPaid = fullyPaid(p, ev)

  return (
    <div className="stack" style={{ maxWidth: 720, margin: '0 auto' }}>
      {sp.get('novo') && <div className="alert alert-ok">Inscrição feita! 🎉 Guarda o teu email e palavra-passe: é com eles que voltas a esta área.</div>}
      <div>
        <h1 className="page-title">A minha área</h1>
        <p className="muted">Aqui vês o estado das tuas prestações, a tua mesa, o teu QR de entrada e, no dia do evento, votas nos prémios.</p>
      </div>
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(226, 166, 92, 0.18), rgba(255,255,255,0.03))', borderColor: 'rgba(226, 166, 92, 0.35)' }}>
        <span className="badge">{ev.code}</span>
        <h2 style={{ margin: '12px 0 6px' }}>{ev.name}</h2>
        <p className="muted">
          {eventWhen(ev)} · {ev.location}
        </p>
        {daysFromNow(ev.date) > 0 && (
          <p className="script gold" style={{ fontSize: '1.6rem', marginTop: 10 }}>
            Faltam {daysFromNow(ev.date)} dias para a tua noite
          </p>
        )}
      </div>

      <div className="card stack">
        <h3>Prestações</h3>
        {p.offer ? (
          <div className="alert alert-info">A tua inscrição é uma oferta. Não tens nada a pagar.</div>
        ) : (
          <>
            <p className="muted">
              {paidCount} de {ev.installments.length} prestações pagas · {eur(totalPaid(p))} de {eur(eventPrice(ev))}
              {missing(p, ev) > 0 && ` · faltam ${eur(missing(p, ev))}`}
            </p>
            <div className="progress">
              <div style={{ width: `${(totalPaid(p) / eventPrice(ev)) * 100}%` }} />
            </div>
            {next && (
              <div className={`alert ${instStatus(p, ev, next.i) === 'overdue' ? 'alert-err' : 'alert-info'}`}>
                Próxima prestação: a {ordinal(next.i)}, {eur(next.inst.amount - paidFor(p, next.i))}
                {next.inst.due &&
                  (daysFromNow(next.inst.due) >= 0
                    ? `, até ${dateShort(next.inst.due)} (daqui a ${daysFromNow(next.inst.due)} dias).`
                    : `, em atraso desde ${dateShort(next.inst.due)}.`)}
              </div>
            )}
            <div className="list">
              {ev.installments.map((inst, i) => {
                const st = instStatus(p, ev, i)
                const paid = paidFor(p, i)
                return (
                  <div key={i} className="list-item">
                    <div className="grow">
                      <div className="t">{ordinal(i)} prestação</div>
                      <div className="s">{inst.due ? `Até ${dateShort(inst.due)}` : 'Sem data-limite'}</div>
                    </div>
                    <b>{eur(inst.amount)}</b>
                    <StatusPill s={st} label={st === 'partial' || (st === 'overdue' && paid > 0) ? `Parcial · ${eur(paid)}` : undefined} />
                  </div>
                )
              })}
            </div>
            <p className="small muted">Pagas cada prestação ao promotor do teu evento, que a regista aqui.</p>
          </>
        )}
      </div>

      <div className="card stack" style={{ textAlign: 'center', alignItems: 'center' }}>
        <h3>QR de entrada</h3>
        {p.enteredAt ? (
          <div className="alert alert-ok">Já entraste às {dateTime(p.enteredAt)}. Boa festa! 🎉</div>
        ) : allPaid ? (
          <>
            <QR value={p.qr} size={220} />
            <p className="small muted">Mostra este QR à entrada, com o teu Cartão de Cidadão. Só funciona uma vez.</p>
          </>
        ) : (
          <>
            <div className="icon-bubble" style={{ margin: '0 auto' }}>
              <Icon name="lock" />
            </div>
            <b>QR ainda não disponível</b>
            <p className="small muted">Fica disponível quando todas as prestações estiverem pagas. Faltam {eur(missing(p, ev))}.</p>
          </>
        )}
      </div>

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

      <Voting p={p} />

      <div className="card stack">
        <h3>Os teus dados</h3>
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
          <dt>Alimentação</dt>
          <dd>{p.diet}</dd>
          <dt>Saúde</dt>
          <dd>{p.health || 'Nada indicado'}</dd>
        </dl>
        <p className="small muted">
          Algo errado nos teus dados, ou queres que os apaguemos? Contacta o promotor do evento.{' '}
          <Link to="/privacidade" className="gold">
            Política de privacidade
          </Link>
        </p>
      </div>
    </div>
  )
}

function Voting({ p }: { p: Participant }) {
  const db = useDB()
  const ev = db.events.find((e) => e.id === p.eventId)!
  const [q, setQ] = useState<Record<string, string>>({})
  if (ev.votingMode === 'none' && !ev.announced) return null

  if (ev.announced) {
    const winners = ev.awards.filter((a) => a.winnerId)
    return (
      <div className="card stack">
        <h3>Vencedores da noite</h3>
        {winners.map((a) => (
          <div key={a.id} className="row between">
            <span className="muted">{a.name}</span>
            <b className="gold">{db.participants.find((x) => x.id === a.winnerId)?.name}</b>
          </div>
        ))}
      </div>
    )
  }

  const open = votingOpen(ev)
  if (!open)
    return (
      <div className="card stack">
        <h3>Votação dos prémios</h3>
        <p className="muted">
          A votação abre no dia do evento, às {ev.start}, e fecha às {ev.end}.
        </p>
      </div>
    )
  if (!fullyPaid(p, ev))
    return (
      <div className="card stack">
        <h3>Votação dos prémios</h3>
        <p className="muted">Só pode votar quem tem tudo pago.</p>
      </div>
    )

  const paidPs = db.participants.filter((x) => x.eventId === ev.id && fullyPaid(x, ev))
  return (
    <div className="card stack">
      <h3>Votação dos prémios · aberta</h3>
      {ev.awards.map((a) => {
        const mine = db.votes.find((v) => v.awardId === a.id && v.voterId === p.id)
        const pool = a.eligible ? paidPs.filter((x) => a.eligible!.includes(x.id)) : paidPs
        const term = q[a.id] ?? ''
        const shown = a.eligible ? pool : term.length > 1 ? pool.filter((x) => normalize(x.name).includes(normalize(term))).slice(0, 6) : []
        return (
          <div key={a.id} className="stack" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 12 }}>
            <b>{a.name}</b>
            {mine && <span className="small gold">O teu voto: {db.participants.find((x) => x.id === mine.candidateId)?.name}</span>}
            {!a.eligible && <input className="input" placeholder="Escreve o nome de quem queres votar" value={term} onChange={(e) => setQ({ ...q, [a.id]: e.target.value })} />}
            <div className="chips">
              {shown.map((c) => (
                <button
                  key={c.id}
                  className={`chip ${mine?.candidateId === c.id ? 'on' : ''}`}
                  onClick={() => {
                    update((d) => {
                      d.votes = d.votes.filter((v) => !(v.awardId === a.id && v.voterId === p.id))
                      d.votes.push({ eventId: ev.id, awardId: a.id, voterId: p.id, candidateId: c.id })
                    })
                    setQ({ ...q, [a.id]: '' })
                    toast(`Votaste em ${c.name} para ${a.name}.`)
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
