export const STATUS = {
  moving: { label: 'En mouvement', color: '#16A34A' },
  idle: { label: 'À l’arrêt', color: '#D97706' },
  offline: { label: 'Hors ligne', color: '#DC2626' }
}
export const PLACES = [
  { n: 'Akwa, Douala', lat: 4.0485, lng: 9.705 }, { n: 'Bonanjo, Douala', lat: 4.0436, lng: 9.6931 },
  { n: 'Bonapriso, Douala', lat: 4.0291, lng: 9.699 }, { n: 'Deido, Douala', lat: 4.059, lng: 9.7145 },
  { n: 'Bonamoussadi, Douala', lat: 4.087, lng: 9.738 }, { n: 'Makepe, Douala', lat: 4.063, lng: 9.762 },
  { n: 'Bastos, Yaoundé', lat: 3.8933, lng: 11.51 }, { n: 'Mokolo, Yaoundé', lat: 3.876, lng: 11.5064 },
  { n: 'Essos, Yaoundé', lat: 3.868, lng: 11.537 }, { n: 'Biyem-Assi, Yaoundé', lat: 3.834, lng: 11.478 },
  { n: 'Mvog-Mbi, Yaoundé', lat: 3.83, lng: 11.518 }, { n: 'Nlongkak, Yaoundé', lat: 3.883, lng: 11.516 }
]
export const ago = (ts) => {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  return s < 5 ? 'à l’instant' : s < 60 ? `il y a ${s} s` : s < 3600 ? `il y a ${Math.round(s / 60)} min` : `il y a ${Math.round(s / 3600)} h`
}
export const hms = (ts) => new Date(ts).toLocaleTimeString('fr-FR')
export const csvCell = (v) => {
  let s = String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}` // évite l'injection de formule dans Excel
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
export const coord = (v) => v.toFixed(5)
export function nearestPlace(lat, lng) {
  let best = PLACES[0], bd = Infinity
  for (const p of PLACES) { const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2; if (d < bd) { bd = d; best = p } }
  return best.n
}
export function exportTrail(d) {
  const rows = d.trail.map(([t, la, ln]) => `${new Date(t).toISOString()},${la},${ln}`)
  const blob = new Blob([`horodatage,latitude,longitude\n${rows.join('\n')}`], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = `trajet-${d.id}.csv`; a.click()
  URL.revokeObjectURL(a.href)
}
