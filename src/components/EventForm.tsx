import { useState } from 'react'
import { eur, normalize } from '../data/logic'
import { uid } from '../data/seed'
import { getDB, update, useDB } from '../data/store'
import { CATEGORIES, CATEGORY_LABEL, DEFAULT_SIGNUP_TYPES, PARTNER_TYPES, PTYPES, PTYPE_LONG, type Category, type Extra, type LDEvent, type Modality } from '../data/types'
import { newPassword, toast } from './ui'

const emptyEvent = (): LDEvent => ({
  id: '',
  name: '',
  code: '',
  location: '',
  category: '12',
  date: '',
  start: '20:00',
  end: '04:00',
  hasClasses: true,
  classes: [],
  installments: [{ amount: 0 }, { amount: 0 }, { amount: 0 }],
  commission: 0,
  partners: [],
  comercial1: '',
  share1: 100,
  archived: false,
  votingMode: 'auto',
  awards: ['Rei do Baile', 'Rainha do Baile', 'Melhor Outfit'].map((name) => ({ id: 'aw' + uid(), name, eligible: null })),
  announced: false,
  tables: [],
  modalities: [],
  extras: [],
  signupTypes: [...DEFAULT_SIGNUP_TYPES],
})

/** Lista editável de opções com nome e preço (modalidades ou extras). */
function PriceList<T extends Modality | Extra>({ items, onChange, placeholder, prefix }: { items: T[]; onChange: (v: T[]) => void; placeholder: string; prefix: string }) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      {items.map((it, i) => (
        <div key={it.id} className="row" style={{ flexWrap: 'nowrap' }}>
          <input className="input" placeholder={placeholder} value={it.name} onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
          <input
            className="input"
            style={{ width: 120 }}
            type="number"
            step="0.5"
            min="0"
            placeholder="€"
            value={it.price || ''}
            onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, price: +e.target.value } : x)))}
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Remover">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="chip" style={{ alignSelf: 'flex-start' }} onClick={() => onChange([...items, { id: prefix + uid(), name: '', price: 0 } as T])}>
        + Adicionar
      </button>
    </div>
  )
}

