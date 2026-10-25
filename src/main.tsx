import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './styles.css'
import './polish.css'
import './brand.css'
import { Toaster } from './components/ui'
import Home from './pages/Home'
import Legal from './pages/Legal'
import Login from './pages/Login'
import Inscricao from './pages/Inscricao'
import Gestao from './pages/gestao/Gestao'

const TITLES: Record<string, string> = {
  inscricao: 'Inscrição',
  entrar: 'Log-in',
  gestao: 'A minha área',
  termos: 'Termos e Condições',
  privacidade: 'Política de Privacidade',
  cookies: 'Política de Cookies',
}

function ScrollTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
    const t = TITLES[pathname.split('/')[1] ?? ''] ?? 'O Teu Baile de Finalistas Premium'
    document.title = `${t} | LastDance`
  }, [pathname, hash])
  return null
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/inscricao" element={<Inscricao />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/area-cliente" element={<Navigate to="/entrar" replace />} />
        <Route path="/gestao/*" element={<Gestao />} />
        <Route path="/termos" element={<Legal page="termos" />} />
        <Route path="/privacidade" element={<Legal page="privacidade" />} />
        <Route path="/cookies" element={<Legal page="cookies" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  </React.StrictMode>,
)
