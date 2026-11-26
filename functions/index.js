// Alertes 24 h/24 (jours ouvrés) : vitesse, batterie, entrée/sortie de zone.
const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

initializeApp()
const db = getFirestore()
const LIMITS = { speed: 60, battery: 20 }
const meters = (a, b, c, d) => Math.hypot((a - c) * 111320, (b - d) * 111320 * Math.cos((a * Math.PI) / 180))
const weekend = () => ['Sat', 'Sun'].includes(new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Africa/Douala' }).format())

exports.checkDevice = onDocumentWritten('devices/{id}', async (event) => {
  const after = event.data?.after?.data(), before = event.data?.before?.data()
  if (!after?.position || weekend()) return
  const p = after.position, bp = before?.position, kmh = (p.speed || 0) * 3.6
  const out = []
  if (kmh > LIMITS.speed) out.push(['speed', 'bad', `${after.name} roule à ${Math.round(kmh)} km/h (limite ${LIMITS.speed})`])
  if (p.battery < LIMITS.battery && !(bp?.battery < LIMITS.battery)) out.push(['battery', 'warn', `${after.name} : batterie à ${Math.round(p.battery)} %`])
  const zones = (await db.collection('zones').get()).docs.map((d) => ({ ...d.data(), id: d.id }))
  for (const z of zones) {
    const now = meters(p.lat, p.lng, z.lat, z.lng) <= z.r
    const was = bp ? meters(bp.lat, bp.lng, z.lat, z.lng) <= z.r : now
    if (now !== was) out.push([`zone${z.id}`, 'warn', `${after.name} ${now ? 'est entré dans' : 'a quitté'} ${z.name}`])
  }
  const t = Date.now(), minute = Math.floor(t / 60000)
  // create() échoue si le document existe : une seule alerte par type et par minute.
  await Promise.all(out.map(([type, level, text]) => {
    const id = `${event.params.id}_${type}_${minute}`.replace(/\W/g, '_')
    return db.collection('alerts').doc(id).create({ id, t, level, type, deviceId: event.params.id, device: after.name, ownerUid: after.ownerUid || null, text }).catch(() => {})
  }))
})
