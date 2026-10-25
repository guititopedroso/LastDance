// Dados fictícios de demonstração. Substituídos pela base de dados real mais tarde.
import type { Award, DB, LDEvent, Participant, ParticipantType, Payment, Table, Category } from './types'

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
