// Ícones de linha (estilo Lucide), desenhados em SVG para ficarem iguais em todos os telemóveis.
import type { SVGProps } from 'react'

const P: Record<string, string> = {
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
  gem: 'M6 3h12l4 6-10 13L2 9z M2 9h20 M12 22 8 9l4-6 4 6-4 13',
  music: 'M9 18V5l12-2v13 M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  landmark: 'M3 22h18 M6 18v-7 M10 18v-7 M14 18v-7 M18 18v-7 M12 2l9 5H3z',
  phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M11 18h2',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5',
  ticket: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z M13 5v2 M13 17v2 M13 11v2',
  glass: 'M8 22h8 M12 15v7 M5 2h14l-1 7a6 6 0 0 1-12 0z M6 7h12',
  briefcase: 'M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2 M2 13h20',
  cake: 'M4 21V12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9 M2 21h20 M4 15c2 1.5 4 1.5 5.3 0s3.4-1.5 5.4 0 4 1.5 5.3 0 M12 10V6 M12 6a1.5 1.5 0 0 0 1.5-1.5C13.5 3 12 2 12 2s-1.5 1-1.5 2.5A1.5 1.5 0 0 0 12 6z',
  balloon: 'M12 16c-3.9 0-7-3.4-7-7.5S8.1 1 12 1s7 3.4 7 7.5-3.1 7.5-7 7.5z M11 16l-1 2h4l-1-2 M12 18c0 2-2 2-2 4',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6',
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  close: 'M6 6l12 12 M18 6 6 18',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 3v4 M21 5h-4',
  check: 'M20 6 9 17l-5-5',
  instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z M17.5 6.5h.01',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  home: 'M3 10.5 12 3l9 7.5 M5 9v11h5v-6h4v6h5V9',
  trophy: 'M8 21h8 M12 17v4 M7 4h10v5a5 5 0 0 1-10 0z M17 5h3v2a4 4 0 0 1-3 3.9 M7 5H4v2a4 4 0 0 0 3 3.9',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 15l-5-5L5 21',
  plus: 'M12 5v14 M5 12h14',
  flag: 'M4 22V4 M4 4h13l-2 4 2 4H4',
  trash: 'M3 6h18 M8 6V4h8v2 M6 6l1 15h10l1-15 M10 11v6 M14 11v6',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z M5 22h14',
  qr: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h-3z M20 14v.01 M14 20h.01 M17 20h4v-3',
  back: 'M15 18l-6-6 6-6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3',
}

export type IconName = keyof typeof P

export function Icon({ name, size = 22, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {P[name].split(' M').map((d, i) => (
        <path key={i} d={i ? 'M' + d : d} />
      ))}
    </svg>
  )
}
