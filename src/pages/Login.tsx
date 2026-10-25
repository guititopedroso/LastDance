import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BackLink, PasswordInput } from '../components/forms'
import { Logo, toast } from '../components/ui'
import { API_MODE, login, resetDemo, setSession } from '../data/store'

const DEMO = [
  ['Administrador', 'admin@lastdance.pt'],
  ['Comercial', 'comercial@lastdance.pt'],
  ['Promotor chefe', 'promotor@lastdance.pt'],
  ['Promotor', 'equipa@lastdance.pt'],
  ['Staff', 'staff@lastdance.pt'],
  ['Aluno', 'aluno@lastdance.pt'],
]

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [forgot, setForgot] = useState(false)
  const [demo, setDemo] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const s = await login(email, password)
      if (!s) return setErr('Email ou palavra-passe incorretos.')
      setSession(s)
      nav('/gestao')
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Não foi possível entrar. Tenta outra vez.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card stack">
        <BackLink />
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
              <button type="button" className="link small" onClick={() => setForgot(!forgot)}>
                Esqueceste-te?
              </button>
            </div>
            <PasswordInput id="pass" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {forgot && <div className="alert alert-info small">Pede ao promotor do teu evento (ou à LastDance, se és da equipa) para te gerar uma nova palavra-passe.</div>}
          {err && <div className="alert alert-err small">{err}</div>}
          <button className="btn btn-gold" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'A entrar…' : 'Entrar'}
          </button>
          <div className="divider">ainda não tens conta?</div>
          <Link to="/inscricao" className="btn btn-ghost" style={{ width: '100%' }}>
            Inscrever com o código do evento
          </Link>
        </form>

        {!API_MODE && (
        <div className="card stack" style={{ padding: 18 }}>
          <button type="button" className="row between" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, width: '100%' }} onClick={() => setDemo(!demo)}>
            <span className="small">Contas de demonstração</span>
            <span className="muted small">{demo ? 'Esconder' : 'Mostrar'}</span>
          </button>
          {demo && (
            <>
              <p className="small muted">Só no protótipo. Escolhe um perfil e carrega em Entrar (palavra-passe demo1234).</p>
              <div className="chips">
                {DEMO.map(([l, e]) => (
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
