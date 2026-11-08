// App LastDance do participante: desbloqueia-se quando tem tudo pago (o mesmo momento em que recebe o QR).
// Início (QR, mesa, contagem), Prémios (votações) e Memórias (fotos da noite).
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { Icon, type IconName } from '../../components/icons'
import { Logo, QR, toast } from '../../components/ui'
import { daysFromNow, dateTime, eligibleFor, eur, eventPast, eventWhen, fullyPaid, isCancelled, missing, normalize, totalDue, totalPaid, votingOpen } from '../../data/logic'
import { API_MODE, hasSession, update, uploadPhoto, useDB, useSession, useSyncStatus } from '../../data/store'
import type { Award, LDEvent, Participant, Photo } from '../../data/types'
import './app.css'

export default function WebApp() {
  const { user, participant } = useSession()
  const sync = useSyncStatus()
  const db = useDB()

  if (!hasSession()) return <Navigate to="/entrar" replace />
  if (user) return <Navigate to="/gestao" replace />
  if (!participant) {
    if (API_MODE && !sync.loaded)
      return (
        <div className="wa wa-center">
          <Logo h={64} />
          <p className="muted">{sync.offline ? 'Sem ligação à internet. A tentar outra vez…' : 'A carregar…'}</p>
        </div>
      )
    return <Navigate to="/entrar" replace />
  }
  const ev = db.events.find((e) => e.id === participant.eventId)
  if (!ev) return <Navigate to="/gestao" replace />
  if (isCancelled(participant) || !fullyPaid(participant, ev)) return <Locked p={participant} ev={ev} />

  return (
    <div className="wa">
      <header className="wa-top">
        <Link to="/app" aria-label="Início da app">
          <Logo h={30} />
        </Link>
        <span className="wa-ev">{ev.name.split('·').pop()!.trim()}</span>
        <Link to="/gestao" className="wa-round" aria-label="A minha conta" title="A minha conta">
          <Icon name="user" size={20} />
        </Link>
      </header>
      {sync.offline && <div className="wa-offline">Sem internet. Mostramos o que já estava guardado.</div>}
      <main className="wa-main">
        <Routes>
          <Route index element={<Home p={participant} ev={ev} />} />
          <Route path="premios" element={<Awards p={participant} ev={ev} />} />
          <Route path="memorias" element={<Memories p={participant} ev={ev} />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>
      <nav className="wa-nav" aria-label="Navegação da app">
        <Tab to="/app" icon="home" label="Início" end />
        <Tab to="/app/premios" icon="trophy" label="Prémios" dot={votingOpen(ev) && myVotes(db.votes, participant.id, ev) < ev.awards.length} />
        <Tab to="/app/memorias" icon="image" label="Memórias" />
      </nav>
    </div>
  )
}

const myVotes = (votes: { awardId: string; voterId: string }[], id: string, ev: LDEvent) => ev.awards.filter((a) => votes.some((v) => v.awardId === a.id && v.voterId === id)).length

function Tab({ to, icon, label, end, dot }: { to: string; icon: IconName; label: string; end?: boolean; dot?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `wa-tab ${isActive ? 'on' : ''}`}>
      <span className="wa-tab-ic">
        <Icon name={icon} size={22} />
        {dot && <i className="wa-dot" />}
      </span>
      {label}
    </NavLink>
  )
}

// ---------- Bloqueada (ainda há prestações em falta) ----------

function Locked({ p, ev }: { p: Participant; ev: LDEvent }) {
  const due = totalDue(p, ev)
  const pct = due ? Math.min(100, (totalPaid(p) / due) * 100) : 0
  const cancelled = isCancelled(p)
  return (
    <div className="wa wa-center">
      <Logo h={56} />
      <div className="wa-lock">
        <Icon name="lock" size={30} />
      </div>
      <h1 className="wa-h1">{cancelled ? 'Inscrição cancelada' : 'A tua app está quase'}</h1>
      {cancelled ? (
        <p className="muted">A app LastDance só está disponível para inscrições ativas.</p>
      ) : (
        <>
          <p className="muted" style={{ maxWidth: 340 }}>
            Assim que tiveres tudo pago recebes o teu QR de entrada e desbloqueias a app do evento.
          </p>
          <div className="wa-progress" aria-label={`${Math.round(pct)}% pago`}>
            <div style={{ width: `${pct}%` }} />
          </div>
          <p className="small muted">
            {eur(totalPaid(p))} de {eur(due)} · faltam <b className="gold">{eur(missing(p, ev))}</b>
          </p>
          <div className="wa-feats">
            {(
              [
                ['qr', 'QR de entrada'],
                ['crown', 'Votar no Rei e Rainha'],
                ['image', 'Fotos da noite'],
              ] as const
            ).map(([i, t]) => (
              <span key={t}>
                <Icon name={i} size={18} /> {t}
              </span>
            ))}
          </div>
        </>
      )}
      <Link to="/gestao" className="btn btn-gold">
        {cancelled ? 'Ver a minha área' : 'Ver as minhas prestações'}
      </Link>
    </div>
  )
}

