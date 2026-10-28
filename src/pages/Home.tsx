import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BRAND, whatsapp } from '../config'
import { Counter, Reveal, ScrollProgress, Sparkles, Tilt } from '../components/motion'
import { CookieBanner, Footer, Navbar } from '../components/site'
import { Intro, shouldShowIntro } from '../components/Intro'
import { HeroVideo } from '../components/HeroVideo'
import { QR, StatusPill } from '../components/ui'
import { Icon, type IconName } from '../components/icons'

const MARQUEE = ['LASTDANCE 2026/27', 'BAILE DE FINALISTAS', 'UMA NOITE INESQUECÍVEL', 'ELEGÂNCIA & GLAMOUR', 'A TUA ÚLTIMA DANÇA']

/** Cada tipo de evento tem uma ou mais fotos; com várias, ao tocar no cartão passa para a seguinte. */
const EVENTS: [string, string, string[]][] = [
  ['Bailes de finalistas', '12.º ano · a grande noite de despedida do secundário.', ['/brand/baile-1.webp', '/brand/baile-2.webp', '/brand/baile-3.webp']],
  ['Bailes do 9.º ano', 'Uma primeira grande noite, segura e à medida da idade.', ['/brand/nono-1.webp', '/brand/nono-2.webp', '/brand/nono-3.webp']],
  ['Bailes universitários', 'Espaços exclusivos, DJs convidados e afterparty.', ['/brand/uni-1.webp', '/brand/uni-2.webp', '/brand/uni-3.webp']],
  ['Jantares de gala', 'Elegância à mesa, diplomas e brindes.', ['/brand/gala-1.webp', '/brand/gala-2.webp', '/brand/gala-3.webp']],
]

/** Outros eventos que também organizamos: [ícone, título, descrição] */
const MORE_EVENTS = [
  ['briefcase', 'Eventos corporate', 'Jantares de empresa, festas de Natal, team building e lançamentos.'],
  ['cake', 'Aniversários', 'Dos 18 aos 50, uma festa à tua medida, do espaço ao bolo.'],
  ['balloon', 'Baby shower e gender reveal', 'Decoração, doces e o momento da revelação, pensados ao detalhe.'],
]

const WHY = [
  ['shield', 'Segurança total', 'QR pessoal à porta e equipa de apoio toda a noite.'],
  ['gem', 'Decoração premium', 'Ambientes temáticos pensados para cada escola.'],
  ['music', 'DJs e artistas', 'Line-up que não deixa a pista arrefecer.'],
  ['camera', 'Foto e vídeo pro', 'Cada momento da noite, imortalizado.'],
  ['landmark', 'Locais exclusivos', 'Os melhores espaços, escolhidos contigo.'],
  ['phone', 'Tudo no telemóvel', 'Inscrição, prestações, mesa e QR numa só área.'],
]

/** Da primeira conversa à última dança: [título, com quem, o que acontece] */
const STEPS = [
  ['Conversa e visita', 'Contigo', 'Falamos contigo para perceber a ideia, o número de pessoas e o orçamento. Quando faz sentido, visitamos juntos os espaços possíveis.'],
  ['Proposta e contrato', 'Contigo', 'Enviamos uma proposta clara, com o preço por pessoa, as prestações e tudo o que está incluído. Assinamos o contrato e reservamos a data.'],
  ['Pré-produção', 'Connosco', 'Conceito, decoração, fornecedores, licenças e seguros. Tratamos de tudo nos bastidores para que nada falhe no dia.'],
  ['Divulgação', 'Com a organização', 'Entregamos o código do evento à comissão de finalistas, com materiais para divulgar nas turmas e nas redes sociais.'],
  ['Inscrições', 'Com os participantes', 'Cada aluno inscreve-se com o código em poucos minutos e paga em prestações ao promotor, que regista tudo na plataforma.'],
  ['Produção', 'Connosco', 'No dia, montamos tudo, recebemos os convidados com QR à porta e coordenamos cada momento até à última dança.'],
]

const NIGHT = [
  ['19h00', 'Receção aos convidados e welcome drink'],
  ['19h30', 'Cerimónia de faixas e diplomas'],
  ['20h30', 'Cocktail'],
  ['21h30', 'Jantar de gala'],
  ['23h00', 'Entrega de prémios'],
  ['23h45', 'Corte do bolo'],
  ['23h45', 'Fogo de artifício'],
  ['00h00', 'Festa com bar aberto e ceia'],
  ['04h00', 'Encerramento'],
]

