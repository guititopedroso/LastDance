import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import type { InstStatus } from '../data/logic'
import { chooseAccount, setSession, useAccounts, useSession, useSyncStatus } from '../data/store'
import { ROLE_LABEL } from '../data/types'
import { Icon } from './icons'

export function Modal({ onClose, children, wide }: { onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <button className="modal-x" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        {children}
      </div>
    </div>
  )
}

let toastFn: (m: string, ms?: number) => void = () => {}
/** Mensagem curta no fundo do ecrã. Para palavras-passe novas, usa um tempo maior (ms). */
export const toast = (m: string, ms?: number) => toastFn(m, ms)
export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    let t: number
    toastFn = (m, ms = Math.max(2600, m.length * 60)) => {
      setMsg(m)
      clearTimeout(t)
      t = window.setTimeout(() => setMsg(null), ms)
    }
    const onEvent = (e: Event) => toastFn((e as CustomEvent<string>).detail)
    window.addEventListener('ld-toast', onEvent)
    return () => window.removeEventListener('ld-toast', onEvent)
  }, [])
  return msg ? (
    <div className="toast" role="status" onClick={() => setMsg(null)}>
      {msg}
    </div>
  ) : null
}

/** Palavra-passe inicial aleatória para contas novas (nunca uma palavra-passe fixa conhecida). */
export const newPassword = () => {
  const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const r = crypto.getRandomValues(new Uint32Array(10))
  return Array.from(r, (n) => a[n % a.length]).join('')
}

export function Kpi({ k, v, hl, bad }: { k: ReactNode; v: ReactNode; hl?: boolean; bad?: boolean }) {
  return (
    <div className={`kpi ${hl ? 'hl' : ''} ${bad ? 'bad' : ''}`}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  )
}

export interface TabDef<T extends string> {
  id: T
  label: string
  count?: number
  red?: boolean
}
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: TabDef<T>[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.id} className={value === t.id ? 'on' : ''} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined && <span className={`count ${t.red && t.count > 0 ? 'red' : ''}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

const STATUS_LABEL: Record<InstStatus, string> = { paid: 'Paga', partial: 'Parcial', missing: 'Em falta', overdue: 'Em atraso', offer: 'Oferta' }
export function StatusPill({ s, label }: { s: InstStatus; label?: string }) {
  return <span className={`pill ${s}`}>{label ?? STATUS_LABEL[s]}</span>
}

export function QR({ value, size = 200 }: { value: string; size?: number }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(value, { width: size, margin: 1 }).then(setSrc)
  }, [value, size])
  return <div className="qr-box">{src && <img src={src} width={size} height={size} alt="QR de entrada" />}</div>
}

const LOGO = '/brand/logo-gold-sm.webp' // 591×364, já recortado e com fundo transparente

/** Logótipo dourado com um brilho que passa de vez em quando. */
export function Logo({ h = 48, shine = true }: { h?: number; shine?: boolean }) {
  return (
    <span className={shine ? 'logo-shine' : undefined} style={{ ['--logo-mask' as string]: `url(${LOGO})`, flexShrink: 0 }}>
      <img src={LOGO} alt="LastDance" width={Math.round((h * 591) / 364)} height={h} style={{ height: h, width: 'auto', display: 'block' }} />
    </span>
  )
}

/** Cabeçalho das áreas autenticadas. */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, participant } = useSession()
  const sync = useSyncStatus()
  const accounts = useAccounts()
  const [switching, setSwitching] = useState(false)
  const nav = useNavigate()
  const name = user?.name ?? participant?.name
  const current = user?.id ?? participant?.id
  const role = user ? ROLE_LABEL[user.role] : 'Aluno'
  return (
    <div className="app-bg">
      <header className="app-top">
        <div className="container inner">
          <Link to="/" className="row" style={{ textDecoration: 'none', gap: 14, flexWrap: 'nowrap' }} aria-label="Ir para o site">
            <Logo h={34} />
            <span className="hide-mobile muted small" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {user ? 'Gestão de eventos' : 'A minha área'}
            </span>
          </Link>
          <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
            {name && (
              <span className="who">
                <span>{name.split(' ').slice(0, 2).join(' ')}</span>
                <small>{role}</small>
              </span>
            )}
            {accounts.length > 1 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setSwitching(true)} title="Trocar de área">
                Trocar
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              aria-label="Terminar sessão"
              title="Terminar sessão"
              onClick={() => {
                setSession(null)
                nav('/entrar')
              }}
            >
              <Icon name="logout" size={16} />
              <span className="hide-mobile">Sair</span>
            </button>
          </div>
        </div>
      </header>
      {sync.offline && (
        <div className="sync-bar">
          Sem ligação à internet.{' '}
          {sync.pending > 0 ? `${sync.pending} alteração(ões) guardada(s) neste telemóvel; são enviadas quando a ligação voltar.` : 'Estás a ver os últimos dados guardados.'}
        </div>
      )}
      <main className="container app-main">{children}</main>
      {switching && (
        <Modal onClose={() => setSwitching(false)}>
          <h3>Trocar de área</h3>
          <div className="list" style={{ marginTop: 14 }}>
            {accounts.map((a) => (
              <button
                key={a.session.kind + a.session.id}
                className="list-item click"
                style={{ width: '100%', border: 0, textAlign: 'left', cursor: 'pointer' }}
                disabled={a.session.id === current}
                onClick={async () => {
                  setSwitching(false)
                  await chooseAccount(a, accounts)
                  nav('/gestao')
                }}
              >
                <div className="grow">
                  <div className="t">{a.label}</div>
                  <div className="s">{a.session.id === current ? 'Estás aqui' : a.detail}</div>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
