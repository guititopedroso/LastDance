import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Chama `onShow` uma vez, quando o elemento entra no ecrã. */
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced() || !('IntersectionObserver' in window)) return setShown(true)
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, shown }
}

type Anim = 'up' | 'left' | 'right' | 'zoom' | 'fade'

/** Aparece com animação ao fazer scroll. */
export function Reveal({ children, as = 'div', anim = 'up', delay = 0, className = '', style }: { children: ReactNode; as?: 'div' | 'section' | 'span'; anim?: Anim; delay?: number; className?: string; style?: CSSProperties }) {
  const { ref, shown } = useInView<HTMLDivElement>()
  const Tag = as as 'div'
  return (
    <Tag ref={ref} className={`reveal reveal-${anim} ${shown ? 'in' : ''} ${className}`} style={{ ...style, transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  )
}

/** Número que conta até ao valor quando fica visível. */
export function Counter({ to, prefix = '', suffix = '', duration = 1800 }: { to: number; prefix?: string; suffix?: string; duration?: number }) {
  const { ref, shown } = useInView<HTMLSpanElement>(0.4)
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!shown) return
    if (reduced()) return setV(to)
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration)
      setV(Math.round(to * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [shown, to, duration])
  return (
    <span ref={ref}>
      {prefix}
      {v.toLocaleString('pt-PT')}
      {suffix}
    </span>
  )
}

/** Texto que entra palavra a palavra. */
export function SplitWords({ text, delay = 0, step = 90, className = '' }: { text: string; delay?: number; step?: number; className?: string }) {
  return (
    <span className={className}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="word" style={{ animationDelay: `${delay + i * step}ms` }}>
          {w}&nbsp;
        </span>
      ))}
    </span>
  )
}

/** Partículas douradas a flutuar (fundo do hero). */
export function Sparkles({ count = 40 }: { count?: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: typeof window !== 'undefined' && window.innerWidth < 640 ? Math.ceil(count / 2) : count }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 4,
        dur: 6 + Math.random() * 10,
        delay: -Math.random() * 12,
      })),
    [count],
  )
  return (
    <div className="sparkles" aria-hidden>
      {dots.map((d, i) => (
        <span key={i} style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }} />
      ))}
    </div>
  )
}

/** Cartão que inclina com o rato. */
export function Tilt({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el || reduced()) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`)
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`)
  }
  const leave = () => ref.current && (ref.current.style.transform = '')
  return (
    <div ref={ref} className={`tilt ${className}`} style={style} onMouseMove={move} onMouseLeave={leave}>
      {children}
    </div>
  )
}

/** Barra de progresso do scroll no topo da página. */
export function ScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const f = () => {
      const h = document.documentElement.scrollHeight - innerHeight
      setP(h > 0 ? scrollY / h : 0)
    }
    f()
    addEventListener('scroll', f, { passive: true })
    return () => removeEventListener('scroll', f)
  }, [])
  return <div className="scroll-progress" style={{ transform: `scaleX(${p})` }} />
}

/** Deslocamento suave com o scroll (parallax). */
export function useParallax(speed = 0.3) {
  const [y, setY] = useState(0)
  useEffect(() => {
    if (reduced()) return
    const f = () => setY(scrollY * speed)
    addEventListener('scroll', f, { passive: true })
    return () => removeEventListener('scroll', f)
  }, [speed])
  return y
}
