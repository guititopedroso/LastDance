import { useEffect, useRef, useState } from 'react'

const KEY = 'ld-intro-vista'
/** O logótipo fica completo por volta dos 4,8 s do vídeo; saímos aí. */
const END_AT = 4.9

export function shouldShowIntro() {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    return !sessionStorage.getItem(KEY)
  } catch {
    return false
  }
}

/** Abertura com a animação do logótipo. Aparece uma vez por visita. */
export function Intro({ onDone }: { onDone: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [out, setOut] = useState(false)
  const done = useRef(false)

  const finish = () => {
    if (done.current) return
    done.current = true
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {}
    setOut(true)
    onDone()
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    // Rede lenta ou vídeo bloqueado: não deixamos ninguém preso na abertura
    const safety = window.setTimeout(finish, 8000)
    const v = video.current
    v?.play().catch(finish)
    return () => {
      clearTimeout(safety)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (out) document.body.style.overflow = ''
  }, [out])

  return (
    <div className={`intro ${out ? 'out' : ''}`} aria-hidden={out}>
      <video
        ref={video}
        src="/brand/logo-animation.mp4"
        muted
        playsInline
        autoPlay
        preload="auto"
        onTimeUpdate={(e) => e.currentTarget.currentTime >= END_AT && finish()}
        onEnded={finish}
        onError={finish}
      />
      {!out && (
        <button className="intro-skip" onClick={finish}>
          Saltar intro
        </button>
      )}
    </div>
  )
}