export function EventForm({ existing, onDone }: { existing?: LDEvent; onDone?: (id: string) => void }) {
  const db = useDB()
  const [ev, setEv] = useState<LDEvent>(() => (existing ? structuredClone(existing) : emptyEvent()))
  const [classesText, setClassesText] = useState(() => ev.classes.join(', '))
  const [promoterEmail, setPromoterEmail] = useState('')
  const [err, setErr] = useState('')
  const sellers = db.users.filter((u) => u.role === 'admin' || u.role === 'comercial')
  const set = <K extends keyof LDEvent>(k: K, v: LDEvent[K]) => setEv((e) => ({ ...e, [k]: v }))

  const genCode = () => {
    const words = normalize(ev.name)
      .replace(/baile de finalistas|baile|jantar de gala|jantar|escola|secundaria|basica|de|da|do|·/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
    const base = (words.pop() ?? 'EVENTO').toUpperCase().slice(0, 10)
    const yy = String(new Date(ev.date || Date.now()).getFullYear()).slice(-2)
    let code = base + yy
    let i = 2
    while (db.events.some((e) => e.code === code && e.id !== ev.id)) code = base + yy + '-' + i++
    set('code', code)
  }

  const setN = (n: number) => {
    const inst = Array.from({ length: n }, (_, i) => ev.installments[i] ?? { amount: 0 })
    set('installments', inst)
  }

  const setPartner = (pid: string, on: boolean) => {
    set('partners', on ? [...ev.partners, { partnerId: pid }] : ev.partners.filter((x) => x.partnerId !== pid))
  }

  const total = ev.installments.reduce((s, i) => s + (i.amount || 0), 0)

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const code = ev.code.trim().toUpperCase()
    if (!code) return setErr('Gera ou escreve um código.')
    if (getDB().events.some((x) => x.code === code && x.id !== ev.id)) return setErr('Esse código já está a ser usado noutro evento.')
    if (!ev.comercial1) return setErr('Escolhe o comercial 1.')
    if (total <= 0) return setErr('Define o valor das prestações.')
    if (!existing && promoterEmail && getDB().users.some((u) => u.email.toLowerCase() === promoterEmail.toLowerCase()))
      return setErr('Já existe uma conta com esse email de promotor.')
    const classes = ev.hasClasses
      ? classesText
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    const clean = <T extends { name: string; price: number }>(a?: T[]) => (a ?? []).filter((x) => x.name.trim() && x.price >= 0).map((x) => ({ ...x, name: x.name.trim() }))
    const final: LDEvent = {
      ...ev,
      code,
      classes,
      id: ev.id || 'e' + uid(),
      share1: ev.comercial2 ? ev.share1 : 100,
      modalities: clean(ev.modalities),
      extras: clean(ev.extras),
    }
    const promoterPass = newPassword()
    update((d) => {
      if (existing) d.events = d.events.map((x) => (x.id === final.id ? final : x))
      else {
        d.events.push(final)
        if (promoterEmail)
          d.users.push({ id: 'u' + uid(), name: 'Promotor ' + code, email: promoterEmail.trim(), password: promoterPass, role: 'promotor_chefe', eventId: final.id })
      }
    })
    toast(
      existing ? 'Evento atualizado.' : promoterEmail ? `Evento criado com o código ${code}. Palavra-passe do promotor: ${promoterPass}` : `Evento criado com o código ${code}.`,
      promoterEmail && !existing ? 20000 : undefined,
    )
    if (!existing) {
      setEv(emptyEvent())
      setClassesText('')
      setPromoterEmail('')
    }
    setErr('')
    onDone?.(final.id)
  }

  return (
    <form className="stack" onSubmit={save}>
      <div className="grid-2">
        <div className="field">
          <label>Nome do evento</label>
          <input className="input" required placeholder="Baile de finalistas · Escola …" value={ev.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="field">
          <label>Código</label>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <input className="input" value={ev.code} onChange={(e) => set('code', e.target.value.toUpperCase())} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={genCode}>
              Gerar
            </button>
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Quinta parceira (opcional; preenche o local)</label>
          <select
            className="input"
            value={ev.venueId ?? ''}
            onChange={(e) => {
              const v = db.venues.find((x) => x.id === e.target.value)
              setEv({ ...ev, venueId: v?.id, location: v ? v.name : ev.location })
            }}
          >
            <option value="">Outro local / escrever à mão</option>
            {db.venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Local</label>
          <input className="input" required value={ev.location} onChange={(e) => set('location', e.target.value)} />
        </div>
      </div>
      <div className="grid-3">
        <div className="field">
          <label>Categoria</label>
          <select className="input" value={ev.category} onChange={(e) => set('category', e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Data</label>
          <input className="input" type="date" required value={ev.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Início</label>
            <input className="input" type="time" value={ev.start} onChange={(e) => set('start', e.target.value)} />
          </div>
          <div className="field">
            <label>Fim</label>
            <input className="input" type="time" value={ev.end} onChange={(e) => set('end', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="field">
        <label>Esta escola tem turmas?</label>
        <div className="seg" style={{ alignSelf: 'flex-start' }}>
          <button type="button" className={ev.hasClasses ? 'on' : ''} onClick={() => set('hasClasses', true)}>
            Sim
          </button>
          <button type="button" className={!ev.hasClasses ? 'on' : ''} onClick={() => set('hasClasses', false)}>
            Não
          </button>
        </div>
      </div>
      {ev.hasClasses && (
        <div className="field">
          <label>Lista de turmas</label>
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="chip" onClick={() => setClassesText(['A', 'B', 'C', 'D', 'E', 'F'].map((l) => `${ev.category === '9' ? '9' : '12'}.º ${l}`).join(', '))}>
              A a F
            </button>
            <button type="button" className="chip" onClick={() => setClassesText(['1', '2', '3', '4', '5', '6'].join(', '))}>
              1 a 6
            </button>
          </div>
          <textarea className="input" rows={2} value={classesText} onChange={(e) => setClassesText(e.target.value)} />
          <span className="small muted">Separa por vírgula ou por linha. Os participantes escolhem nesta lista.</span>
        </div>
      )}

      <div className="grid-2">
        <div className="field">
          <label>Nº de prestações</label>
          <select className="input" value={ev.installments.length} onChange={(e) => setN(+e.target.value)}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Comissão fixa por pessoa (€)</label>
          <input className="input" type="number" step="0.5" min="0" value={ev.commission} onChange={(e) => set('commission', +e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Valor e data-limite de cada prestação</label>
        {ev.installments.map((inst, i) => (
          <div key={i} className="row" style={{ flexWrap: 'nowrap' }}>
            <span style={{ width: 34 }}>{i + 1}.ª</span>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              placeholder="€"
              value={inst.amount || ''}
              onChange={(e) => set('installments', ev.installments.map((x, k) => (k === i ? { ...x, amount: +e.target.value } : x)))}
            />
            <input
              className="input"
              type="date"
              value={inst.due ?? ''}
              onChange={(e) => set('installments', ev.installments.map((x, k) => (k === i ? { ...x, due: e.target.value || undefined } : x)))}
            />
          </div>
        ))}
        <span className="small muted">Preço total por pessoa: {eur(total)}. A data-limite é opcional: sem data, a prestação nunca fica em atraso.</span>
      </div>
      <div className="field">
        <label>Limite de lotação (opcional)</label>
        <input className="input" type="number" min="0" value={ev.capacity ?? ''} onChange={(e) => set('capacity', e.target.value ? +e.target.value : undefined)} />
        <span className="small muted">Quando o limite é atingido, a inscrição com o código fecha sozinha.</span>
      </div>

      <div className="field">
        <label>Modalidades (opcional)</label>
        <span className="small muted">
          Ex.: «Só welcome drink» ou «Só jantar», com o preço total de cada uma. Sem modalidades, todos pagam o preço das prestações acima («Completo»).
        </span>
        <PriceList items={ev.modalities ?? []} onChange={(v) => set('modalities', v)} placeholder="Nome da modalidade" prefix="m" />
      </div>
      <div className="field">
        <label>Extras (opcional)</label>
        <span className="small muted">Ex.: after-party ou pack de fotografias. Somam ao preço; as prestações em falta atualizam-se sozinhas.</span>
        <PriceList items={ev.extras ?? []} onChange={(v) => set('extras', v)} placeholder="Nome do extra" prefix="x" />
      </div>
      <div className="field">
        <label>Quem se pode inscrever com o código</label>
        <div className="chips">
          {PTYPES.map((t) => {
            const on = (ev.signupTypes ?? DEFAULT_SIGNUP_TYPES).includes(t)
            return (
              <button
                type="button"
                key={t}
                className={`chip ${on ? 'on' : ''}`}
                onClick={() => {
                  const cur = ev.signupTypes ?? DEFAULT_SIGNUP_TYPES
                  const next = on ? cur.filter((x) => x !== t) : [...cur, t]
                  if (next.length) set('signupTypes', next)
                }}
              >
                {PTYPE_LONG[t]}
              </button>
            )
          })}
        </div>
        <span className="small muted">Os outros tipos (ex.: professores) só a organização adiciona, em «Adicionar pessoa».</span>
      </div>

      <div className="field">
        <label>Parceiros destacados (só a administração vê)</label>
        {PARTNER_TYPES.map((t) => (
          <div key={t} className="row small" style={{ gap: 6 }}>
            <span className="muted" style={{ width: 90 }}>
              {t}
            </span>
            {db.partners
              .filter((p) => p.type === t)
              .map((p) => {
                const on = ev.partners.some((x) => x.partnerId === p.id)
                return (
                  <button type="button" key={p.id} className={`chip ${on ? 'on' : ''}`} onClick={() => setPartner(p.id, !on)}>
                    {p.name}
                  </button>
                )
              })}
          </div>
        ))}
      </div>

      {!existing && (
        <div className="field">
          <label>Email do promotor chefe (para o login)</label>
          <input className="input" type="email" value={promoterEmail} onChange={(e) => setPromoterEmail(e.target.value)} placeholder="promotor@escola.pt" />
          <span className="small muted">É criada a conta com uma palavra-passe aleatória, que aparece quando criares o evento.</span>
        </div>
      )}

      <div className="grid-3">
        <div className="field">
          <label>Comercial 1</label>
          <select className="input" value={ev.comercial1} onChange={(e) => set('comercial1', e.target.value)}>
            <option value="">Escolher</option>
            {sellers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Comercial 2 (opcional)</label>
          <select className="input" value={ev.comercial2 ?? ''} onChange={(e) => set('comercial2', e.target.value || undefined)}>
            <option value="">Nenhum</option>
            {sellers
              .filter((u) => u.id !== ev.comercial1)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </div>
        <div className="field">
          <label>Parte do comercial 1 (%)</label>
          <input className="input" type="number" min="0" max="100" disabled={!ev.comercial2} value={ev.comercial2 ? ev.share1 : 100} onChange={(e) => set('share1', +e.target.value)} />
        </div>
      </div>
      {err && <div className="alert alert-err">{err}</div>}
      <button className="btn btn-gold" style={{ alignSelf: 'flex-start' }}>
        {existing ? 'Guardar alterações' : 'Criar evento'}
      </button>
    </form>
  )
}
