// O site corre em modo demonstração em lastdance.pt/demo: dados fictícios guardados só no browser,
// nunca toca na base de dados. Fora de /demo usa a API (na versão publicada).
const path = typeof window !== 'undefined' ? window.location.pathname : '/'

export const DEMO = path === '/demo' || path.startsWith('/demo/')

/** Prefixo dos endereços internos ('' no site real, '/demo' na demonstração). */
export const BASE = DEMO ? '/demo' : ''
