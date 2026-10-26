import { useEffect, useRef, useState } from 'react'

/**
 * Vídeo de fundo do topo da página (aftermovie).
 * Telemóvel recebe a versão 720p; computador a 1080p. Com «poupança de dados» ou
 * movimento reduzido fica só a imagem. Pausa quando sai do ecrã, para poupar bateria.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const [src] = useState(() => (window.innerWidth < 768 ? '/brand/hero-720.mp4' : '/brand/hero-1080.mp4'))
  const [still] = useState(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    return !!conn?.saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v || still) return
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.05 })
    io.observe(v)
    return () => io.disconnect()
  }, [still])

  return (
    <div className="hero-video">
      <img className="hero-video-poster" src="/brand/hero-poster.jpg" alt="" aria-hidden />
      {!still && (
        <video
          ref={ref}
          className={ready ? 'on' : ''}
          src={src}
          poster="/brand/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          onPlaying={() => setReady(true)}
        />
      )}
    </div>
  )
}
