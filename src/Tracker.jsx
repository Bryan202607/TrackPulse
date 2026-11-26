import { useEffect } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { doc, increment, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { isWeekend, weekKey } from './lib/schedule'

const BG = registerPlugin('BackgroundGeolocation')
const native = Capacitor.isNativePlatform()
const meters = (a, b, c, d) => Math.hypot((a - c) * 111320, (b - d) * 111320 * Math.cos((a * Math.PI) / 180))

// Envoie la position de CET appareil (web : appli ouverte ; appli native : aussi en arrière-plan).
// Rien n'est envoyé le week-end ni si l'appareil est déconnecté.
export default function Tracker({ deviceId, onGone }) {
  useEffect(() => {
    if (!deviceId) return
    const ref = doc(db, 'devices', deviceId)
    let watchId = null, active = false, last = null

    const onPos = async ({ latitude: la, longitude: ln, accuracy, speed, heading }) => {
      if (isWeekend()) return stop()
      const b = await navigator.getBattery?.().catch(() => null)
      const now = Date.now(), moving = (speed ?? 0) * 3.6 > 3
      const dt = last ? Math.min((now - last.t) / 1000, 60) : 0
      const m = last ? meters(last.la, last.ln, la, ln) : 0
      last = { t: now, la, ln }
      const w = `stats.${weekKey()}`
      updateDoc(ref, {
        position: { lat: la, lng: ln, accuracy, heading: heading ?? 0, speed: speed ?? 0, battery: b ? Math.round(b.level * 100) : 100 },
        lastSeen: serverTimestamp(),
        [`${w}.km`]: increment(m > Math.max(accuracy, 10) ? m / 1000 : 0),
        [`${w}.movingSec`]: increment(moving ? dt : 0),
        [`${w}.idleSec`]: increment(moving ? 0 : dt)
      }).catch(() => {})
    }
    const stop = () => {
      if (watchId !== null && watchId !== 'pending') native ? BG.removeWatcher({ id: watchId }) : navigator.geolocation.clearWatch(watchId)
      watchId = null; last = null
    }
    const start = () => {
      if (watchId !== null) return
      if (native) {
        watchId = 'pending'
        BG.addWatcher(
          { backgroundTitle: 'Flotte', backgroundMessage: 'Suivi actif pendant les jours ouvrés', requestPermissions: true, stale: false, distanceFilter: 5 },
          (loc) => loc && onPos({ ...loc, heading: loc.bearing })
        ).then((id) => { if (watchId === 'pending') watchId = id; else BG.removeWatcher({ id }) })
      } else if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition((p) => onPos(p.coords), () => {}, { enableHighAccuracy: true, maximumAge: 5000 })
      }
    }
    const tick = () => (active && !isWeekend() ? start() : stop())

    const unsub = onSnapshot(ref, (s) => {
      if (!s.exists()) { stop(); onGone(); return }
      active = s.data().status === 'active'
      tick()
    })
    const timer = setInterval(tick, 60000)
    return () => { stop(); unsub(); clearInterval(timer) }
  }, [deviceId])

  return null
}
