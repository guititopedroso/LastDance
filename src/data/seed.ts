// Dados fictícios de demonstração. Substituídos pela base de dados real mais tarde.
import type { Award, DB, LDEvent, Participant, ParticipantType, Payment, Table, Category } from './types'
import { eventPrice, recalcAmounts } from './logic'

let seed = 20260
function rnd() {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)]
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
let n = 0
const sid = (p: string) => `${p}${(++n).toString(36)}`

const FIRST = ['Afonso', 'Alice', 'Ana', 'André', 'Beatriz', 'Bruno', 'Carolina', 'Catarina', 'Diana', 'Diogo', 'Duarte', 'Filipa', 'Francisco', 'Gonçalo', 'Guilherme', 'Hugo', 'Inês', 'Íris', 'Joana', 'João', 'Laura', 'Leonor', 'Lucas', 'Mafalda', 'Margarida', 'Maria', 'Mariana', 'Marta', 'Martim', 'Matilde', 'Miguel', 'Pedro', 'Rafael', 'Rita', 'Rodrigo', 'Rui', 'Salvador', 'Santiago', 'Sara', 'Sofia', 'Tiago', 'Tomás', 'Vasco']
const LAST = ['Almeida', 'Antunes', 'Azevedo', 'Barbosa', 'Cardoso', 'Carvalho', 'Coelho', 'Correia', 'Costa', 'Cunha', 'Dias', 'Faria', 'Fernandes', 'Ferreira', 'Gomes', 'Lopes', 'Marques', 'Martins', 'Matos', 'Mendes', 'Monteiro', 'Moura', 'Nunes', 'Oliveira', 'Pereira', 'Pinto', 'Pires', 'Ramos', 'Reis', 'Rocha', 'Santos', 'Silva', 'Sousa', 'Tavares', 'Teixeira', 'Vieira']
const DIET_POOL = ['Nenhuma', 'Nenhuma', 'Nenhuma', 'Nenhuma', 'Nenhuma', 'Nenhuma', 'Vegetariano', 'Alérgico à lactose', 'Celíaco', 'Vegan']

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function buildSeed(): DB {
  n = 0
  seed = 20260

  const users: DB['users'] = [
    { id: 'u-admin1', name: 'Ricardo Almeida', email: 'admin@lastdance.pt', password: 'demo1234', role: 'admin', isPartner: true },
    { id: 'u-admin2', name: 'João Ferreira', email: 'joao@lastdance.pt', password: 'demo1234', role: 'admin', isPartner: true },
    { id: 'u-admin3', name: 'Miguel Santos', email: 'miguel@lastdance.pt', password: 'demo1234', role: 'admin', isPartner: true },
    { id: 'u-com1', name: 'Tiago Costa', email: 'comercial@lastdance.pt', password: 'demo1234', role: 'comercial' },
    { id: 'u-com2', name: 'Carolina Reis', email: 'carolina@lastdance.pt', password: 'demo1234', role: 'comercial' },
    { id: 'u-staff1', name: 'Marta Lopes', email: 'staff@lastdance.pt', password: 'demo1234', role: 'staff', staffEventIds: [] },
  ]
  const sellers = ['u-admin1', 'u-admin2', 'u-admin3', 'u-com1', 'u-com2']

  const venues: DB['venues'] = [
    ['Quinta do Peru, Azeitão', 42, 150, 400],
    ['Convento do Beato, Lisboa', 55, 200, 600],
    ['Quinta da Valenciana, Palmela', 39, 120, 300],
    ['Pavilhão Atlântico (Sala Tejo)', 48, 250, 800],
    ['Quinta de São Gonçalo, Alcochete', 40, 100, 280],
    ['Hotel Myriad, Lisboa', 58, 120, 350],
    ['Casa do Marquês, Setúbal', 44, 100, 250],
    ['Quinta Velha, Sesimbra', 37, 90, 220],
    ['Palácio do Grilo, Lisboa', 62, 150, 400],
    ['Herdade da Comporta (Salão)', 50, 130, 300],
  ].map(([name, c, m, cap]) => ({ id: sid('v'), name: name as string, costPerPerson: c as number, minimum: m as number, capacity: cap as number }))

  const partners: DB['partners'] = (
    [
      ['DJ', 'DJ Kura', 450], ['DJ', 'DJ Sav', 400], ['DJ', 'DJ Nuno Luz', 420], ['DJ', 'DJ Wilson', 380],
      ['Videógrafo', 'Frame Films', 320], ['Videógrafo', 'Lumen Studio', 300],
      ['Fotógrafo', 'Sofia Lens', 260], ['Fotógrafo', 'Flash Moments', 240], ['Fotógrafo', 'Pedro Clicks', 250],
      ['Som', 'SoundPro Setúbal', 480], ['Som', 'Equipa LastDance', 350],
    ] as const
  ).map(([type, name, baseCost]) => ({ id: sid('pa'), type, name, baseCost }))

  const schools: [string, string, Category, string][] = [
    ['Baile de finalistas · Escola Secundária de Alcochete', 'ALCOCHETE26', '12', '2027-05-08'],
    ['Baile de finalistas · Escola Secundária Augusto Cabrita', 'CABRITA26', '12', '2027-05-15'],
    ['Baile de finalistas · Escola Secundária de Santo André', 'SANTOANDRE26', '12', '2027-05-22'],
    ['Baile de finalistas · Egas Moniz', 'EGASMONIZ26', 'uni', '2027-04-24'],
    ['Baile de finalistas · Escola Secundária Casquilhos', 'CASQUILHOS26', '12', '2027-05-29'],
    ['Baile de finalistas · Instituto Politécnico de Setúbal', 'IPS26', 'uni', '2027-06-05'],
    ['Jantar de gala · 12.º D Escola Sec. da Moita', 'MOITA26', '12', '2027-03-13'],
    ['Baile 9.º ano · Escola Básica do Montijo', 'MONTIJO9', '9', '2027-06-19'],
    ['Baile 9.º ano · Escola Básica de Palmela', 'PALMELA9', '9', '2027-06-26'],
    ['Baile de finalistas · Escola Secundária do Barreiro', 'BARREIRO26', '12', '2027-07-03'],
  ]

  const events: LDEvent[] = []
  const participants: Participant[] = []

  schools.forEach(([name, code, category, date], i) => {
    const venue = venues[i % venues.length]
    const nInst = int(2, 4)
    const total = pick([65, 70, 75, 80, 85, 90])
    const per = Math.floor((total / nInst) * 100) / 100
    const d = new Date(date)
    const installments = Array.from({ length: nInst }, (_, k) => {
      const due = new Date(d)
      due.setMonth(due.getMonth() - (nInst - k) * 2 - 1)
      due.setDate(15)
      const amount = k === nInst - 1 ? Math.round((total - per * (nInst - 1)) * 100) / 100 : per
      return { amount, due: due.toISOString().slice(0, 10) }
    })
    const hasClasses = category !== 'uni' && rnd() > 0.3
    const classes = hasClasses ? (category === '9' ? ['9.º A', '9.º B', '9.º C', '9.º D'] : ['12.º A', '12.º B', '12.º C', '12.º D', '12.º E', '12.º F']) : []
    const c1 = pick(sellers)
    const split = rnd() > 0.75
    const c2 = split ? pick(sellers.filter((s) => s !== c1)) : undefined
    const awards: Award[] = ['Rei do Baile', 'Rainha do Baile', 'Melhor Outfit'].map((a) => ({ id: sid('aw'), name: a, eligible: null }))
    const nTables = i === 1 ? 20 : int(0, 1) ? 0 : int(5, 12)
    const tables: Table[] = Array.from({ length: nTables }, (_, k) => ({ id: sid('t'), name: `Mesa ${k + 1}`, seats: 10 }))
    const evPartners = (['DJ', 'Videógrafo', 'Fotógrafo', 'Som'] as const).map((t) => ({ partnerId: pick(partners.filter((p) => p.type === t)).id }))
    const ev: LDEvent = {
      id: sid('e'),
      name,
      code,
      venueId: venue.id,
      location: venue.name,
      category,
      date,
      start: name.startsWith('Jantar') ? '19:30' : '20:00',
      end: name.startsWith('Jantar') ? '00:00' : '04:00',
      hasClasses,
      classes,
      installments,
      commission: pick([6, 7, 8, 9]),
      capacity: undefined,
      partners: evPartners,
      comercial1: c1,
      comercial2: c2,
      share1: c2 ? pick([50, 60]) : 100,
      archived: false,
      votingMode: 'auto',
      awards,
      announced: false,
      tables,
    }
    events.push(ev)

    // Promotores do evento
    const slug = code.toLowerCase()
    const chief = { id: sid('u'), name: `${pick(FIRST)} ${pick(LAST)}`, email: `promotor.${slug}@exemplo.pt`, password: 'demo1234', role: 'promotor_chefe' as const, eventId: ev.id }
    const team = Array.from({ length: int(0, 2) }, () => {
      const f = pick(FIRST)
      const l = pick(LAST)
      return { id: sid('u'), name: `${f} ${l}`, email: `${strip(f)}.${strip(l)}.${slug}@exemplo.pt`, password: 'demo1234', role: 'promotor' as const, eventId: ev.id }
    })
    if (i === 1) {
      chief.name = 'Inês Duarte'
      chief.email = 'promotor@lastdance.pt'
      team.length = 0
      team.push({ id: 'u-prom-team', name: 'Rui Santos', email: 'equipa@lastdance.pt', password: 'demo1234', role: 'promotor', eventId: ev.id })
    }
    users.push(chief, ...team)
    const receivers = [chief.id, ...team.map((t) => t.id)]

    const count = category === '9' ? int(50, 110) : category === 'uni' ? int(60, 160) : int(90, 220)
    const seatsLeft = new Map(tables.map((t) => [t.id, t.seats]))
    for (let k = 0; k < count; k++) {
      const f = pick(FIRST)
      const l1 = pick(LAST)
      const l2 = pick(LAST)
      const type: ParticipantType = rnd() < 0.8 ? 'finalista' : rnd() < 0.6 ? 'nao_finalista' : 'externo'
      const offer = rnd() < 0.012
      const progress = rnd()
      const payments: Payment[] = []
      if (!offer) {
        installments.forEach((inst, idx) => {
          const due = inst.due ? new Date(inst.due) : null
          const past = due ? due.getTime() < Date.now() : false
          const chance = past ? 0.62 : 0.18
          if (progress < chance + idx * -0.06 + 0.05) {
            const partial = rnd() < 0.05
            const amount = partial ? Math.round(inst.amount * 0.6) : inst.amount
            const by = rnd() < 0.5 ? null : pick(receivers)
            const at = new Date((due ?? new Date()).getTime() - int(1, 40) * 864e5).toISOString()
            payments.push({ id: sid('pg'), installment: idx, amount, receivedBy: by, at, kind: 'payment' })
          }
        })
      }
      let tableId: string | undefined
      if (tables.length && rnd() < 0.7) {
        const free = tables.find((t) => (seatsLeft.get(t.id) ?? 0) > 0)
        if (free) {
          tableId = free.id
          seatsLeft.set(free.id, (seatsLeft.get(free.id) ?? 0) - 1)
        }
      }
      const pid = sid('p')
      participants.push({
        id: pid,
        eventId: ev.id,
        name: `${f} ${l1} ${l2}`,
        birth: `${category === '9' ? 2012 : category === 'uni' ? 2004 : 2009}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
        phone: `9${pick(['1', '2', '3', '6'])}${int(1000000, 9999999)}`,
        email: `${strip(f)}.${strip(l1)}${int(1, 99)}@exemplo.pt`,
        password: 'demo1234',
        type,
        turma: hasClasses && type === 'finalista' ? pick(classes) : undefined,
        diet: pick(DIET_POOL),
        consent: rnd() < 0.5 ? true : null,
        createdAt: new Date(Date.now() - int(1, 120) * 864e5).toISOString(),
        offer,
        tableId,
        payments,
        qr: `LD-${code}-${pid.toUpperCase()}`,
      })
    }
  })

  // Participante de demonstração com conta conhecida
  const demoEv = events[1]
  const demo = participants.find((p) => p.eventId === demoEv.id && !p.offer)!
  demo.name = 'Marta Cunha Moura'
  demo.email = 'aluno@lastdance.pt'
  demo.type = 'finalista'
  demo.turma = demoEv.hasClasses ? demoEv.classes[2] : undefined
  demo.payments = demoEv.installments.slice(0, demoEv.installments.length - 1).map((inst, idx) => ({
    id: sid('pg'),
    installment: idx,
    amount: inst.amount,
    receivedBy: 'u-prom-team',
    at: new Date(Date.now() - (40 - idx * 10) * 864e5).toISOString(),
    kind: 'payment',
  }))
  if (demoEv.tables.length) demo.tableId = demoEv.tables[0].id

  // ---------- Casos de demonstração (como na demo do Epic Living) ----------
  const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 864e5).toISOString()
  const payAll = (p: Participant, ev: LDEvent, by: string | null, upTo = ev.installments.length) => {
    p.payments = ev.installments.slice(0, upTo).map((_, i) => ({
      id: sid('pg'),
      installment: i,
      amount: p.customAmounts?.[i] ?? ev.installments[i].amount,
      receivedBy: by,
      at: iso(60 - i * 12),
      kind: 'payment' as const,
    }))
  }
  const takeFrom = (ev: LDEvent, skip: (p: Participant) => boolean = () => false) => {
    const p = participants.find((x) => x.eventId === ev.id && !x.offer && !x.cancelledAt && !x.customAmounts && !x.email.endsWith('@lastdance.pt') && !skip(x))!
    p.payments = []
    p.offer = false
    return p
  }
  const named = (p: Participant, name: string, email: string) => {
    p.name = name
    p.email = email
    p.password = 'demo1234'
    p.type = 'finalista'
    return p
  }

  // Telemóvel dos promotores chefe (o aluno vê o contacto do seu promotor)
  users.filter((u) => u.role === 'promotor_chefe').forEach((u) => (u.phone = `91${int(1000000, 9999999)}`))

  // 9.º ano: encarregado de educação
  events
    .filter((e) => e.category === '9')
    .forEach((e) =>
      participants
        .filter((p) => p.eventId === e.id)
        .forEach((p) => {
          p.guardianName = `${pick(FIRST)} ${p.name.split(' ').slice(-1)[0]}`
          p.guardianPhone = `9${pick(['1', '2', '3', '6'])}${int(1000000, 9999999)}`
        }),
    )

  // Modalidades e extras no evento principal de demonstração
  demoEv.modalities = [
    { id: 'm-welcome', name: 'Só welcome drink', price: 25 },
    { id: 'm-jantar', name: 'Só jantar', price: 45 },
  ]
  demoEv.extras = [
    { id: 'x-after', name: 'After-party', price: 10 },
    { id: 'x-fotos', name: 'Pack de fotografias', price: 15 },
  ]
  // Alguns inscritos já com escolhas
  participants
    .filter((p) => p.eventId === demoEv.id && !p.email.endsWith('@lastdance.pt'))
    .slice(5, 25)
    .forEach((p, k) => {
      const mod = k % 5 === 0 ? 'm-jantar' : undefined
      const ext = k % 2 ? ['x-after'] : ['x-fotos']
      p.customAmounts = recalcAmounts(p, demoEv, mod, ext)
      p.modalityId = mod
      p.extras = ext
    })

  // Professores adicionados pelo promotor
  const chiefDemo = users.find((u) => u.eventId === demoEv.id && u.role === 'promotor_chefe')!
  ;['Prof.ª Helena Matos', 'Prof. Carlos Teixeira'].forEach((name, k) => {
    const id = sid('p')
    participants.push({
      id, eventId: demoEv.id, name, birth: k ? '1975-03-02' : '1981-11-20', phone: `96${int(1000000, 9999999)}`, email: '', password: '',
      type: 'professor', diet: 'Nenhuma', consent: null, createdAt: iso(20), offer: k === 0, payments: [], qr: `LD-${demoEv.code}-${id.toUpperCase()}`, addedBy: chiefDemo.id,
    })
  })

  // Cancelamentos e devoluções em vários eventos
  events.slice(0, 6).forEach((ev, k) => {
    participants
      .filter((p) => p.eventId === ev.id && p.payments.length && !p.email.endsWith('@lastdance.pt'))
      .slice(0, k % 3 === 0 ? 3 : 2)
      .forEach((p, j) => {
        const paid = p.payments.reduce((a, x) => a + x.amount, 0)
        p.cancelledAt = iso(10 + j * 7)
        p.cancelReason = pick(['Desistência', 'Mudou de escola', 'Motivos de saúde', 'Viagem marcada'])
        p.refundDue = Math.round(paid * (j % 2 ? 0.5 : 1) * 100) / 100
        p.tableId = undefined
        if (j === 0) p.payments.push({ id: sid('pg'), installment: -1, amount: p.refundDue, receivedBy: null, at: iso(5), kind: 'refund' })
      })
  })

  // --- Contas de demonstração ---
  const pago = named(takeFrom(demoEv), 'Bruno Ferreira Lopes', 'pago@lastdance.pt')
  payAll(pago, demoEv, chiefDemo.id)
  if (demoEv.tables.length) pago.tableId = demoEv.tables[0].id

  named(takeFrom(demoEv), 'Diana Rocha Gomes', 'atraso@lastdance.pt') // nada pago; a 1.ª prestação já passou da data

  const extras = named(takeFrom(demoEv), 'Gonçalo Pires Antunes', 'extras@lastdance.pt')
  extras.customAmounts = recalcAmounts(extras, demoEv, undefined, ['x-after', 'x-fotos'])
  extras.extras = ['x-after', 'x-fotos']
  payAll(extras, demoEv, 'u-prom-team', 1)
  extras.customAmounts = recalcAmounts(extras, demoEv, undefined, ['x-after', 'x-fotos'])

  const canc = named(takeFrom(demoEv), 'Sara Nunes Correia', 'cancelado@lastdance.pt')
  payAll(canc, demoEv, chiefDemo.id, 1)
  canc.cancelledAt = iso(8)
  canc.cancelReason = 'Desistência'
  canc.refundDue = 20
  canc.payments.push({ id: sid('pg'), installment: -1, amount: 10, receivedBy: chiefDemo.id, at: iso(3), kind: 'refund' })

  const oferta = named(takeFrom(demoEv), 'Leonor Dias Moura', 'oferta@lastdance.pt')
  oferta.offer = true

  const ev9 = events.find((e) => e.category === '9')!
  const menor = named(takeFrom(ev9), 'Tomás Ramos Silva', 'menor@lastdance.pt')
  menor.birth = '2012-09-14'
  menor.guardianName = 'Paula Ramos'
  menor.guardianPhone = '912345678'
  payAll(menor, ev9, null)

  // Dois eventos com o mesmo email, e um email que é promotor e aluno
  const ev2 = events[0]
  named(takeFrom(demoEv), 'Rita Almeida Santos', 'varios@lastdance.pt')
  payAll(named(takeFrom(ev2), 'Rita Almeida Santos', 'varios@lastdance.pt'), ev2, null, 1)
  named(takeFrom(demoEv), 'Duarte Costa Faria', 'duplo@lastdance.pt')
  users.push({ id: 'u-duplo', name: 'Duarte Costa Faria', email: 'duplo@lastdance.pt', password: 'demo1234', role: 'promotor', eventId: ev2.id })

  users.push({ id: 'u-staff2', name: 'Pedro Silva', email: 'staff2@lastdance.pt', password: 'demo1234', role: 'staff', staffEventIds: [demoEv.id] })

  // Evento já realizado (com vencedores anunciados)
  const pastVenue = venues[6]
  const past: LDEvent = {
    id: sid('e'), name: 'Baile de finalistas 2026 · Escola Secundária da Baixa da Banheira', code: 'BANHEIRA26', venueId: pastVenue.id, location: pastVenue.name,
    category: '12', date: '2026-06-20', start: '20:00', end: '04:00', hasClasses: false, classes: [],
    installments: [{ amount: 35, due: '2026-03-15' }, { amount: 35, due: '2026-05-15' }], commission: 7, partners: [], comercial1: 'u-admin1', share1: 100,
    archived: false, votingMode: 'closed', awards: ['Rei do Baile', 'Rainha do Baile', 'Melhor Outfit'].map((name) => ({ id: sid('aw'), name, eligible: null })), announced: true,
    tables: Array.from({ length: 4 }, (_, k) => ({ id: sid('t'), name: `Mesa ${k + 1}`, seats: 10 })),
  }
  events.push(past)
  users.push({ id: sid('u'), name: 'Hugo Martins', email: 'promotor.banheira26@exemplo.pt', password: 'demo1234', role: 'promotor_chefe', eventId: past.id, phone: '913456789' })
  for (let k = 0; k < 38; k++) {
    const id = sid('p')
    const f = pick(FIRST)
    const pp: Participant = {
      id, eventId: past.id, name: `${f} ${pick(LAST)} ${pick(LAST)}`, birth: '2008-05-10', phone: `93${int(1000000, 9999999)}`, email: `${strip(f)}.${int(100, 999)}@exemplo.pt`,
      password: 'demo1234', type: 'finalista', diet: pick(DIET_POOL), consent: true, createdAt: iso(300), offer: false, payments: [], qr: `LD-BANHEIRA26-${id.toUpperCase()}`,
      tableId: past.tables[k % 4].id, enteredAt: '2026-06-20T19:' + String(10 + (k % 50)).padStart(2, '0') + ':00.000Z',
    }
    payAll(pp, past, null)
    participants.push(pp)
  }
  const pastPs = participants.filter((x) => x.eventId === past.id)
  named(pastPs[0], 'Inês Barbosa Reis', 'realizado@lastdance.pt')
  past.awards.forEach((a, k) => (a.winnerId = pastPs[k + 1].id))

  // Evento esgotado, com votação aberta agora
  const soldVenue = venues[5]
  const sold: LDEvent = {
    id: sid('e'), name: 'Jantar de gala · Curso de Turismo da ETP Sesimbra', code: 'ESGOTADO26', venueId: soldVenue.id, location: soldVenue.name,
    category: 'outro', date: new Date().toISOString().slice(0, 10), start: '19:30', end: '23:59', hasClasses: false, classes: [],
    installments: [{ amount: 30, due: '2026-09-30' }, { amount: 30, due: '2026-10-20' }], commission: 6, partners: [], comercial1: 'u-com1', share1: 100,
    archived: false, votingMode: 'open', awards: ['Melhor Outfit', 'Mais Divertido'].map((name) => ({ id: sid('aw'), name, eligible: null })), announced: false,
    tables: Array.from({ length: 3 }, (_, k) => ({ id: sid('t'), name: `Mesa ${k + 1}`, seats: 10 })), capacity: 30,
  }
  events.push(sold)
  users.push({ id: sid('u'), name: 'Joana Lima', email: 'promotor.esgotado26@exemplo.pt', password: 'demo1234', role: 'promotor_chefe', eventId: sold.id, phone: '914567890' })
  for (let k = 0; k < 30; k++) {
    const id = sid('p')
    const f = pick(FIRST)
    const pp: Participant = {
      id, eventId: sold.id, name: `${f} ${pick(LAST)} ${pick(LAST)}`, birth: '2007-02-02', phone: `93${int(1000000, 9999999)}`, email: `${strip(f)}.${int(100, 999)}@exemplo.pt`,
      password: 'demo1234', type: 'finalista', diet: pick(DIET_POOL), consent: true, createdAt: iso(90), offer: false, payments: [], qr: `LD-ESGOTADO26-${id.toUpperCase()}`,
      tableId: sold.tables[k % 3].id,
    }
    payAll(pp, sold, null, k % 4 === 0 ? 1 : 2)
    participants.push(pp)
  }
  named(participants.filter((x) => x.eventId === sold.id && x.payments.length === 2)[0], 'Mafalda Sousa Pinto', 'votacao@lastdance.pt')
  void eventPrice

  const expenses: DB['expenses'] = [
    ['Portagens — visitas a escolas', 'Deslocações', 22.4, '2026-10-03', 'u-admin1', false],
    ['Impressão de cartazes', 'Marketing', 47.8, '2026-09-28', 'u-admin2', false],
    ['Decoração para mesas (velas e centros)', 'Material', 210, '2026-09-21', 'u-admin2', true],
    ['Domínio e alojamento do site', 'Software', 120, '2026-09-15', 'empresa', true],
    ['Gasolina — visitas a escolas', 'Deslocações', 64.5, '2026-09-10', 'u-admin1', false],
    ['Cartões de visita e flyers', 'Marketing', 85, '2026-09-02', 'empresa', true],
  ].map(([description, category, amount, date, paidBy, reimbursed]) => ({
    id: sid('x'),
    description: description as string,
    category: category as string,
    amount: amount as number,
    date: date as string,
    paidBy: paidBy as string,
    reimbursed: reimbursed as boolean,
  }))

  return { version: 1, users, events, participants, votes: [], venues, partners, expenses }
}
