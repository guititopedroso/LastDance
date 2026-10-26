import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/icons'
import { Kpi, Modal, toast } from '../../components/ui'
import { ageAt, dateLong, dateTime, eur, eventWhen, fullyPaid, isCancelled, missing, normalize } from '../../data/logic'
import { update, useDB } from '../../data/store'
import { PTYPE_LONG, type Participant, type User } from '../../data/types'

type Result = { kind: 'ok' | 'used' | 'unpaid' | 'cancelled' | 'notfound' | 'other'; p?: Participant; msg?: string }

export default function StaffDoor({ user }: { user: User }) {
  const db = useDB()
  const allowed = db.events.filter((e) => !e.archived && (!user.staffEventIds?.length || user.staffEventIds.includes(e.id))).sort((a, b) => a.date.localeCompare(b.date))
  const [evId, setEvId] = useState(allowed[0]?.id ?? '')
  const ev = allowed.find((e) => e.id === evId)
  const [code, setCode] = useState('')
  const [q, setQ] = useState('')
  const [res, setRes] = useState<Result | null>(null)
  const [list, setList] = useState(false)
  const [offline, setOffline] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(0)
  const [camera, setCamera] = useState(false)

  if (!ev) return <div className="empty">Não tens eventos atribuídos.</div>
  const ps = db.participants.filter((p) => p.eventId === ev.id && !isCancelled(p))
  const entered = ps.filter((p) => p.enteredAt).length
  const lastIn = ps.filter((p) => p.enteredAt).sort((a, b) => b.enteredAt!.localeCompare(a.enteredAt!)).slice(0, 6)
  const withMissing = ps.filter((p) => !fullyPaid(p, ev)).length

  const check = (p: Participant | undefined, raw?: string): Result => {
    if (!p) return { kind: 'notfound', msg: raw ? `QR «${raw}» não encontrado.` : 'Não encontrado.' }
    if (p.eventId !== ev.id) return { kind: 'other', p, msg: `Este QR é de outro evento: ${db.events.find((e) => e.id === p.eventId)?.name}.` }
    if (isCancelled(p)) return { kind: 'cancelled', p }
    if (p.enteredAt) return { kind: 'used', p }
    if (!fullyPaid(p, ev)) return { kind: 'unpaid', p }
    return { kind: 'ok', p }
  }

  const validate = (raw: string) => {
    const v = raw.trim()
    if (!v) return
    const p = db.participants.find((x) => x.qr.toLowerCase() === v.toLowerCase())
    setRes(check(p, v))
    setCode('')
  }

  const admit = (p: Participant) => {
    update((d) => {
      const x = d.participants.find((y) => y.id === p.id)!
      x.enteredAt = new Date().toISOString()
      x.enteredBy = user.id
    })
    if (offline) setPending((n) => n + 1)
    setRes(null)
    toast(`Entrada registada: ${p.name}`)
  }

  const found = q.length > 1 ? ps.filter((p) => normalize(p.name).includes(normalize(q))).slice(0, 8) : []

  return (
    <div className="stack" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div>
        <h1 className="page-title">Entradas</h1>
        <p className="muted">Lê o QR do participante, confere o nome no Cartão de Cidadão e confirma a entrada.</p>
      </div>
      {offline && (
        <div className="alert alert-warn">
          Sem internet. As entradas ficam guardadas neste telemóvel ({pending} por sincronizar).{' '}
          <button
            className="link"
            onClick={() => {
              setOffline(false)
              toast(`${pending} entradas sincronizadas.`)
              setPending(0)
            }}
          >
            Voltar a ligar
          </button>
        </div>
      )}
      <div className="field">
        <label>Evento</label>
        <select className="input" value={evId} onChange={(e) => (setEvId(e.target.value), setRes(null))}>
          {allowed.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({dateLong(e.date)})
            </option>
          ))}
        </select>
        <span className="small muted">
          {eventWhen(ev)} · {ev.location}
        </span>
      </div>
      <div className="kpis">
        <Kpi hl k="Já entraram" v={`${entered} de ${ps.length}`} />
        <Kpi k="Por entrar" v={ps.length - entered} />
        <Kpi bad={withMissing > 0} k="Com prestações em falta" v={withMissing} />
      </div>

      <div className="card stack">
        <h3>Validar entrada</h3>
        <form
          className="row"
          style={{ flexWrap: 'nowrap' }}
          onSubmit={(e) => {
            e.preventDefault()
            validate(code)
          }}
        >
          <input className="input" placeholder="Código do QR" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn-gold">Validar</button>
        </form>
        <button className="btn btn-ghost" onClick={() => setCamera(true)}>
          <Icon name="camera" size={18} /> Ler com a câmara
        </button>
        <input className="input" placeholder="Ou procura pelo nome" value={q} onChange={(e) => setQ(e.target.value)} />
        {found.map((p) => (
          <div key={p.id} className="list-item click" style={{ borderRadius: 12 }} onClick={() => (setRes(check(p)), setQ(''))}>
            <div className="grow">
              <div className="t">{p.name}</div>
              <div className="s">
                {PTYPE_LONG[p.type]}
                {p.turma ? ` · ${p.turma}` : ''}
              </div>
            </div>
            {p.enteredAt ? <span className="pill paid">entrou</span> : fullyPaid(p, ev) ? <span className="pill missing">por entrar</span> : <span className="pill overdue">em falta</span>}
          </div>
        ))}
        {ps[0] && (
          <p className="small muted">
            Para testar, escreve um QR do evento, por ex.: <code>{ps.find((p) => fullyPaid(p, ev) && !p.enteredAt)?.qr ?? ps[0].qr}</code>
          </p>
        )}
      </div>

      {res && (
        <div className={`alert ${res.kind === 'ok' ? 'alert-ok' : res.kind === 'unpaid' ? 'alert-warn' : 'alert-err'}`} style={{ padding: 22 }}>
          {res.p && (
            <>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--white)' }}>{res.p.name}</div>
              <div style={{ color: 'var(--gray-300)' }}>
                {PTYPE_LONG[res.p.type]}
                {res.p.turma ? ` · ${res.p.turma}` : ''} · nasceu a {res.p.birth ? dateLong(res.p.birth) : '—'}
              </div>
              <AgeBadge birth={res.p.birth} date={ev.date} />
            </>
          )}
          <div style={{ marginTop: 10, fontWeight: 600 }}>
            {res.kind === 'ok' && '✓ Tudo pago. Confere o nome no Cartão de Cidadão.'}
            {res.kind === 'used' && `✕ Este QR já foi usado às ${dateTime(res.p!.enteredAt!)}.`}
            {res.kind === 'unpaid' && `⚠ Prestações em falta: ${eur(missing(res.p!, ev))}. Não pode entrar até regularizar.`}
            {res.kind === 'cancelled' && '✕ Esta inscrição foi cancelada. Não pode entrar.'}
            {(res.kind === 'notfound' || res.kind === 'other') && res.msg}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            {res.kind === 'ok' && (
              <button className="btn btn-gold" onClick={() => admit(res.p!)}>
                Confirmar entrada
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => setRes(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {lastIn.length > 0 && (
        <div className="card stack">
          <h3>Últimas entradas</h3>
          <div className="list">
            {lastIn.map((p) => (
              <div key={p.id} className="list-item small">
                <span className="grow">
                  <b>{p.name}</b>
                  <span className="muted">
                    {' '}
                    · {PTYPE_LONG[p.type]}
                    {p.turma ? ` · ${p.turma}` : ''}
                  </span>
                </span>
                <span className="muted">{dateTime(p.enteredAt!).slice(-5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card stack">
        <h3>Lista de convidados</h3>
        <button className="btn btn-ghost" onClick={() => setList(true)}>
          Ver lista total ({ps.length})
        </button>
      </div>

      <div className="card stack">
        <h3>Sem internet</h3>
        <p className="small muted">Muitas quintas têm pouca rede. Guarda a lista antes de começar, e as entradas ficam registadas neste telemóvel até haver ligação.</p>
        <div className="row">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSaved(true)
              toast(`Lista guardada: ${ps.length} convidados.`)
            }}
          >
            {saved ? '✓ Lista guardada' : 'Guardar lista para usar sem internet'}
          </button>
          <button className="btn btn-ghost btn-sm" disabled={!saved || offline} onClick={() => setOffline(true)}>
            Simular sem internet
          </button>
        </div>
      </div>

      {list && <GuestList evId={ev.id} onClose={() => setList(false)} />}
      {camera && (
        <CameraScanner
          onClose={() => setCamera(false)}
          onCode={(c) => {
            setCamera(false)
            validate(c)
          }}
        />
      )}
    </div>
  )
}

function GuestList({ evId, onClose }: { evId: string; onClose: () => void }) {
  const db = useDB()
  const ev = db.events.find((e) => e.id === evId)!
  const [f, setF] = useState<'all' | 'in' | 'out' | 'missing'>('all')
  const [q, setQ] = useState('')
  const ps = db.participants
    .filter((p) => p.eventId === evId && !p.cancelledAt)
    .filter((p) => (f === 'in' ? p.enteredAt : f === 'out' ? !p.enteredAt : f === 'missing' ? !fullyPaid(p, ev) : true))
    .filter((p) => !q || normalize(p.name).includes(normalize(q)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt'))
  return (
    <Modal wide onClose={onClose}>
      <h3>Lista de convidados</h3>
      <div className="chips" style={{ margin: '14px 0' }}>
        {(
          [
            ['all', 'Todos'],
            ['in', 'Já entraram'],
            ['out', 'Por entrar'],
            ['missing', 'Pagamentos em falta'],
          ] as const
        ).map(([id, l]) => (
          <button key={id} className={`chip ${f === id ? 'on' : ''}`} onClick={() => setF(id)}>
            {l}
          </button>
        ))}
      </div>
      <input className="input" placeholder="Procurar…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />
      <div className="list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {ps.map((p) => (
          <div key={p.id} className="list-item">
            <div className="grow">
              <div className="t">{p.name}</div>
              <div className="s">
                {PTYPE_LONG[p.type]}
                {p.turma ? ` · ${p.turma}` : ''}
              </div>
            </div>
            {p.enteredAt ? (
              <span className="pill paid">entrou {dateTime(p.enteredAt).slice(-5)}</span>
            ) : fullyPaid(p, ev) ? (
              <span className="pill missing">por entrar</span>
            ) : (
              <span className="pill overdue">falta {eur(missing(p, ev))}</span>
            )}
          </div>
        ))}
        {ps.length === 0 && <div className="empty">Ninguém nesta lista.</div>}
      </div>
    </Modal>
  )
}

function CameraScanner({ onClose, onCode }: { onClose: () => void; onCode: (c: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [err, setErr] = useState('')
  const cb = useRef(onCode)
  cb.current = onCode
  useEffect(() => {
    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false
    const Detector = (window as unknown as { BarcodeDetector?: new (o: object) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector
    if (!Detector) {
      setErr('Este navegador não lê QR pela câmara. Usa o Chrome no Android ou escreve o código.')
      return
    }
    const det = new Detector({ formats: ['qr_code'] })
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s
        if (!video.current) return
        video.current.srcObject = s
        video.current.play()
        const loop = async () => {
          if (stopped || !video.current) return
          try {
            const codes = await det.detect(video.current)
            if (codes[0]) return cb.current(codes[0].rawValue)
          } catch {}
          raf = requestAnimationFrame(loop)
        }
        loop()
      })
      .catch(() => setErr('Sem acesso à câmara.'))
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])
  return (
    <Modal onClose={onClose}>
      <h3>Ler QR</h3>
      {err ? <div className="alert alert-warn" style={{ marginTop: 14 }}>{err}</div> : <video ref={video} style={{ width: '100%', borderRadius: 14, marginTop: 14 }} muted playsInline />}
    </Modal>
  )
}

/** Sinal grande de maior / menor de idade no dia do evento. */
function AgeBadge({ birth, date }: { birth: string; date: string }) {
  const age = ageAt(birth, date)
  if (age === null) return null
  const adult = age >= 18
  return (
    <div
      style={{
        display: 'inline-block',
        marginTop: 10,
        padding: '6px 14px',
        borderRadius: 999,
        fontWeight: 800,
        letterSpacing: '0.04em',
        background: adult ? 'var(--green-bg)' : 'var(--red)',
        color: adult ? 'var(--green)' : '#fff',
      }}
    >
      {adult ? `Maior de idade · ${age} anos` : `MENOR · ${age} anos`}
    </div>
  )
}
