// Le suivi est suspendu le samedi et le dimanche (heure du Cameroun).
export function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7))
  const y = t.getUTCFullYear()
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7)
  return `w${y}${String(w).padStart(2, '0')}`
}

export function isWeekend(date = new Date()) {
  const day = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'Africa/Douala'
  }).format(date)
  return day === 'Sat' || day === 'Sun'
}
