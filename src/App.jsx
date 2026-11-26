import { useEffect, useState } from 'react'
import { signOutUser, watchSession } from './lib/session'
import { audit } from './lib/ops'
import Login from './pages/Login.jsx'
import Fleet from './pages/Fleet.jsx'

export default function App() {
  const [user, setUser] = useState(undefined)
  useEffect(() => {
    let off = () => {}
    watchSession(setUser).then((u) => { off = u || off })
    return () => off()
  }, [])
  if (user === undefined) return <div className="boot" />
  if (!user) return <Login onLogin={(u) => { audit('Connexion', '', u.email); setUser(u) }} />
  return <Fleet user={user} onSignOut={async () => { await signOutUser(); setUser(null) }} />
}
