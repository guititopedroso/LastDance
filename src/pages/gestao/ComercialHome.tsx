import { useNavigate } from 'react-router-dom'
import { Kpi } from '../../components/ui'
import { commissionShares, dateLong, eur, isCancelled, userCommission } from '../../data/logic'
import { useDB } from '../../data/store'
import { CATEGORY_LABEL, type User } from '../../data/types'

export default function ComercialHome({ user }: { user: User }) {
  const db = useDB()
  const nav = useNavigate()
  const mine = db.events.filter((e) => !e.archived && commissionShares(e).some((s) => s.userId === user.id)).sort((a, b) => a.date.localeCompare(b.date))
  const total = mine.reduce((s, e) => s + userCommission(e, db, user.id), 0)
  const paying = mine.reduce((s, e) => s + db.participants.filter((p) => p.eventId === e.id && !p.offer).length, 0)
  return (
    <div>
      <h1 className="page-title">Área do comercial</h1>
      <p className="muted">Os teus eventos e a comissão que está prevista receberes. Clica num evento para ver inscritos, mesas e pagamentos.</p>
      <div className="kpis" style={{ margin: '22px 0' }}>
        <Kpi hl k="Comissão prevista" v={eur(total)} />
        <Kpi k="Eventos" v={mine.length} />
        <Kpi k="Inscrições pagantes" v={paying} />
      </div>
      <h3 style={{ marginBottom: 12 }}>Os meus eventos</h3>
      <div className="list">
        {mine.map((e) => {
          const sh = commissionShares(e)
          const me = sh.find((s) => s.userId === user.id)!
          const other = sh.find((s) => s.userId !== user.id)
          const count = db.participants.filter((p) => p.eventId === e.id && !p.offer).length
          return (
            <div key={e.id} className="list-item click" onClick={() => nav(`evento/${e.id}`)}>
              <div className="grow">
                <div className="t">{e.name}</div>
                <div className="s">
                  {CATEGORY_LABEL[e.category]} · {dateLong(e.date)} · {count} inscritos
                  {(() => {
                    const c = db.participants.filter((p) => p.eventId === e.id && isCancelled(p)).length
                    return c ? ` · ${c} cancelado(s), sem comissão` : ''
                  })()}
                  {other && ` · divides com ${db.users.find((u) => u.id === other.userId)?.name} (${other.pct}%)`}
                </div>
                <div className="s">
                  {eur(e.commission)} por pessoa × {me.pct}% da tua parte
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <b className="gold">{eur(userCommission(e, db, user.id))}</b>
                <div className="s">previsto</div>
              </div>
              <span className="chev">›</span>
            </div>
          )
        })}
        {mine.length === 0 && <div className="empty">Ainda não tens eventos atribuídos.</div>}
      </div>
      <p className="small muted" style={{ marginTop: 14 }}>
        O valor sobe a cada nova inscrição. O acerto final faz-se na reunião com a administração.
      </p>
    </div>
  )
}