const FAQ = [
  ['Quanto custa?', 'Depende do espaço, do número de pessoas e do que incluir. Fazemos uma proposta com preço por pessoa fechado, sem surpresas.'],
  ['Posso pagar em prestações?', 'Sim. Cada evento tem 2 a 4 prestações, pagas ao promotor da tua escola, que regista tudo na plataforma.'],
  ['Como me inscrevo?', 'Pede o código à tua comissão de finalistas, carrega em «Inscrição» e preenche os dados em 2 minutos.'],
  ['Como entro no baile?', 'Com tudo pago, recebes um QR pessoal. À porta lemos o QR e confirmamos o Cartão de Cidadão.'],
  ['Com quanta antecedência devemos falar convosco?', 'Idealmente 8 a 12 meses antes — as melhores datas de maio e junho esgotam cedo.'],
]

/** Cartão de tipo de evento. Com várias fotos, cada toque mostra a seguinte (com transição suave). */
function EventCard({ title, text, images }: { title: string; text: string; images: string[] }) {
  const [n, setN] = useState(0)
  const many = images.length > 1
  const next = () => many && setN((n + 1) % images.length)
  return (
    <div
      className={many ? 'ev-click' : undefined}
      onClick={next}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), next())}
      role={many ? 'button' : undefined}
      tabIndex={many ? 0 : undefined}
      aria-label={many ? `${title}: ver foto seguinte (${n + 1} de ${images.length})` : undefined}
    >
      <Tilt className="ev-card">
        {images.map((src, k) => (
          <div key={src} className={`img ${k === n ? 'on' : ''}`} style={{ backgroundImage: `url(${src})` }} />
        ))}
        <div className="body">
          <h3>{title}</h3>
          <p>{text}</p>
          {many && (
            <div className="ev-dots" aria-hidden>
              {images.map((src, k) => (
                <span key={src} className={k === n ? 'on' : ''} />
              ))}
              <small>toca para ver mais</small>
            </div>
          )}
        </div>
      </Tilt>
    </div>
  )
}

