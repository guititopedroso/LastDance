// Dados da app. Toda a app lê e grava através deste ficheiro.
//
// Dois modos:
// - Demonstração (sem VITE_API_URL): tudo fica no browser (localStorage), com dados fictícios.
// - Servidor (VITE_API_URL=/api): os dados vêm da API PHP + MySQL da Hostinger.
//   Cada alteração é aplicada logo no ecrã e enviada ao servidor; sem internet fica numa fila
//   guardada no telemóvel e é enviada quando a ligação voltar. A cada 8 s vemos se alguém mudou algo.
import { useSyncExternalStore } from 'react'
import type { DB, LDEvent, Participant, ParticipantType, User } from './types'
import { buildSeed, uid } from './seed'

const API = ((import.meta.env.VITE_API_URL as string | undefined) || '').replace(/\/$/, '')
export const API_MODE = API !== ''

const DEMO_KEY = 'lastdance-db-v1'
const SESSION_KEY = 'lastdance-session'
const TOKEN_KEY = 'lastdance-token'
const CACHE_KEY = 'lastdance-cache'
const QUEUE_KEY = 'lastdance-queue'

const ls = {
  get(k: string) {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v)
    } catch {}
  },
  del(k: string) {
    try {
      localStorage.removeItem(k)
    } catch {}
  },
}
const parse = <T,>(s: string | null, fallback: T): T => {
  try {
    return s ? (JSON.parse(s) as T) : fallback
  } catch {
    return fallback
  }
}

const emptyDB = (): DB => ({ version: 1, users: [], events: [], participants: [], votes: [], venues: [], partners: [], expenses: [] })

let db: DB = API_MODE ? (ls.get(TOKEN_KEY) ? parse(ls.get(CACHE_KEY), emptyDB()) : emptyDB()) : parse(ls.get(DEMO_KEY), null as DB | null) ?? buildSeed()
let loaded = !API_MODE || (!!ls.get(TOKEN_KEY) && !!ls.get(CACHE_KEY))
let offline = false
let serverVersion = ''
let tick = 0
const listeners = new Set<() => void>()

function emit() {
  tick++
  listeners.forEach((l) => l())
}
function persist() {
  ls.set(API_MODE ? CACHE_KEY : DEMO_KEY, JSON.stringify(db))
}
/** Mostra uma mensagem (o Toaster ouve este evento). */
export function notify(m: string) {
  window.dispatchEvent(new CustomEvent('ld-toast', { detail: m }))
}

export function getDB() {
  return db
}

/** Altera os dados e notifica a interface. No modo servidor envia também as alterações. */
export function update(fn: (d: DB) => void) {
  const before = API_MODE ? structuredClone(db) : null
  fn(db)
  db = { ...db }
  persist()
  emit()
  if (before) {
    const ops = diff(before, db)
    if (ops.length) enqueue(ops)
  }
}

