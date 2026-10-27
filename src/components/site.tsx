import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BRAND, whatsapp } from '../config'
import { BASE } from '../mode'
import { Icon } from './icons'
import { Logo } from './ui'

const LINKS = [
  ['Eventos', `${BASE}/#eventos`],
  ['Porquê nós', `${BASE}/#quem-somos`],
  ['Como funciona', `${BASE}/#como`],
  ['Perguntas', `${BASE}/#faq`],
  ['Contactos', `${BASE}/#contactos`],
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 30)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  useEffect(() => setOpen(false), [pathname, hash])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <nav className={`nav ${scrolled || open ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <Link to="/" className="nav-logo" aria-label="LastDance — início">
            <Logo h={40} />
          </Link>
          <div className="nav-links">
            {LINKS.map(([l, h]) => (
              <a key={h} href={h}>
                {l}
              </a>
            ))}
          </div>
          <div className="nav-cta">
            <Link to="/entrar" className="btn btn-ghost btn-sm">
              <Icon name="user" size={16} /> Log-in
            </Link>
            <Link to="/inscricao" className="btn btn-gold btn-sm">
              Inscrição
            </Link>
          </div>
          <button className="burger" onClick={() => setOpen(!open)} aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open}>
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </nav>
      <div className={`nav-sheet ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
        <div className="nav-sheet-links">
          {LINKS.map(([l, h], i) => (
            <a key={h} href={h} style={{ transitionDelay: open ? `${80 + i * 50}ms` : '0ms' }}>
              {l}
            </a>
          ))}
        </div>
        <div className="nav-sheet-cta">
          <Link to="/inscricao" className="btn btn-gold">
            Inscrição com código
          </Link>
          <Link to="/entrar" className="btn btn-ghost">
            <Icon name="user" size={18} /> Log-in
          </Link>
        </div>
      </div>
    </>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo h={52} />
            <p className="muted small" style={{ marginTop: 16, maxWidth: 300 }}>
              Bailes de finalistas e jantares de gala premium. Criamos a noite que fica para a história.
            </p>
            <div className="row" style={{ marginTop: 18, gap: 10 }}>
              <a className="icon-btn" href={BRAND.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                <Icon name="instagram" size={18} />
              </a>
              <a className="icon-btn" href={whatsapp()} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <Icon name="chat" size={18} />
              </a>
              <a className="icon-btn" href={`mailto:${BRAND.email}`} aria-label="Email">
                <Icon name="mail" size={18} />
              </a>
            </div>
          </div>
          <div>
            <b>Navegação</b>
            {LINKS.map(([l, h]) => (
              <a key={h} href={h}>
                {l}
              </a>
            ))}
          </div>
          <div>
            <b>Acesso</b>
            <Link to="/inscricao">Inscrição com código</Link>
            <Link to="/entrar">Log-in</Link>
          </div>
          <div>
            <b>Legal</b>
            <Link to="/termos">Termos e Condições</Link>
            <Link to="/privacidade">Política de Privacidade</Link>
            <Link to="/cookies">Política de Cookies</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} LastDance. Todos os direitos reservados.</span>
          <span>
            {BRAND.phone} · {BRAND.email}
          </span>
          <span className="powered">
            Powered by{' '}
            <a href="https://azmar.pt" target="_blank" rel="noopener">
              AZMAR
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}

export function CookieBanner() {
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem('ld-cookies')
    } catch {
      return true
    }
  })
  if (!show) return null
  const set = (v: string) => {
    try {
      localStorage.setItem('ld-cookies', v)
    } catch {}
    setShow(false)
  }
  return (
    <div className="cookie" role="dialog" aria-label="Cookies">
      <p className="small">
        Usamos cookies para o site funcionar e para melhorar a tua experiência.{' '}
        <Link to="/cookies" className="gold">
          Saber mais
        </Link>
      </p>
      <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => set('rejected')}>
          Recusar
        </button>
        <button className="btn btn-gold btn-sm" onClick={() => set('accepted')}>
          Aceitar
        </button>
      </div>
    </div>
  )
}
