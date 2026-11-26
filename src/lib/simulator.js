// Flotte simulée (positions accélérées pour la démo). À remplacer par Firestore.
import { PLACES } from './format'
import { isWeekend } from './schedule'
import { DEMO } from './session'

const NAMES = ['Camion 07', 'Moto 12', 'Pickup 03', 'Tablette entrepôt', 'Moto 05', 'Camion 11', 'Pickup 08', 'Moto 02', 'Tablette bureau', 'Camion 04', 'Moto 09', 'Pickup 01']
const USERS = ['Jean Mbarga', 'Awa Njoya', 'Paul Essomba', 'Carine Tchamba', 'Samuel Fotso', 'Estelle Nkoa', 'Hervé Kamga', 'Brigitte Mballa', 'Alain Ndongo', 'Sandrine Ewane', 'Thierry Bisso', 'Nadège Atangana']
const r = (a, b) => a + Math.random() * (b - a)
const status = (d) => (d.offline ? 'offline' : d.speed > 3 ? 'moving' : 'idle')

const devices = NAMES.map((name, i) => {
  const p = PLACES[i], now = Date.now()
  const d = {
    id: `DV-${1040 + i}`, name, user: USERS[i], home: [p.lat, p.lng],
    lat: p.lat + r(-0.003, 0.003), lng: p.lng + r(-0.003, 0.003),
    heading: r(0, 360), speed: i % 5 === 0 ? 0 : r(20, 50), battery: r(25, 100),
    signal: 1 + Math.floor(r(0, 4)), accuracy: Math.round(r(4, 9)), offline: i === 3 || i === 9,
    lastSeen: now, trail: [], km: r(30, 120), movingSec: r(8, 20) * 3600, idleSec: r(2, 6) * 3600
  }
  if (i === 1) d.battery = 19.5
  if (d.offline) { d.speed = 0; d.lastSeen = now - r(20, 90) * 60000 }
  d.status = status(d)
  return d
})

if (!DEMO) devices.length = 0
const listeners = new Set()
function tick() {
  if (isWeekend() || !navigator.onLine) return
  const now = Date.now()
  for (const d of devices) {
    if (d.offline) continue
    if (Math.random() < 0.03) d.speed = d.speed > 3 ? 0 : r(20, 50)
    if (Math.random() < 0.008) d.speed = r(70, 95)
    else if (d.speed > 60) d.speed -= 3
    d.heading = (d.heading + r(-12, 12) + 360) % 360
    const dLat = d.lat - d.home[0], dLng = d.lng - d.home[1]
    if (Math.hypot(dLat, dLng) > 0.04) d.heading = (Math.atan2(-dLng, -dLat) * 180 / Math.PI + 360) % 360
    const m = (d.speed / 3.6) * 6, h = (d.heading * Math.PI) / 180
    d.lat += (Math.cos(h) * m) / 111320
    d.lng += (Math.sin(h) * m) / (111320 * Math.cos((d.lat * Math.PI) / 180))
    d.km += m / 1000
    if (d.speed > 3) d.movingSec++; else d.idleSec++
    d.battery = Math.max(5, d.battery - 0.004)
    if (Math.random() < 0.02) d.signal = 1 + Math.floor(r(0, 4))
    d.lastSeen = now; d.status = status(d)
    d.trail.push([now, d.lat, d.lng]); if (d.trail.length > 600) d.trail.shift()
  }
  listeners.forEach((fn) => fn())
}

let timer = null, users = 0
export const fleet = {
  getAll: () => devices,
  setAll: (arr) => { devices.splice(0, devices.length, ...arr); listeners.forEach((fn) => fn()) },
  snapshot: () => devices.map((d) => ({ ...d })),
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
  start() {
    if (users++ === 0 && DEMO) timer = setInterval(tick, 1000)
    return () => { if (--users === 0) clearInterval(timer) }
  }
}