// ---------- Início ----------

function Home({ p, ev }: { p: Participant; ev: LDEvent }) {
  const db = useDB()
  const [big, setBig] = useState(false)
  const table = ev.tables.find((t) => t.id === p.tableId)
  const mates = table ? db.participants.filter((x) => x.tableId === table.id && x.id !== p.id && !isCancelled(x)) : []
  const days = daysFromNow(ev.date)
  const past = eventPast(ev)
  const photos = visiblePhotos(db.photos, ev, p)
  const open = votingOpen(ev)
  const voted = myVotes(db.votes, p.id, ev)

  return (
    <div className="wa-stack">
      <section className="wa-hello">
        <p className="muted small">Olá,</p>
        <h1 className="wa-h1">{p.name.split(' ')[0]} ✨</h1>
        <p className="muted small">
          {eventWhen(ev)} · {ev.location}
        </p>
        <div className="wa-count">
          {past ? (
            <span className="script gold">Obrigado por esta noite</span>
          ) : days > 0 ? (
            <>
              <b>{days}</b>
              <span>{days === 1 ? 'dia para a tua noite' : 'dias para a tua noite'}</span>
            </>
          ) : (
            <span className="script gold">É hoje! 🥂</span>
          )}
        </div>
      </section>

      <section className="wa-card wa-qr">
        <div className="row between" style={{ width: '100%' }}>
          <h2 className="wa-h2">Entrada</h2>
          <span className="pill paid">Tudo pago</span>
        </div>
        {p.enteredAt ? (
          <div className="alert alert-ok" style={{ width: '100%' }}>
            Entraste às {dateTime(p.enteredAt)}. Boa festa! 🎉
          </div>
        ) : (
          <>
            <button className="wa-qr-btn" onClick={() => setBig(true)} aria-label="Mostrar o QR em ecrã inteiro">
              <QR value={p.qr} size={210} />
            </button>
            <p className="small muted">Toca no QR para o aumentar. Leva o Cartão de Cidadão.</p>
          </>
        )}
      </section>

      <div className="wa-grid2">
        <Link to="/app/premios" className="wa-card wa-tile">
          <Icon name="crown" size={26} className="wa-ic" />
          <b>Prémios</b>
          <span className="small muted">
            {ev.announced ? 'Vencedores anunciados' : open ? `Votação aberta · ${voted}/${ev.awards.length}` : ev.awards.length ? 'Abre no dia do evento' : 'Sem prémios'}
          </span>
        </Link>
        <Link to="/app/memorias" className="wa-card wa-tile">
          <Icon name="image" size={26} className="wa-ic" />
          <b>Memórias</b>
          <span className="small muted">{photos.length ? `${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}` : 'Partilha a primeira foto'}</span>
        </Link>
      </div>

      <section className="wa-card">
        <h2 className="wa-h2">Mesa</h2>
        {table ? (
          <>
            <p className="wa-table gold">{table.name}</p>
            {mates.length > 0 && (
              <div className="wa-mates">
                {mates.slice(0, 8).map((m) => (
                  <Avatar key={m.id} name={m.name} size={34} />
                ))}
                {mates.length > 8 && <span className="small muted">+{mates.length - 8}</span>}
              </div>
            )}
          </>
        ) : (
          <p className="muted small">A organização distribui as mesas antes do evento.</p>
        )}
      </section>

      {photos.length > 0 && (
        <section className="wa-card">
          <div className="row between">
            <h2 className="wa-h2">Últimas fotos</h2>
            <Link to="/app/memorias" className="small gold">
              Ver todas
            </Link>
          </div>
          <div className="wa-strip">
            {photos.slice(0, 6).map((x) => (
              <Link key={x.id} to="/app/memorias">
                <img src={x.src} alt={x.caption ?? `Foto de ${x.authorName}`} loading="lazy" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {big && (
        <div className="wa-qr-full" onClick={() => setBig(false)} role="dialog" aria-label="QR de entrada">
          <QR value={p.qr} size={Math.min(360, window.innerWidth - 48)} />
          <b>{p.name}</b>
          <span>{ev.name}</span>
          <small>Toca para fechar</small>
        </div>
      )}
    </div>
  )
}

// ---------- Prémios ----------

function Awards({ p, ev }: { p: Participant; ev: LDEvent }) {
  const db = useDB()
  const [voting, setVoting] = useState<Award | null>(null)
  const open = votingOpen(ev)
  const name = (id?: string) => db.participants.find((x) => x.id === id)?.name ?? '—'
  const voted = myVotes(db.votes, p.id, ev)

  return (
    <div className="wa-stack">
      <section className="wa-head">
        <Icon name="trophy" size={30} className="wa-ic" />
        <h1 className="wa-h1">Prémios LastDance</h1>
        <p className="muted small">
          {ev.announced
            ? 'Os vencedores já foram anunciados.'
            : open
              ? 'Vota nos teus colegas. O voto é secreto e podes mudá-lo até a votação fechar.'
              : ev.votingMode === 'closed' || ev.votingMode === 'none'
                ? 'A votação está fechada.'
                : `A votação abre no dia do evento, às ${ev.start}, e fecha às ${ev.end}.`}
        </p>
        {open && ev.awards.length > 0 && (
          <div className="wa-progress small-bar">
            <div style={{ width: `${(voted / ev.awards.length) * 100}%` }} />
          </div>
        )}
        {open && ev.awards.length > 0 && (
          <span className="small muted">
            Votaste em {voted} de {ev.awards.length} {ev.awards.length === 1 ? 'categoria' : 'categorias'}
          </span>
        )}
      </section>

      {ev.awards.length === 0 && <div className="wa-empty">Ainda não há categorias. Fica atento!</div>}

      {ev.awards.map((a, k) => {
        const mine = db.votes.find((v) => v.awardId === a.id && v.voterId === p.id)
        const royal = /rei|rainha|king|queen/i.test(a.name)
        return (
          <section key={a.id} className={`wa-card wa-award ${ev.announced && a.winnerId ? 'won' : ''}`} style={{ animationDelay: `${k * 70}ms` }}>
            <div className="wa-award-ic">
              <Icon name={royal ? 'crown' : 'trophy'} size={24} />
            </div>
            <div className="grow">
              <b>{a.name}</b>
              {ev.announced ? (
                a.winnerId ? (
                  <div className="wa-winner">
                    <Avatar name={name(a.winnerId)} size={30} /> <span className="gold">{name(a.winnerId)}</span>
                  </div>
                ) : (
                  <div className="small muted">Sem vencedor</div>
                )
              ) : mine ? (
                <div className="small">
                  O teu voto: <span className="gold">{name(mine.candidateId)}</span>
                </div>
              ) : (
                <div className="small muted">{open ? 'Ainda não votaste' : 'Por votar'}</div>
              )}
            </div>
            {open && (
              <button className={`btn btn-sm ${mine ? 'btn-ghost' : 'btn-gold'}`} onClick={() => setVoting(a)}>
                {mine ? 'Mudar' : 'Votar'}
              </button>
            )}
            {!open && mine && !ev.announced && <Icon name="check" size={20} className="wa-ic" />}
          </section>
        )
      })}

      {voting && <VoteSheet award={voting} p={p} ev={ev} onClose={() => setVoting(null)} />}
    </div>
  )
}

function VoteSheet({ award, p, ev, onClose }: { award: Award; p: Participant; ev: LDEvent; onClose: () => void }) {
  const db = useDB()
  const [q, setQ] = useState('')
  const mine = db.votes.find((v) => v.awardId === award.id && v.voterId === p.id)
  const pool = useMemo(
    () =>
      db.participants
        .filter((x) => x.eventId === ev.id && x.id !== p.id && !isCancelled(x) && eligibleFor(award, x, ev))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt')),
    [db.participants, award, ev, p.id],
  )
  const shown = q.trim() ? pool.filter((x) => normalize(x.name).includes(normalize(q.trim()))) : pool
  const tableName = (id?: string) => ev.tables.find((t) => t.id === id)?.name

  const vote = (c: Participant) => {
    update((d) => {
      d.votes = d.votes.filter((v) => !(v.awardId === award.id && v.voterId === p.id))
      d.votes.push({ eventId: ev.id, awardId: award.id, voterId: p.id, candidateId: c.id })
    })
    toast(`Votaste em ${c.name} para ${award.name}.`)
    onClose()
  }

  return (
    <Sheet title={award.name} onClose={onClose}>
      <div className="wa-search">
        <Icon name="search" size={18} />
        <input className="input" placeholder="Procurar pelo nome" value={q} onChange={(e) => setQ(e.target.value)} autoFocus={window.innerWidth > 700} />
      </div>
      <div className="wa-people">
        {shown.map((c) => (
          <button key={c.id} className={`wa-person ${mine?.candidateId === c.id ? 'on' : ''}`} onClick={() => vote(c)}>
            <Avatar name={c.name} size={40} />
            <span className="grow">
              <b>{c.name}</b>
              {tableName(c.tableId) && <small className="muted">{tableName(c.tableId)}</small>}
            </span>
            {mine?.candidateId === c.id && <Icon name="check" size={20} className="wa-ic" />}
          </button>
        ))}
        {!shown.length && <p className="muted small" style={{ textAlign: 'center' }}>Ninguém encontrado com esse nome.</p>}
      </div>
    </Sheet>
  )
}

// ---------- Memórias ----------

/** Fotos que este participante vê: as do evento, menos as denunciadas (exceto as suas). */
function visiblePhotos(all: Photo[], ev: LDEvent, p: Participant) {
  return all.filter((x) => x.eventId === ev.id && (!x.reported || x.authorId === p.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const EMOJIS = ['✨', '❤️', '🥂', '💃', '🕺', '🔥', '🌙', '⭐', '🎉', '📸', '😍', '👑']

function Memories({ p, ev }: { p: Participant; ev: LDEvent }) {
  const db = useDB()
  const [filter, setFilter] = useState<'all' | 'mine'>('all')
  const [adding, setAdding] = useState(false)
  const [viewing, setViewing] = useState<Photo | null>(null)
  const photos = visiblePhotos(db.photos, ev, p).filter((x) => filter === 'all' || x.authorId === p.id)

  return (
    <div className="wa-stack">
      <section className="wa-head">
        <Icon name="image" size={30} className="wa-ic" />
        <h1 className="wa-h1">Memórias</h1>
        <p className="muted small">As fotos da noite, partilhadas por todos. Só quem está no evento as vê.</p>
        <div className="chips">
          <button className={`chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>
            Todas
          </button>
          <button className={`chip ${filter === 'mine' ? 'on' : ''}`} onClick={() => setFilter('mine')}>
            As minhas
          </button>
        </div>
      </section>

      {photos.length === 0 ? (
        <div className="wa-empty">
          <Icon name="image" size={34} />
          <p>{filter === 'mine' ? 'Ainda não partilhaste fotos.' : 'Ainda não há fotos. Sê o primeiro a partilhar!'}</p>
          <button className="btn btn-gold btn-sm" onClick={() => setAdding(true)}>
            Adicionar foto
          </button>
        </div>
      ) : (
        <div className="wa-wall">
          {photos.map((x, k) => (
            <button key={x.id} className="polaroid" style={{ ['--r' as string]: `${((hash(x.id) % 7) - 3) * 0.8}deg`, animationDelay: `${Math.min(k, 12) * 50}ms` }} onClick={() => setViewing(x)}>
              <img src={x.src} alt={x.caption ?? `Foto de ${x.authorName}`} loading="lazy" />
              {x.emoji && <span className="polaroid-emoji">{x.emoji}</span>}
              <span className="polaroid-cap">{x.caption || x.authorName.split(' ')[0]}</span>
              {x.reported && <span className="polaroid-flag">Em revisão</span>}
            </button>
          ))}
        </div>
      )}

      <button className="wa-fab" onClick={() => setAdding(true)} aria-label="Adicionar foto">
        <Icon name="plus" size={26} />
      </button>

      {adding && <UploadSheet ev={ev} onClose={() => setAdding(false)} />}
      {viewing && <PhotoView photo={viewing} p={p} onClose={() => setViewing(null)} />}
    </div>
  )
}

function UploadSheet({ ev, onClose }: { ev: LDEvent; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [caption, setCaption] = useState('')
  const [emoji, setEmoji] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])

  const pick = (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return toast('Escolhe uma fotografia.')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const send = async () => {
    if (!file) return
    setProgress(0)
    try {
      await uploadPhoto(ev.id, file, caption.trim(), emoji, setProgress)
      toast('Foto partilhada! 📸')
      onClose()
    } catch (e) {
      setProgress(null)
      toast(e instanceof Error ? e.message : 'Não foi possível enviar a foto.')
    }
  }

  return (
    <Sheet title="Nova memória" onClose={progress === null ? onClose : () => {}}>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      {preview ? (
        <div className="wa-preview">
          <img src={preview} alt="Foto escolhida" />
          {progress === null && (
            <button className="btn btn-ghost btn-sm" onClick={() => input.current?.click()}>
              Trocar
            </button>
          )}
        </div>
      ) : (
        <button className="wa-picker" onClick={() => input.current?.click()}>
          <Icon name="image" size={34} />
          <b>Escolher foto</b>
          <span className="small muted">Da galeria ou da câmara</span>
        </button>
      )}
      <div className="field">
        <label>Legenda (opcional)</label>
        <input className="input" maxLength={80} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Uma frase para este momento…" disabled={progress !== null} />
      </div>
      <div className="wa-emojis">
        {EMOJIS.map((e) => (
          <button key={e} className={emoji === e ? 'on' : ''} onClick={() => setEmoji(emoji === e ? '' : e)} disabled={progress !== null} aria-label={`Emoji ${e}`}>
            {e}
          </button>
        ))}
      </div>
      {progress !== null && (
        <div className="wa-progress">
          <div style={{ width: `${progress}%` }} />
        </div>
      )}
      <button className="btn btn-gold" onClick={send} disabled={!file || progress !== null}>
        {progress !== null ? `A enviar… ${progress}%` : 'Partilhar'}
      </button>
      <p className="small muted">Partilha só fotos em que as pessoas aceitem aparecer. A organização pode remover fotos denunciadas.</p>
    </Sheet>
  )
}

function PhotoView({ photo, p, onClose }: { photo: Photo; p: Participant; onClose: () => void }) {
  const mine = photo.authorId === p.id
  const remove = () => {
    if (!confirm('Apagar esta foto?')) return
    update((d) => {
      d.photos = d.photos.filter((x) => x.id !== photo.id)
    })
    toast('Foto apagada.')
    onClose()
  }
  const report = () => {
    if (!confirm('Denunciar esta foto? Deixa de aparecer até a organização a rever.')) return
    update((d) => {
      const x = d.photos.find((y) => y.id === photo.id)
      if (x) x.reported = true
    })
    toast('Obrigado. A organização vai rever esta foto.')
    onClose()
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="wa-view" role="dialog" aria-label="Foto" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="wa-round wa-view-x" onClick={onClose} aria-label="Fechar">
        <Icon name="close" size={20} />
      </button>
      <img src={photo.src} alt={photo.caption ?? `Foto de ${photo.authorName}`} />
      <div className="wa-view-info">
        <Avatar name={photo.authorName} size={36} />
        <div className="grow">
          <b>{photo.authorName}</b>
          <div className="small muted">{dateTime(photo.createdAt)}</div>
          {photo.caption && (
            <p>
              {photo.emoji} {photo.caption}
            </p>
          )}
        </div>
        {mine ? (
          <button className="wa-round" onClick={remove} aria-label="Apagar foto" title="Apagar">
            <Icon name="trash" size={19} />
          </button>
        ) : (
          <button className="wa-round" onClick={report} aria-label="Denunciar foto" title="Denunciar">
            <Icon name="flag" size={19} />
          </button>
        )}
      </div>
    </div>
  )
}

// ---------- Peças comuns ----------

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="wa-sheet-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wa-sheet" role="dialog" aria-label={title}>
        <span className="wa-handle" />
        <div className="row between">
          <h2 className="wa-h2">{title}</h2>
          <button className="wa-round" onClick={onClose} aria-label="Fechar">
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Iniciais num círculo com uma cor da marca escolhida pelo nome. */
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const parts = name.trim().split(/\s+/)
  const ini = ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
  const hues = ['#8c2a33', '#b7773f', '#6b1f3a', '#9a5b2e', '#5d1a22', '#a0703e']
  return (
    <span className="wa-avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: hues[hash(name) % hues.length] }} aria-hidden>
      {ini}
    </span>
  )
}
