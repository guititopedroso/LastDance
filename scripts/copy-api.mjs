// Depois do build: copia a API PHP para dist/api, para publicar tudo de uma vez no public_html.
// Nunca copia o config.php (palavras-passe da base de dados).
import { cpSync, existsSync, rmSync } from 'node:fs'

const src = new URL('../api/', import.meta.url)
const dest = new URL('../dist/api/', import.meta.url)
if (existsSync(dest)) rmSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true, filter: (p) => !/[\/]config\.php$/.test(p) && !/\.sqlite$/.test(p) })
console.log('API copiada para dist/api')
