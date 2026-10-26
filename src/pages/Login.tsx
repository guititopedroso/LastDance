import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BackLink, PasswordInput } from '../components/forms'
import { Icon } from '../components/icons'
import { Logo, toast } from '../components/ui'
import { API_MODE, chooseAccount, login, recoverPassword, resetDemo, type Account } from '../data/store'

/** Casos de demonstração (só no modo protótipo). Palavra-passe de todos: demo1234. */
const DEMO: [string, [string, string][]][] = [
  [
    'Equipa',
    [
      ['Administrador', 'admin@lastdance.pt'],
      ['Comercial', 'comercial@lastdance.pt'],
      ['Promotor chefe', 'promotor@lastdance.pt'],
      ['Promotor da equipa', 'equipa@lastdance.pt'],
      ['Staff (todos os eventos)', 'staff@lastdance.pt'],
      ['Staff (só um evento)', 'staff2@lastdance.pt'],
    ],
  ],
  [
    'Alunos',
    [
      ['Prestações a meio', 'aluno@lastdance.pt'],
      ['Tudo pago (com QR)', 'pago@lastdance.pt'],
      ['Em atraso', 'atraso@lastdance.pt'],
      ['Com modalidade e extras', 'extras@lastdance.pt'],
      ['Inscrição cancelada', 'cancelado@lastdance.pt'],
      ['Menor de idade (9.º ano)', 'menor@lastdance.pt'],
      ['Oferta', 'oferta@lastdance.pt'],
      ['Votação aberta agora', 'votacao@lastdance.pt'],
      ['Evento já realizado', 'realizado@lastdance.pt'],
    ],
  ],
  [
    'Mesmo email, várias áreas',
    [
      ['Inscrito em 2 eventos', 'varios@lastdance.pt'],
      ['Promotor e aluno', 'duplo@lastdance.pt'],
    ],
  ],
]

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [mode, setMode] = useState<'login' | 'recover'>('login')
  const [demo, setDemo] = useState(false)
  const [busy, setBusy] = useState(false)
  const [choices, setChoices] = useState<Account[] | null>(null)
  const [rec, setRec] = useState({ email: '', birth: '', pass: '', pass2: '' })
  const [recDone, setRecDone] = useState(false)

  const enter = async (a: Account, all: Account[]) => {
    setBusy(true)
    try {
      await chooseAccount(a, all)
      nav('/gestao')
    } finally {
      setBusy(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const found = await login(email, password)
      if (!found.length) return setErr('Email ou palavra-passe incorretos.')
      if (found.length === 1) return await enter(found[0], found)
      setChoices(found)
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Não foi possível entrar. Tenta outra vez.')
    } finally {
      setBusy(false)
    }
  }

  const recover = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (rec.pass.length < 6) return setErr('A palavra-passe nova tem de ter pelo menos 6 caracteres.')
    if (rec.pass !== rec.pass2) return setErr('As palavras-passe não coincidem.')
    setBusy(true)
    try {
      const n = await recoverPassword(rec.email, rec.birth, rec.pass)
      if (!n) return setErr('Não encontrámos nenhuma inscrição com este email e esta data de nascimento.')
      setRecDone(true)
      setEmail(rec.email)
      setPassword('')
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Não foi possível alterar a palavra-passe.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card stack">
        <BackLink />

        {choices ? (
          <div className="card stack" style={{ padding: 28 }}>
            <div className="auth-head">
              <Logo h={48} />
              <h1>Onde queres entrar?</h1>
              <p className="muted small">Este email tem acesso a mais do que uma área.</p>
            </div>
            <div className="list">
              {choices.map((a) => (
                <button key={a.session.kind + a.session.id} className="list-item click" style={{ width: '100%', border: 0, textAlign: 'left', cursor: 'pointer' }} disabled={busy} onClick={() => enter(a, choices)}>
                  <div className="grow">
                    <div className="t">{a.label}</div>
                    <div className="s">{a.detail}</div>
                  </div>
                  <Icon name="arrow" size={18} />
                </button>
              ))}
            </div>
            <button className="link small" style={{ alignSelf: 'center' }} onClick={() => setChoices(null)}>
              Usar outro email
            </button>
          </div>
        ) : mode === 'recover' ? (
          <form className="card stack" onSubmit={recover} style={{ padding: 28 }}>
            <div className="auth-head">
              <Logo h={48} />
              <h1>Recuperar palavra-passe</h1>
              <p className="muted small">Para alunos inscritos. Confirma o teu email e a data de nascimento da inscrição e escolhe uma palavra-passe nova.</p>
            </div>
            {recDone ? (
              <>
                <div className="alert alert-ok">Palavra-passe alterada. Já podes entrar.</div>
                <button type="button" className="btn btn-gold" onClick={() => (setMode('login'), setRecDone(false))}>
                  Voltar ao log-in
                </button>
              </>
            ) : (
              <>
                <div className="field">
                  <label>Email</label>
                  <input className="input" type="email" inputMode="email" required value={rec.email} onChange={(e) => setRec({ ...rec, email: e.target.value })} autoComplete="username" />
                </div>
                <div className="field">
                  <label>Data de nascimento</label>
                  <input className="input" type="date" required value={rec.birth} onChange={(e) => setRec({ ...rec, birth: e.target.value })} />
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Palavra-passe nova</label>
                    <PasswordInput required minLength={6} value={rec.pass} onChange={(e) => setRec({ ...rec, pass: e.target.value })} autoComplete="new-password" />
                  </div>
                  <div className="field">
                    <label>Repetir</label>
                    <PasswordInput required value={rec.pass2} onChange={(e) => setRec({ ...rec, pass2: e.target.value })} autoComplete="new-password" />
                  </div>
                </div>
                {err && <div className="alert alert-err small">{err}</div>}
                <button className="btn btn-gold" disabled={busy}>
                  {busy ? 'A alterar…' : 'Alterar palavra-passe'}
                </button>
                <p className="small muted">És promotor ou da equipa? Pede uma palavra-passe nova à administração.</p>
                <button type="button" className="link small" style={{ alignSelf: 'center' }} onClick={() => (setMode('login'), setErr(''))}>
                  Voltar ao log-in
                </button>
              </>
            )}
          </form>
        ) : (
          <form className="card stack" onSubmit={submit} style={{ padding: 28 }}>
            <div className="auth-head">
              <Logo h={56} />
              <h1>Log-in</h1>
              <p className="muted small">Alunos, promotores e equipa LastDance entram aqui.</p>
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </div>
            <div className="field">
              <div className="row between">
                <label htmlFor="pass">Palavra-passe</label>
                <button type="button" className="link small" onClick={() => (setMode('recover'), setErr(''), setRec({ ...rec, email }))}>
                  Esqueceste-te?
                </button>
              </div>
              <PasswordInput id="pass" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            {err && <div className="alert alert-err small">{err}</div>}
            <button className="btn btn-gold" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'A entrar…' : 'Entrar'}
            </button>
            <div className="divider">ainda não tens conta?</div>
            <Link to="/inscricao" className="btn btn-ghost" style={{ width: '100%' }}>
              Inscrever com o código do evento
            </Link>
          </form>
        )}

        {!API_MODE && !choices && mode === 'login' && (
          <div className="card stack" style={{ padding: 18 }}>
            <button type="button" className="row between" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, width: '100%' }} onClick={() => setDemo(!demo)}>
              <span className="small">Contas de demonstração</span>
              <span className="muted small">{demo ? 'Esconder' : 'Mostrar'}</span>
            </button>
            {demo && (
              <>
                <p className="small muted">Só no protótipo. Escolhe um caso e carrega em Entrar (palavra-passe demo1234). Para ver um evento esgotado, tenta inscrever-te com o código ESGOTADO26.</p>
                {DEMO.map(([group, items]) => (
                  <div key={group}>
                    <div className="label" style={{ margin: '4px 0 6px' }}>
                      {group}
                    </div>
                    <div className="chips">
                      {items.map(([l, e]) => (
                        <button
                          key={e}
                          type="button"
                          className={`chip ${email === e ? 'on' : ''}`}
                          onClick={() => {
                            setEmail(e)
                            setPassword('demo1234')
                            setErr('')
                          }}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="link small"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => {
                    resetDemo()
                    toast('Dados de demonstração repostos.')
                  }}
                >
                  Repor dados de demonstração
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
