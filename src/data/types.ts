// Modelo de dados da plataforma LastDance.
// Quando ligarmos a base de dados, cada interface corresponde a uma tabela.

export type Role = 'admin' | 'comercial' | 'promotor_chefe' | 'promotor' | 'staff' | 'participante'

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  comercial: 'Comercial',
  promotor_chefe: 'Promotor chefe',
  promotor: 'Promotor',
  staff: 'Staff',
  participante: 'Participante',
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Exclude<Role, 'participante'>
  /** Sócio: a comissão dele fica na empresa em vez de ser paga. */
  isPartner?: boolean
  /** Evento do promotor (chefe ou da equipa). */
  eventId?: string
  /** Staff: eventos a que tem acesso. Vazio = todos. */
  staffEventIds?: string[]
  /** Telemóvel (o aluno vê o do promotor chefe do seu evento) */
  phone?: string
}

export type Category = '12' | '9' | 'uni' | 'outro'
export const CATEGORIES: Category[] = ['12', '9', 'uni', 'outro']
export const CATEGORY_LABEL: Record<Category, string> = {
  '12': '12.º ano',
  '9': '9.º ano',
  uni: 'Universitário',
  outro: 'Outro',
}

export interface Installment {
  amount: number
  /** yyyy-mm-dd; sem data nunca fica em atraso */
  due?: string
}

export interface EventPartner {
  partnerId: string
  /** Valor ajustado só para este evento */
  cost?: number
}

export interface Award {
  id: string
  name: string
  /** null = qualquer participante com tudo pago */
  eligible: string[] | null
  /** Com eligible = null: todos menos estes */
  excluded?: string[]
  winnerId?: string
}

export interface Table {
  id: string
  name: string
  seats: number
}

export type VotingMode = 'auto' | 'open' | 'closed' | 'none'

/** Modalidade (ex.: Completo, Só welcome drink, Só jantar): substitui o preço base. */
export interface Modality {
  id: string
  name: string
  price: number
}
/** Extra opcional (ex.: after-party, pack de fotografias): soma ao preço. */
export interface Extra {
  id: string
  name: string
  price: number
}

export interface LDEvent {
  id: string
  name: string
  code: string
  venueId?: string
  location: string
  category: Category
  date: string
  start: string
  end: string
  hasClasses: boolean
  classes: string[]
  installments: Installment[]
  commission: number
  capacity?: number
  partners: EventPartner[]
  comercial1: string
  comercial2?: string
  /** Parte do comercial 1 em % (o resto é do comercial 2) */
  share1: number
  archived: boolean
  votingMode: VotingMode
  awards: Award[]
  announced: boolean
  tables: Table[]
  /** Vazio = preço único (soma das prestações) */
  modalities?: Modality[]
  extras?: Extra[]
  /** Tipos que se podem inscrever sozinhos com o código (os outros só a organização adiciona) */
  signupTypes?: ParticipantType[]
}

export type ParticipantType = 'finalista' | 'nao_finalista' | 'externo' | 'professor' | 'convidado'
export const PTYPES: ParticipantType[] = ['finalista', 'nao_finalista', 'externo', 'professor', 'convidado']
export const DEFAULT_SIGNUP_TYPES: ParticipantType[] = ['finalista', 'nao_finalista', 'externo']
export const PTYPE_LABEL: Record<ParticipantType, string> = {
  finalista: 'Finalista',
  nao_finalista: 'Não finalista',
  externo: 'Externo',
  professor: 'Professor',
  convidado: 'Convidado',
}
export const PTYPE_LONG: Record<ParticipantType, string> = {
  finalista: 'Finalista',
  nao_finalista: 'Não finalista',
  externo: 'Aluno externo/acompanhante',
  professor: 'Professor',
  convidado: 'Convidado / família',
}

export const DIETS = ['Nenhuma', 'Vegetariano', 'Vegan', 'Alérgico à lactose', 'Celíaco', 'Outra'] as const

export interface Payment {
  id: string
  installment: number
  amount: number
  /** id do utilizador que recebeu; null = pago antes do registo */
  receivedBy: string | null
  at: string
  /** adjust = diferença perdoada · refund = devolução (installment -1) */
  kind: 'payment' | 'adjust' | 'refund'
}

export interface Participant {
  id: string
  eventId: string
  name: string
  birth: string
  phone: string
  email: string
  password: string
  type: ParticipantType
  turma?: string
  diet: string
  health?: string
  consent: boolean | null
  createdAt: string
  offer: boolean
  tableId?: string
  payments: Payment[]
  enteredAt?: string
  enteredBy?: string
  qr: string
  /** 9.º ano: encarregado de educação */
  guardianName?: string
  guardianPhone?: string
  modalityId?: string
  extras?: string[]
  /** Valor de cada prestação desta pessoa, quando difere do evento (modalidade/extras) */
  customAmounts?: number[]
  cancelledAt?: string
  cancelReason?: string
  /** Valor a devolver na desistência */
  refundDue?: number
  /** Quem adicionou à mão (vazio = inscreveu-se sozinho) */
  addedBy?: string
}

export interface Vote {
  eventId: string
  awardId: string
  voterId: string
  candidateId: string
}

export interface Venue {
  id: string
  name: string
  costPerPerson: number
  minimum: number
  capacity: number
}

export const PARTNER_TYPES = ['DJ', 'Videógrafo', 'Fotógrafo', 'Som'] as const
export type PartnerType = (typeof PARTNER_TYPES)[number]

export interface Partner {
  id: string
  type: PartnerType
  name: string
  baseCost: number
}

export const EXPENSE_CATEGORIES = ['Material', 'Marketing', 'Deslocações', 'Software', 'Outros'] as const

export interface Expense {
  id: string
  description: string
  category: string
  amount: number
  date: string
  /** 'empresa' ou id do sócio que pagou do bolso */
  paidBy: string
  reimbursed: boolean
}

export interface DB {
  version: number
  users: User[]
  events: LDEvent[]
  participants: Participant[]
  votes: Vote[]
  venues: Venue[]
  partners: Partner[]
  expenses: Expense[]
}