export function resetDemo() {
  if (API_MODE) return
  db = buildSeed()
  persist()
  emit()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useDB(): DB {
  useSyncExternalStore(subscribe, () => tick)
  return db
}

/** Estado da ligação ao servidor, para mostrar avisos. */
export function useSyncStatus() {
  useSyncExternalStore(subscribe, () => tick)
  return { loaded, offline, pending: queue.length }
}

// ---------- Diferenças → operações para o servidor ----------

type Row = Record<string, unknown>
export type Op = { t: string; op: 'upsert'; row: Row } | { t: string; op: 'delete'; id: string }

const ORDER = ['venues', 'partners', 'users', 'events', 'participants', 'payments', 'expenses', 'votes']

function diffList(t: string, a: Row[], b: Row[], key: (x: Row) => string, ups: Op[], dels: Op[]) {
  const A = new Map(a.map((x) => [key(x), x]))
  const B = new Map(b.map((x) => [key(x), x]))
  for (const [k, row] of B) {
    const old = A.get(k)
    if (!old || JSON.stringify(old) !== JSON.stringify(row)) ups.push({ t, op: 'upsert', row: { ...row, id: k } })
  }
  for (const k of A.keys()) if (!B.has(k)) dels.push({ t, op: 'delete', id: k })
}

function diff(a: DB, b: DB): Op[] {
  const ups: Op[] = []
  const dels: Op[] = []
  const id = (x: Row) => String(x.id)
  const noPay = (ps: Participant[]) => ps.map(({ payments, ...rest }) => rest as Row)
  const pays = (ps: Participant[]) => ps.flatMap((p) => p.payments.map((x) => ({ ...x, participantId: p.id }) as Row))
  diffList('venues', a.venues as unknown as Row[], b.venues as unknown as Row[], id, ups, dels)
  diffList('partners', a.partners as unknown as Row[], b.partners as unknown as Row[], id, ups, dels)
  diffList('users', a.users as unknown as Row[], b.users as unknown as Row[], id, ups, dels)
  diffList('events', a.events as unknown as Row[], b.events as unknown as Row[], id, ups, dels)
  diffList('participants', noPay(a.participants), noPay(b.participants), id, ups, dels)
  diffList('payments', pays(a.participants), pays(b.participants), id, ups, dels)
  diffList('expenses', a.expenses as unknown as Row[], b.expenses as unknown as Row[], id, ups, dels)
  diffList('votes', a.votes as unknown as Row[], b.votes as unknown as Row[], (v) => `${v.awardId}:${v.voterId}`, ups, dels)
  const rank = (o: Op) => ORDER.indexOf(o.t)
  ups.sort((x, y) => rank(x) - rank(y))
  dels.sort((x, y) => rank(y) - rank(x))
  // Primeiro apagamos (ex.: voto antigo), depois gravamos
  return [...dels, ...ups]
}

// ---------- Ligação à API ----------

class NetError extends Error {}
class AuthError extends Error {}
export class ApiError extends Error {
  constructor(
    msg: string,
    public status: number,
  ) {
    super(msg)
  }
}

const token = () => ls.get(TOKEN_KEY)

async function api<T = Record<string, unknown>>(route: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    const t = token()
    res = await fetch(`${API}/index.php?r=${route}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(t ? { 'X-Auth-Token': t } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new NetError('Sem ligação à internet.')
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (res.status === 401 && route !== 'login') throw new AuthError(data.error || 'Sessão terminada.')
  if (!res.ok) throw new ApiError(data.error || 'Erro no servidor. Tenta outra vez.', res.status)
  return data as T
}

let queue: Op[] = API_MODE ? parse(ls.get(QUEUE_KEY), [] as Op[]) : []
let flushing = false
let retryTimer = 0
let refreshTimer = 0

function saveQueue() {
  ls.set(QUEUE_KEY, JSON.stringify(queue))
}

function enqueue(ops: Op[]) {
  queue.push(...ops)
  saveQueue()
  emit()
  void flush()
}

async function flush() {
  if (!API_MODE || flushing || !queue.length || !token()) return
  flushing = true
  try {
    while (queue.length) {
      const batch = queue.slice(0, 400)
      const res = await api<{ errors: string[]; version: string }>('sync', { ops: batch })
      queue = queue.slice(batch.length)
      saveQueue()
      if (offline) {
        offline = false
        notify('Ligação recuperada. Alterações sincronizadas.')
      }
      if (res.errors?.length) notify(res.errors[0])
      emit()
    }
    scheduleRefresh(800)
  } catch (e) {
    if (e instanceof AuthError) return expire(e.message)
    if (e instanceof NetError) {
      offline = true
      emit()
    } else if (e instanceof ApiError) {
      // Pedido recusado por inteiro: descartamos este lote e repomos os dados do servidor.
      notify(e.message)
      queue = queue.slice(400)
      saveQueue()
      scheduleRefresh(0)
    }
    clearTimeout(retryTimer)
    retryTimer = window.setTimeout(() => void flush(), 8000)
  } finally {
    flushing = false
  }
}

function scheduleRefresh(ms: number) {
  clearTimeout(refreshTimer)
  refreshTimer = window.setTimeout(() => void refresh(), ms)
}

/** Vai buscar ao servidor tudo o que este perfil pode ver. */
export async function refresh() {
  if (!API_MODE || !token() || queue.length) return
  try {
    const res = await api<{ db: DB; version: string }>('bootstrap')
    if (queue.length) return // entretanto houve alterações locais; voltamos a tentar depois de as enviar
    db = res.db
    serverVersion = String(res.version)
    loaded = true
    offline = false
    persist()
    emit()
  } catch (e) {
    if (e instanceof AuthError) expire(e.message)
    else if (e instanceof NetError) {
      offline = true
      emit()
    }
  }
}

function expire(msg: string) {
  notify(msg)
  setSession(null)
}

if (API_MODE) {
  // Alguém mudou alguma coisa? Vemos a "versão" (pedido minúsculo) e só então recarregamos.
  window.setInterval(async () => {
    if (!token() || document.hidden || queue.length) return
    try {
      const r = await api<{ version: string }>('version')
      if (String(r.version) !== serverVersion) scheduleRefresh(0)
      if (offline) {
        offline = false
        emit()
      }
    } catch {}
  }, 8000)
  window.addEventListener('online', () => void flush())
  window.addEventListener('focus', () => (queue.length ? void flush() : scheduleRefresh(300)))
  if (token()) {
    void flush()
    scheduleRefresh(0)
  }
}

// ---------- Sessão ----------

export type Session = { kind: 'user'; id: string } | { kind: 'participant'; id: string } | null

let session: Session = parse(ls.get(SESSION_KEY), null as Session)

export function setSession(s: Session) {
  session = s
  ls.set(SESSION_KEY, JSON.stringify(s))
  if (!s && API_MODE) {
    const t = token()
    if (t) void fetch(`${API}/index.php?r=logout`, { method: 'POST', headers: { 'X-Auth-Token': t } }).catch(() => {})
    ls.del(TOKEN_KEY)
    ls.del(CACHE_KEY)
    queue = []
    saveQueue()
    db = emptyDB()
    loaded = false
  }
  emit()
}

export function useSession(): { user?: User; participant?: Participant } {
  const d = useDB()
  if (!session) return {}
  if (session.kind === 'user') return { user: d.users.find((u) => u.id === session!.id) }
  return { participant: d.participants.find((p) => p.id === session!.id) }
}

export const hasSession = () => !!session && (!API_MODE || !!token())

export async function login(email: string, password: string): Promise<Session> {
  if (!API_MODE) {
    const e = email.trim().toLowerCase()
    const u = db.users.find((x) => x.email.toLowerCase() === e && x.password === password)
    if (u) return { kind: 'user', id: u.id }
    const p = db.participants.find((x) => x.email.toLowerCase() === e && x.password === password)
    if (p) return { kind: 'participant', id: p.id }
    return null
  }
  try {
    const res = await api<{ token: string; session: Session }>('login', { email, password })
    ls.set(TOKEN_KEY, res.token)
    session = res.session
    ls.set(SESSION_KEY, JSON.stringify(res.session))
    loaded = false
    await refresh()
    return res.session
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null
    throw e
  }
}

// ---------- Inscrição pública ----------

export interface RegisterData {
  name: string
  birth: string
  phone: string
  email: string
  type: ParticipantType
  turma?: string
  password: string
  diet: string
  health?: string
}

export async function findEventByCode(code: string): Promise<{ event: LDEvent; full: boolean } | null> {
  if (!API_MODE) {
    const ev = db.events.find((x) => x.code.toLowerCase() === code.trim().toLowerCase() && !x.archived)
    if (!ev) return null
    const count = db.participants.filter((p) => p.eventId === ev.id).length
    return { event: ev, full: !!ev.capacity && count >= ev.capacity }
  }
  try {
    const r = await api<{ event: LDEvent & { full: boolean } }>(`event&code=${encodeURIComponent(code.trim())}`)
    return { event: r.event, full: r.event.full }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

/** Cria a inscrição e entra logo na área do participante. Lança um erro com a mensagem a mostrar. */
export async function registerParticipant(ev: LDEvent, f: RegisterData): Promise<void> {
  if (!API_MODE) {
    if (db.participants.some((p) => p.eventId === ev.id && p.email.toLowerCase() === f.email.toLowerCase()))
      throw new Error('Já existe uma inscrição com este email neste evento. Faz log-in para entrares na tua área.')
    const id = 'p' + uid()
    update((d) => {
      d.participants.push({
        ...f,
        id,
        eventId: ev.id,
        name: f.name.trim(),
        email: f.email.trim(),
        turma: f.turma || undefined,
        health: f.health || undefined,
        consent: true,
        createdAt: new Date().toISOString(),
        offer: false,
        payments: [],
        qr: `LD-${ev.code}-${id.toUpperCase()}`,
      })
    })
    setSession({ kind: 'participant', id })
    return
  }
  const res = await api<{ token: string; session: Session }>('register', { ...f, code: ev.code, consent: true })
  ls.set(TOKEN_KEY, res.token)
  session = res.session
  ls.set(SESSION_KEY, JSON.stringify(res.session))
  loaded = false
  emit()
  await refresh()
}

// ---------- Dados de demonstração no servidor ----------

const DEMO = 'demo-'

/** Copia os dados fictícios para a base de dados (tudo com o prefixo demo-, para se poder apagar depois). */
export function importDemoData() {
  const s = buildSeed()
  const P = (id?: string) => (id ? DEMO + id : id)
  const emails = new Set(db.users.map((u) => u.email.toLowerCase()))
  update((d) => {
    d.venues.push(...s.venues.map((v) => ({ ...v, id: P(v.id)! })))
    d.partners.push(...s.partners.map((v) => ({ ...v, id: P(v.id)! })))
    d.users.push(
      ...s.users
        .filter((u) => !emails.has(u.email.toLowerCase()))
        .map((u) => ({ ...u, id: P(u.id)!, eventId: P(u.eventId), staffEventIds: u.staffEventIds?.map((x) => P(x)!) })),
    )
    d.events.push(
      ...s.events.map((e) => ({ ...e, id: P(e.id)!, venueId: P(e.venueId), comercial1: P(e.comercial1)!, comercial2: P(e.comercial2), partners: e.partners.map((x) => ({ ...x, partnerId: P(x.partnerId)! })) })),
    )
    d.participants.push(
      ...s.participants.map((p) => ({
        ...p,
        id: P(p.id)!,
        eventId: P(p.eventId)!,
        qr: DEMO.toUpperCase() + p.qr,
        enteredBy: P(p.enteredBy),
        payments: p.payments.map((x) => ({ ...x, id: P(x.id)!, receivedBy: x.receivedBy ? P(x.receivedBy)! : null })),
      })),
    )
    d.expenses.push(...s.expenses.map((x) => ({ ...x, id: P(x.id)!, paidBy: x.paidBy === 'empresa' ? 'empresa' : P(x.paidBy)! })))
  })
}

export const hasDemoData = (d: DB) => d.events.some((e) => e.id.startsWith(DEMO)) || d.users.some((u) => u.id.startsWith(DEMO))

export function removeDemoData() {
  const keep = <T extends { id: string }>(a: T[]) => a.filter((x) => !x.id.startsWith(DEMO))
  update((d) => {
    d.venues = keep(d.venues)
    d.partners = keep(d.partners)
    d.users = keep(d.users)
    d.events = keep(d.events)
    d.participants = keep(d.participants)
    d.expenses = keep(d.expenses)
    d.votes = d.votes.filter((v) => !v.eventId.startsWith(DEMO))
  })
}
