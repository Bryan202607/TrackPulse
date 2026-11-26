import { fleet } from './simulator'
import { DEMO } from './session'
import { isWeekend } from './schedule'

// Avec VITE_SERVER_ALERTS=true, les alertes sont créées par la Cloud Function (functions/index.js), pas par l'écran.
const SERVER_ALERTS = import.meta.env.VITE_SERVER_ALERTS === 'true'
const fsx = async () => ({ ...(await import('firebase/firestore')), ...(await import('../firebase')) })

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d } catch { return d } }
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
const subs = new Set()
const notify = () => subs.forEach((f) => f())
const dist = (a, b, c, d) => Math.hypot((a - c) * 111320, (b - d) * 111320 * Math.cos((a * Math.PI) / 180))

export const ops = {
  zones: !DEMO ? [] : load('zones', [
    { id: 'z1', name: 'Entrepôt Akwa', lat: 4.0485, lng: 9.705, r: 900 },
    { id: 'z2', name: 'Dépôt Bastos', lat: 3.8933, lng: 11.51, r: 900 }
  ]),
  alerts: [], audit: !DEMO ? [] : load('audit', []), limits: { speed: 60, battery: 20 }
}
export const subscribeOps = (f) => { subs.add(f); return () => subs.delete(f) }

export function audit(action, detail, user) {
  const e = { t: Date.now(), user, action, detail }
  if (!DEMO) return fsx().then(({ db, addDoc, collection }) => addDoc(collection(db, 'audit'), e)).catch(() => {})
  ops.audit = [e, ...ops.audit].slice(0, 200)
  save('audit', ops.audit); notify()
}
export function addZone(name, lat, lng, r, user) {
  r = Math.min(50000, Math.max(50, Math.round(r)))
  name = String(name).trim().slice(0, 60)
  if (!name) return
  if (!DEMO) fsx().then(({ db, addDoc, collection }) => addDoc(collection(db, 'zones'), { name, lat, lng, r })).catch(() => {})
  else { ops.zones = [...ops.zones, { id: `z${Date.now()}`, name, lat, lng, r }]; save('zones', ops.zones) }
  audit('Zone créée', `${name} (${r} m)`, user)
}
export function removeZone(z, user) {
  if (!DEMO) fsx().then(({ db, doc, deleteDoc }) => deleteDoc(doc(db, 'zones', z.id))).catch(() => {})
  else { ops.zones = ops.zones.filter((x) => x.id !== z.id); save('zones', ops.zones) }
  audit('Zone supprimée', z.name, user)
}

const inside = {}, cool = {}
function push(d, type, level, text, gap = 60000) {
  const k = d.id + type, now = Date.now()
  if (cool[k] && now - cool[k] < gap) return
  cool[k] = now
  // Identifiant déterministe : si plusieurs écrans détectent la même alerte, un seul document est créé.
  const a = { id: `${d.id}_${type}_${Math.floor(now / 60000)}`.replace(/\W/g, '_'), t: now, level, type, deviceId: d.id, device: d.name, ownerUid: d.ownerUid ?? null, text }
  if (DEMO) ops.alerts = [a, ...ops.alerts].slice(0, 100)
  else if (!SERVER_ALERTS) fsx().then(({ db, doc, setDoc }) => setDoc(doc(db, 'alerts', a.id), a)).catch(() => {})
}
function check() {
  if (isWeekend()) return
  for (const d of fleet.getAll()) {
    if (d.offline || d.lat == null) continue
    if (d.speed > ops.limits.speed) push(d, 'speed', 'bad', `${d.name} roule à ${Math.round(d.speed)} km/h (limite ${ops.limits.speed})`)
    if (d.battery < ops.limits.battery) push(d, 'battery', 'warn', `${d.name} : batterie à ${Math.round(d.battery)} %`, 300000)
    for (const z of ops.zones) {
      const now = dist(d.lat, d.lng, z.lat, z.lng) <= z.r, k = d.id + z.id
      if (k in inside && inside[k] !== now) push(d, k, 'warn', `${d.name} ${now ? 'est entré dans' : 'a quitté'} ${z.name}`, 0)
      inside[k] = now
    }
  }
  notify()
}
async function startRemote(user) {
  const { db, collection, onSnapshot, query, orderBy, limit } = await fsx()
  const list = (name, n, set) =>
    onSnapshot(query(collection(db, name), orderBy('t', 'desc'), limit(n)), (s) => { set(s.docs.map((x) => ({ ...x.data(), id: x.id }))); notify() })
  const offs = [onSnapshot(collection(db, 'zones'), (s) => { ops.zones = s.docs.map((x) => ({ ...x.data(), id: x.id })); notify() })]
  if (user.role === 'admin') { offs.push(list('alerts', 100, (a) => { ops.alerts = a })); offs.push(list('audit', 200, (a) => { ops.audit = a })) }
  return () => offs.forEach((f) => f())
}
let started = 0, off = null
export function startOps(user) {
  let stopRemote = () => {}, dead = false
  if (!DEMO) startRemote(user).then((f) => { if (dead) f(); else stopRemote = f })
  if (started++ === 0) off = fleet.subscribe(check)
  return () => { dead = true; stopRemote(); if (--started === 0) off() }
}
