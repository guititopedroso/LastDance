import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BRAND, whatsapp } from '../config'
import { Counter, Reveal, ScrollProgress, Sparkles, SplitWords, Tilt, useParallax } from '../components/motion'
import { CookieBanner, Footer, Navbar } from '../components/site'
import { Intro, shouldShowIntro } from '../components/Intro'
import { QR, StatusPill } from '../components/ui'
import { Icon, type IconName } from '../components/icons'

const MARQUEE = ['LASTDANCE 2026/27', 'BAILE DE FINALISTAS', 'UMA NOITE INESQUECÍVEL', 'ELEGÂNCIA & GLAMOUR', 'A TUA ÚLTIMA DANÇA']

const EVENTS = [
  ['Bailes de finalistas', '12.º ano · a grande noite de despedida do secundário.', '/hero-bg.webp'],
  ['Bailes do 9.º ano', 'Uma primeira grande noite, segura e à medida da idade.', '/bg-dance.webp'],
  ['Bailes universitários', 'Espaços exclusivos, DJs convidados e afterparty.', '/bg-venue.webp'],
  ['Jantares de gala', 'Elegância à mesa, diplomas e brindes.', '/bg-outdoor-prom.webp'],
]

const WHY = [
  ['shield', 'Segurança total', 'QR pessoal à porta e equipa de apoio toda a noite.'],
  ['gem', 'Decoração premium', 'Ambientes temáticos pensados para cada escola.'],
  ['music', 'DJs e artistas', 'Line-up que não deixa a pista arrefecer.'],
  ['camera', 'Foto e vídeo pro', 'Cada momento da noite, imortalizado.'],
  ['landmark', 'Locais exclusivos', 'Os melhores espaços, escolhidos contigo.'],
  ['phone', 'Tudo no telemóvel', 'Inscrição, prestações, mesa e QR numa só área.'],
]

const STEPS = [
  ['chat', 'Falamos', 'A comissão conta-nos a ideia e o orçamento.'],
  ['doc', 'Proposta', 'Preço por pessoa fechado e tudo o que está incluído.'],
  ['ticket', 'Inscrições', 'Cada aluno inscreve-se com o código e paga em prestações.'],
  ['glass', 'A noite', 'Tratamos de tudo. Vocês só têm de aparecer.'],
]

const NIGHT = [
  ['20:00', 'Red carpet & receção', 'Chegada, QR à porta, fotos e cocktail de boas-vindas.'],
  ['21:00', 'Jantar de gala', 'Mesas organizadas e menu servido.'],
  ['22:30', 'Cerimónia & prémios', 'Rei, Rainha e Melhor Outfit, votados por vocês.'],
  ['23:00', 'Festa', 'DJ e artistas até ao amanhecer.'],
  ['02:00', 'Afterparty', 'Espaço privado para prolongar a magia.'],
]

const FAQ = [
  ['Quanto custa?', 'Depende do espaço, do número de pessoas e do que incluir. Fazemos uma proposta com preço por pessoa fechado, sem surpresas.'],
  ['Posso pagar em prestações?', 'Sim. Cada evento tem 2 a 4 prestações, pagas ao promotor da tua escola, que regista tudo na plataforma.'],
  ['Como me inscrevo?', 'Pede o código à tua comissão de finalistas, carrega em «Inscrição» e preenche os dados em 2 minutos.'],
  ['Como entro no baile?', 'Com tudo pago, recebes um QR pessoal. À porta lemos o QR e confirmamos o Cartão de Cidadão.'],
  ['Com quanta antecedência devemos falar convosco?', 'Idealmente 8 a 12 meses antes — as melhores datas de maio e junho esgotam cedo.'],
]

function PhoneDemo() {
  const [paid, setPaid] = useState(false)
  return (
    <div className="phone floating">
      <div className="stack">
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
    </div>
  )
}

export default function Home() {
  const [faq, setFaq] = useState<number | null>(0)
  const py = useParallax(0.35)
  const [intro] = useState(shouldShowIntro)
  const [ready, setReady] = useState(!intro)

  return (
    <div id="topo">
      {intro && <Intro onDone={() => setReady(true)} />}
      <ScrollProgress />
      <Navbar />

      {/* HERO */}
      <section className="hero2">
        <div className="hero2-parallax" style={{ transform: `translateY(${py}px)` }}>
          <div className="hero2-bg" />
        </div>
        <Sparkles count={46} />
        {ready && (
        <div className="container">
          <span className="badge fade-in" style={{ animationDelay: '0.1s' }}>
            ✦ Bailes de Finalistas 2026/27
          </span>
          <span className="logo-shine hero-logo-wrap" style={{ ['--logo-mask' as string]: 'url(/brand/logo-gold.webp)' }}>
            <img className="hero-logo" src="/brand/logo-gold.webp" alt="LastDance" width={1183} height={728} />
          </span>
          <h1>
            <SplitWords text="A Noite que Ficará" delay={700} />
            <span className="word" style={{ animationDelay: '1050ms' }}>
              <span className="shimmer">Para a História</span>
            </span>
          </h1>
          <p className="lead fade-in" style={{ animationDelay: '1.4s' }}>
            Bailes de finalistas premium, do primeiro contacto à última dança. Tu vives a noite, nós tratamos de tudo.
          </p>
          <div className="row fade-in" style={{ animationDelay: '1.6s' }}>
            <Link to="/inscricao" className="btn btn-gold pulse">
              Tenho um código <Icon name="arrow" size={18} className="arrow" />
            </Link>
            <a href={whatsapp()} target="_blank" rel="noreferrer" className="btn btn-ghost">
              Pedir proposta
            </a>
          </div>
        </div>
        )}
        <a href="#numeros" className="scroll-hint" aria-label="Descer" />
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
        <div className="container big-stats">
          {[
            [5000, '+', 'alunos inscritos'],
            [15, '', 'escolas parceiras'],
            [30, '+', 'eventos realizados'],
            [3, '+', 'anos de paixão'],
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
            {EVENTS.map(([t, d, img], i) => (
              <Reveal key={t} delay={i * 120} anim="up">
                <Tilt className="ev-card">
                  <div className="img" style={{ backgroundImage: `url(${img})` }} />
                  <div className="body">
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
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
            <h2>Simples, do início ao fim</h2>
          </Reveal>
          <div className="steps4">
            {STEPS.map(([i, t, d], k) => (
              <Reveal key={t} delay={k * 180}>
                <div className="num">
                  <Icon name={i as IconName} size={26} />
                </div>
                <h3 style={{ marginBottom: 6 }}>
                  {k + 1}. {t}
                </h3>
                <p className="muted small">{d}</p>
              </Reveal>
            ))}
          </div>
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
            <div className="tl2">
              {NIGHT.map(([h, t, d], k) => (
                <Reveal key={h} className="tl2-item" anim="left" delay={k * 100}>
                  <div className="h">{h}</div>
                  <h3 style={{ fontSize: '1.15rem', margin: '2px 0 4px' }}>{t}</h3>
                  <p className="muted small">{d}</p>
                </Reveal>
              ))}
            </div>
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
        <div className="container cards-3">
          {[
            ['chat', 'WhatsApp', BRAND.phone, whatsapp()],
            ['mail', 'Email', BRAND.email, `mailto:${BRAND.email}`],
            ['pin', 'Sede', BRAND.address, undefined],
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
