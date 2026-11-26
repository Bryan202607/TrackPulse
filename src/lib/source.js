import { DEMO } from './session'
import { fleet } from './simulator'
import { weekKey } from './schedule'

const trails = new Map()
function fromDoc(id, v) {
  const p = v.position, seen = v.lastSeen?.toMillis?.() || 0
  const tr = trails.get(id) || []
  if (p && (!tr.length || tr.at(-1)[1] !== p.lat || tr.at(-1)[2] !== p.lng)) tr.push([seen || Date.now(), p.lat, p.lng])
  if (tr.length > 600) tr.shift()
  trails.set(id, tr)
  const st = v.stats?.[weekKey()] || {}
  const off = v.status !== 'active' || !p || Date.now() - seen > 300000
  const kmh = (p?.speed || 0) * 3.6
  return {
    ...v, id, user: v.userName, lat: p?.lat ?? null, lng: p?.lng ?? null, heading: p?.heading || 0, speed: kmh,
    battery: p?.battery ?? 100, signal: 3, accuracy: Math.round(p?.accuracy || 0), offline: off,
    lastSeen: seen || Date.now(), status: off ? 'offline' : kmh > 3 ? 'moving' : 'idle', trail: tr, km: st.km || 0, movingSec: st.movingSec || 0, idleSec: st.idleSec || 0
  }
}
export async function startSource(user) {
  if (DEMO) return () => {}
  const { db } = await import('../firebase'); const fs = await import('firebase/firestore')
  const base = fs.collection(db, 'devices')
  const q = user.role === 'admin' ? base : fs.query(base, fs.where('ownerUid', '==', user.uid))
  return fs.onSnapshot(q, (s) => fleet.setAll(s.docs.map((x) => fromDoc(x.id, x.data()))))
}
