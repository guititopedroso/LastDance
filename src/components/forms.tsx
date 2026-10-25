import { useState, type InputHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './icons'

/** Campo de palavra-passe com botão Mostrar/Ocultar. */
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div className="pass-wrap">
      <input {...props} className="input" type={show ? 'text' : 'password'} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}>
        {show ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  )
}

export function BackLink({ to = '/', children = 'Voltar ao site' }: { to?: string; children?: string }) {
  return (
    <Link to={to} className="back-link">
      <Icon name="arrow" size={16} /> {children}
    </Link>
  )
}
