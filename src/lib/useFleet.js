import { useEffect, useState } from 'react'
import { fleet } from './simulator'

// La liste React ne se rafraîchit que toutes les 2 s ; la carte, elle, se met à jour en direct via fleet.subscribe.
export function useFleet() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const stop = fleet.start()
    const t = setTimeout(() => { setDevices(fleet.snapshot()); setLoading(false) }, 900)
    const i = setInterval(() => setDevices(fleet.snapshot()), 2000)
    return () => { stop(); clearTimeout(t); clearInterval(i) }
  }, [])
  return { devices, loading }
}

export function useOnline() {
  const [s, setS] = useState({ online: navigator.onLine, since: Date.now() })
  useEffect(() => {
    const f = () => setS({ online: navigator.onLine, since: Date.now() })
    window.addEventListener('online', f); window.addEventListener('offline', f)
    return () => { window.removeEventListener('online', f); window.removeEventListener('offline', f) }
  }, [])
  return s
}
