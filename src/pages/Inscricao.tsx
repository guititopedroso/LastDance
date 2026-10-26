import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BackLink, PasswordInput } from '../components/forms'
import { Icon } from '../components/icons'
import { Logo, Modal } from '../components/ui'
import { eur, eventPrice, eventWhen, personPrice } from '../data/logic'
import { API_MODE, findEventByCode, registerParticipant } from '../data/store'
import { DEFAULT_SIGNUP_TYPES, DIETS, PTYPE_LONG, type LDEvent, type ParticipantType } from '../data/types'

export default function Inscricao() {
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')
  const [ev, setEv] = useState<LDEvent | null>(null)
  const [err, setErr] = useState('')
  const [privacy, setPrivacy] = useState(false)
  const [f, setF] = useState({ name: '', birth: '', phone: '', email: '', type: '' as ParticipantType | '', turma: '', password: '', password2: '', diet: '', health: '', consent: false, guardianName: '', guardianPhone: '' })
  const [mod, setMod] = useState('')
  const [ext, setExt] = useState<string[]>([])
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value })

  const findCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const found = await findEventByCode(code)
      if (!found) return setErr('Não encontrámos nenhum evento com este código. Confirma com a tua comissão de finalistas.')
      if (found.full) return setErr('As inscrições para este evento estão fechadas: a lotação foi atingida.')
      setEv(found.event)
      window.scrollTo(0, 0)
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Não foi possível procurar o código.')
    } finally {
      setBusy(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ev) return
    if (f.password.length < 6) return setErr('A palavra-passe tem de ter pelo menos 6 caracteres.')
    if (f.password !== f.password2) return setErr('As palavras-passe não coincidem.')
    setBusy(true)
    setErr('')
    try {
      await registerParticipant(ev, {
        name: f.name.trim(),
        birth: f.birth,
        phone: f.phone,
        email: f.email.trim(),
        type: f.type as ParticipantType,
        turma: f.turma || undefined,
        password: f.password,
        diet: f.diet,
        health: f.health || undefined,
        guardianName: f.guardianName.trim() || undefined,
        guardianPhone: f.guardianPhone.trim() || undefined,
        modalityId: mod || undefined,
        extras: ext,
      })
      nav('/gestao?novo=1')
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Não foi possível concluir a inscrição. Tenta outra vez.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card stack" style={{ maxWidth: ev ? 640 : 480 }}>
        <BackLink />
        {!ev ? (
          <form className="card stack" onSubmit={findCode} style={{ padding: 28 }}>
            <div className="auth-head">
              <Logo h={56} />
              <h1>Inscrição</h1>
              <p className="muted small">Escreve o código do evento que a tua comissão de finalistas te enviou.</p>
            </div>
            <input
              className="input"
              placeholder="CÓDIGO"
              aria-label="Código do evento"
              autoCapitalize="characters"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.3rem', fontWeight: 700, padding: 16 }}
              required
            />
            {err && <div className="alert alert-err small">{err}</div>}
            <button className="btn btn-gold" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'A procurar…' : 'Continuar'} <Icon name="arrow" size={18} />
            </button>
            {!API_MODE && (
              <p className="small muted" style={{ textAlign: 'center' }}>
                Para testar: CABRITA26, ALCOCHETE26 ou IPS26
              </p>
            )}
            <div className="divider">já estás inscrito?</div>
            <Link to="/entrar" className="btn btn-ghost" style={{ width: '100%' }}>
              Log-in
            </Link>
          </form>
        ) : (
          <form className="card stack" onSubmit={submit} style={{ padding: 28 }}>
            <div className="event-chip">
              <div className="icon-bubble" style={{ margin: 0, flexShrink: 0 }}>
                <Icon name="ticket" />
              </div>
              <div style={{ minWidth: 0 }}>
                <b>{ev.name}</b>
                <div className="small muted">
                  {eventWhen(ev)} · {ev.location}
                </div>
                <div className="small gold" style={{ fontWeight: 600 }}>
                  {ev.modalities?.length || ev.extras?.length
                    ? `A partir de ${eur(Math.min(eventPrice(ev), ...(ev.modalities ?? []).map((m) => m.price)))} em ${ev.installments.length} prestações`
                    : `${eur(eventPrice(ev))} em ${ev.installments.length} prestações de ${ev.installments.map((i) => eur(i.amount)).join(' + ')}`}
                </div>
              </div>
            </div>

            <div className="form-section stack">
              <h3>Dados pessoais</h3>
              <p className="small muted">O nome é verificado à entrada com o Cartão de Cidadão.</p>
              <div className="field">
                <label>Nome completo *</label>
                <input className="input" required autoComplete="name" value={f.name} onChange={set('name')} />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Data de nascimento *</label>
                  <input className="input" type="date" required value={f.birth} onChange={set('birth')} />
                </div>
                <div className="field">
                  <label>Telemóvel *</label>
                  <input className="input" type="tel" inputMode="tel" autoComplete="tel" required pattern="[0-9 +]{9,}" value={f.phone} onChange={set('phone')} />
                </div>
              </div>
              <div className="field">
                <label>Email *</label>
                <input className="input" type="email" inputMode="email" autoComplete="email" required value={f.email} onChange={set('email')} />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Tipo de participante *</label>
                  <select className="input" required value={f.type} onChange={set('type')}>
                    <option value="">Escolher</option>
                    {(ev.signupTypes?.length ? ev.signupTypes : DEFAULT_SIGNUP_TYPES).map((t) => (
                      <option key={t} value={t}>
                        {PTYPE_LONG[t]}
                      </option>
                    ))}
                  </select>
                </div>
                {ev.hasClasses && (
                  <div className="field">
                    <label>Turma (opcional)</label>
                    <select className="input" value={f.turma} onChange={set('turma')}>
                      <option value="">Escolher</option>
                      {ev.classes.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="form-section stack">
              <h3>A tua conta</h3>
              <p className="small muted">Fazes log-in com este email e palavra-passe para veres as prestações, a mesa e o QR de entrada.</p>
              <div className="grid-2">
                <div className="field">
                  <label>Palavra-passe *</label>
                  <PasswordInput required minLength={6} value={f.password} onChange={set('password')} autoComplete="new-password" />
                </div>
                <div className="field">
                  <label>Repetir palavra-passe *</label>
                  <PasswordInput required value={f.password2} onChange={set('password2')} autoComplete="new-password" />
                </div>
              </div>
            </div>

            <div className="form-section stack">
              <h3>Informações complementares</h3>
              {ev.category === '9' && (
                <div className="grid-2">
                  <div className="field">
                    <label>Nome do encarregado de educação *</label>
                    <input className="input" required autoComplete="off" value={f.guardianName} onChange={set('guardianName')} />
                  </div>
                  <div className="field">
                    <label>Telefone do encarregado de educação *</label>
                    <input className="input" type="tel" inputMode="tel" required pattern="[0-9 +]{9,}" value={f.guardianPhone} onChange={set('guardianPhone')} />
                  </div>
                </div>
              )}
              {!!ev.modalities?.length && (
                <div className="field">
                  <label>Modalidade *</label>
                  <select className="input" value={mod} onChange={(e) => setMod(e.target.value)}>
                    <option value="">Completo · {eur(eventPrice(ev))}</option>
                    {ev.modalities.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} · {eur(m.price)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!!ev.extras?.length && (
                <div className="field">
                  <label>Extras (opcional)</label>
                  {ev.extras.map((x) => (
                    <label key={x.id} className="check">
                      <input type="checkbox" checked={ext.includes(x.id)} onChange={(e) => setExt(e.target.checked ? [...ext, x.id] : ext.filter((y) => y !== x.id))} />
                      {x.name} (+{eur(x.price)})
                    </label>
                  ))}
                </div>
              )}
              {(!!ev.modalities?.length || !!ev.extras?.length) && (
                <div className="alert alert-info small">
                  Total: <b>{eur(personPrice(ev, mod || undefined, ext))}</b> em {ev.installments.length} prestações. Podes mudar a modalidade e os extras mais tarde, na tua área.
                </div>
              )}
              <div className="field">
                <label>Restrições alimentares *</label>
                <select className="input" required value={f.diet} onChange={set('diet')}>
                  <option value="">Escolher</option>
                  {DIETS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tens alguma condição de saúde que devamos conhecer? (opcional)</label>
                <input className="input" value={f.health} onChange={set('health')} />
              </div>
              <label className="check">
                <input type="checkbox" required checked={f.consent} onChange={set('consent')} />
                <span>
                  Li e aceito a{' '}
                  <button type="button" className="link" onClick={() => setPrivacy(true)}>
                    política de privacidade
                  </button>{' '}
                  e autorizo o tratamento dos meus dados para esta inscrição. *
                </span>
              </label>
            </div>
            {err && <div className="alert alert-err small">{err}</div>}
            <button className="btn btn-gold" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'A guardar…' : 'Concluir inscrição'}
            </button>
            <button
              type="button"
              className="link small"
              style={{ alignSelf: 'center' }}
              onClick={() => {
                setEv(null)
                setErr('')
              }}
            >
              Usar outro código
            </button>
          </form>
        )}
      </div>
      {privacy && (
        <Modal onClose={() => setPrivacy(false)}>
          <h3>Política de privacidade</h3>
          <p className="muted" style={{ marginTop: 10 }}>
            Os teus dados (nome, contactos, data de nascimento, turma, alimentação e saúde) são usados apenas para gerir a tua inscrição, os pagamentos, a mesa, a entrada e a
            votação deste evento. São apagados no fim do ano letivo. Podes pedir a alteração ou eliminação ao promotor do teu evento.
          </p>
          <Link to="/privacidade" className="link small" style={{ display: 'inline-block', marginTop: 12 }}>
            Ler a política completa
          </Link>
        </Modal>
      )}
    </main>
  )
}