/** Linha do tempo vertical: toca num passo para o abrir. */
function Steps() {
  const [open, setOpen] = useState(0)
  return (
    <ol className="vsteps">
      {STEPS.map(([t, who, d], k) => (
        <li key={t} className={`vstep ${open === k ? 'open' : ''} ${k < open ? 'done' : ''}`}>
          <button className="vstep-head" onClick={() => setOpen(k)} aria-expanded={open === k}>
            <span className="vstep-num">{k + 1}</span>
            <span>
              <b>{t}</b>
              <small>{who}</small>
            </span>
          </button>
          <div className="vstep-body">
            <p>{d}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function PhoneDemo() {
  const [paid, setPaid] = useState(false)
  const now = new Date()
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
  return (
    <div className="iphone floating" aria-label="Exemplo da área do aluno no telemóvel">
      <span className="iphone-btn iphone-btn-a" />
      <span className="iphone-btn iphone-btn-b" />
      <span className="iphone-btn iphone-btn-c" />
      <div className="iphone-screen">
        <div className="iphone-status">
          <span>{time}</span>
          <span className="iphone-island" />
          <span className="iphone-icons" aria-hidden>
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="iphone-url">🔒 lastdance.pt</div>
      <div className="stack iphone-content">
        <div>
          <b>A minha área</b>
          <p className="small muted">Baile de finalistas · 28 de maio</p>
        </div>
        <div className="progress">
          <div style={{ width: paid ? '100%' : '55%', transition: 'width 0.8s ease' }} />
        </div>
        {[
          ['1.ª prestação', 'paid'],
          ['2.ª prestação', paid ? 'paid' : 'partial'],
          ['3.ª prestação', paid ? 'paid' : 'missing'],
        ].map(([n, s]) => (
          <div key={n} className="row between small">
            <span>{n}</span>
            <span className="row" style={{ gap: 8 }}>
              30,00 € <StatusPill s={s as 'paid'} label={s === 'partial' ? 'Parcial' : undefined} />
            </span>
          </div>
        ))}
        <div style={{ textAlign: 'center', minHeight: 170, display: 'grid', placeItems: 'center' }}>
          {paid ? (
            <div className="reveal reveal-zoom in">
              <QR value="LD-DEMO" size={150} />
            </div>
          ) : (
            <p className="small muted">O QR de entrada aparece quando tudo estiver pago.</p>
          )}
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => setPaid(!paid)}>
          {paid ? 'Repor' : 'Simular: pagar o que falta'}
        </button>
      </div>
        <span className="iphone-home" />
      </div>
    </div>
  )
}

export default function Home() {
  const [faq, setFaq] = useState<number | null>(0)
  // Progresso do scroll no topo (0 = só vídeo, 1 = tudo visível), em --p para o CSS
  const heroRef = useRef<HTMLElement>(null)
  const [heroStatic] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    if (heroStatic) return el.style.setProperty('--p', '1')
    // Atualizar uma variável CSS é barato: fazemo-lo em cada evento de scroll
    const update = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.65)))
      el.style.setProperty('--p', p.toFixed(3))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [heroStatic])
  const [intro] = useState(shouldShowIntro)
  const [ready, setReady] = useState(!intro)

  return (
    <div id="topo">
      {intro && <Intro onDone={() => setReady(true)} />}
      <ScrollProgress />
      <Navbar />

      {/* HERO: primeiro só o vídeo; ao fazer scroll o vídeo fica fixo e o conteúdo aparece por cima */}
      <section className={`hero-scroll ${heroStatic ? 'static' : ''}`} ref={heroRef}>
        <div className="hero2 hero-stage">
          <div className="hero2-parallax">
            <HeroVideo />
          </div>
          <Sparkles count={30} />
          {ready && (
            <div className="container">
              <span className="badge hs" style={{ ['--s' as string]: 0.02 }}>
                ✦ Bailes de Finalistas 2026/27
              </span>
              <span className="logo-shine hero-logo-wrap hs" style={{ ['--logo-mask' as string]: 'url(/brand/logo-gold.webp)', ['--s' as string]: 0.1 }}>
                <img className="hero-logo" src="/brand/logo-gold.webp" alt="LastDance" width={1183} height={728} />
              </span>
              <h1 className="hs" style={{ ['--s' as string]: 0.28 }}>
                A Noite que Ficará <span className="shimmer">Para a História</span>
              </h1>
              <p className="lead hs" style={{ ['--s' as string]: 0.42 }}>
                Bailes de finalistas premium, do primeiro contacto à última dança. Tu vives a noite, nós tratamos de tudo.
              </p>
              <div className="row hs" style={{ ['--s' as string]: 0.52 }}>
                <Link to="/inscricao" className="btn btn-gold pulse">
                  Tenho um código <Icon name="arrow" size={18} className="arrow" />
                </Link>
                <a href={whatsapp()} target="_blank" rel="noreferrer" className="btn btn-ghost">
                  Pedir proposta
                </a>
              </div>
            </div>
          )}
          <a
            href="#numeros"
            className="scroll-hint"
            aria-label="Descer"
            onClick={(e) => {
              if (heroStatic) return
              e.preventDefault()
              window.scrollTo({ top: window.innerHeight * 0.7, behavior: 'smooth' })
            }}
          />
        </div>
      </section>

      <div className="marquee">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i}>✦ {m}</span>
          ))}
        </div>
      </div>

      {/* NÚMEROS */}
      <section className="section" id="numeros" style={{ padding: '80px 0' }}>
        <div className="container big-stats big-stats-3">
          {[
            [5, '+', 'anos de experiência'],
            [50, '+', 'eventos realizados'],
            [30, '+', 'escolas e empresas que confiaram em nós'],
          ].map(([n, p, l], i) => (
            <Reveal key={l as string} delay={i * 120}>
              <b className="gold">
                <Counter to={n as number} prefix={p as string} />
              </b>
              <span className="muted">{l}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* EVENTOS */}
      <section className="section" id="eventos" style={{ paddingTop: 20 }}>
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">O que organizamos</span>
            <h2>
              Cada fim de ciclo merece <span className="script shimmer">uma grande noite</span>
            </h2>
          </Reveal>
          <div className="cards-4">
            {EVENTS.map(([t, d, imgs], i) => (
              <Reveal key={t} delay={i * 120} anim="up">
                <EventCard title={t} text={d} images={imgs} />
              </Reveal>
            ))}
          </div>
          <Reveal className="more-events-head">
            <h3>
              E não só: <span className="script shimmer">qualquer celebração</span>
            </h3>
          </Reveal>
          <div className="cards-3">
            {MORE_EVENTS.map(([i, t, d], k) => (
              <Reveal key={t} delay={k * 120}>
                <Tilt className="card more-event">
                  <div className="icon-bubble">
                    <Icon name={i as IconName} />
                  </div>
                  <h3>{t}</h3>
                  <p className="muted small">{d}</p>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PORQUÊ */}
      <section className="section section-alt pattern-soft" id="quem-somos">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Porquê a LastDance</span>
            <h2>Jovens, exigentes e obcecados com o detalhe</h2>
            <p>Trabalhamos com os melhores espaços e parceiros para que a vossa noite seja perfeita.</p>
          </Reveal>
          <div className="cards-3">
            {WHY.map(([i, t, d], k) => (
              <Reveal key={t} delay={(k % 3) * 120} anim="zoom">
                <Tilt className="card">
                  <div className="icon-bubble">
                    <Icon name={i as IconName} />
                  </div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="section" id="como">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Como funciona</span>
            <h2>Da primeira conversa à última dança</h2>
            <p>Seis passos até ao dia, e depois a noite, hora a hora. Toca num passo para ver o que acontece.</p>
          </Reveal>
          <Reveal>
            <Steps />
          </Reveal>
        </div>
      </section>

      {/* A NOITE */}
      <section className="section section-alt">
        <div className="container cards-2" style={{ alignItems: 'center', gap: 60 }}>
          <div>
            <Reveal className="section-head" style={{ textAlign: 'left', margin: '0 0 36px' }}>
              <span className="eyebrow">A noite, hora a hora</span>
              <h2>
                Uma noite <span className="script shimmer">inesquecível</span>
              </h2>
            </Reveal>
            <div className="tl2 tl2-compact">
              {NIGHT.map(([h, t], k) => (
                <Reveal key={k} className="tl2-item" anim="left" delay={k * 70}>
                  <div className="h">{h}</div>
                  <h3>{t}</h3>
                </Reveal>
              ))}
            </div>
            <p className="small muted" style={{ marginTop: 6 }}>
              * Programa exemplo, com possível ajuste mediante a escola.
            </p>
          </div>
          <Reveal anim="right">
            <div className="section-head" style={{ marginBottom: 24 }}>
              <span className="eyebrow">A tua área</span>
              <h2 style={{ fontSize: '1.8rem' }}>Prestações, mesa e QR no telemóvel</h2>
              <p>Sem apps para instalar. Experimenta:</p>
            </div>
            <PhoneDemo />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="container" style={{ maxWidth: 820 }}>
          <Reveal className="section-head">
            <span className="eyebrow">Dúvidas</span>
            <h2>Perguntas frequentes</h2>
          </Reveal>
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} className="faq-item" delay={i * 80}>
              <button className={`faq-q ${faq === i ? 'open' : ''}`} onClick={() => setFaq(faq === i ? null : i)}>
                {q} <span className="gold">+</span>
              </button>
              {faq === i && <p className="faq-a">{a}</p>}
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section" id="inscricao" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal anim="zoom" className="cta-final">
            <Sparkles count={24} />
            <div style={{ position: 'relative' }}>
              <h2>Pronto para a noite da tua vida?</h2>
              <p style={{ color: 'var(--gray-300)', marginBottom: 28 }}>Inscreve-te com o código da tua escola ou fala connosco para organizarmos o vosso baile.</p>
              <div className="row" style={{ justifyContent: 'center' }}>
                <Link to="/inscricao" className="btn btn-gold pulse">
                  Inscrever agora <Icon name="arrow" size={18} className="arrow" />
                </Link>
                <a href={whatsapp()} target="_blank" rel="noreferrer" className="btn btn-ghost">
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CONTACTOS */}
      <section className="section" id="contactos" style={{ paddingTop: 0 }}>
        <div className="container cards-2">
          {[
            ['chat', 'WhatsApp', BRAND.phone, whatsapp()],
            ['mail', 'Email', BRAND.email, `mailto:${BRAND.email}`],
          ].map(([i, t, v, h], k) => (
            <Reveal key={t} delay={k * 120}>
              <a href={h} target={h?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <Tilt className="card row" style={{ flexWrap: "nowrap", height: "100%" }}>
                  <div className="icon-bubble" style={{ margin: 0 }}>
                    <Icon name={i as IconName} />
                  </div>
                  <div>
                    <div className="small muted">{t}</div>
                    <b>{v}</b>
                  </div>
                </Tilt>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <Footer />
      <CookieBanner />
    </div>
  )
}
