import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell, Logo } from '../../components/ui'
import { API_MODE, hasSession, useSession, useSyncStatus } from '../../data/store'
import AdminHome from './AdminHome'
import ComercialHome from './ComercialHome'
import EventPage from './EventPage'
import ParticipantArea from './ParticipantArea'
import StaffDoor from './StaffDoor'

/** Encaminha cada perfil para a sua área. */
export default function Gestao() {
  const { user, participant } = useSession()
  const sync = useSyncStatus()

  if (!hasSession()) return <Navigate to="/entrar" replace />
  if (!user && !participant) {
    if (API_MODE && !sync.loaded)
      return (
        <div className="app-bg" style={{ display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
          <div className="stack" style={{ justifyItems: 'center', display: 'grid' }}>
            <Logo h={64} />
            <p className="muted">{sync.offline ? 'Sem ligação à internet. A tentar outra vez…' : 'A carregar…'}</p>
          </div>
        </div>
      )
    return <Navigate to="/entrar" replace />
  }

  let content
  if (participant) content = <ParticipantArea p={participant} />
  else if (user!.role === 'staff') content = <StaffDoor user={user!} />
  else if (user!.role === 'promotor_chefe' || user!.role === 'promotor') content = <EventPage eventId={user!.eventId!} user={user!} />
  else
    content = (
      <Routes>
        <Route path="/" element={user!.role === 'admin' ? <AdminHome /> : <ComercialHome user={user!} />} />
        <Route path="evento/:id" element={<EventPage user={user!} />} />
      </Routes>
    )
  return <AppShell>{content}</AppShell>
}
