import { lazy, Suspense, useEffect, useReducer, useState } from 'react'
import { useFleet, useOnline } from '../lib/useFleet'
import { isWeekend } from '../lib/schedule'
import { csvCell, exportTrail, hms } from '../lib/format'
import { DEMO } from '../lib/session'
import { startSource } from '../lib/source'
import { addZone, audit, ops, startOps, subscribeOps } from '../lib/ops'
import MapView from '../components/MapView.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Drawer from '../components/Drawer.jsx'
import { AlertsPanel, AuditPanel, ReportPanel, Sheet, ZonesPanel } from '../components/Panels.jsx'

const Devices = lazy(() => import('./Devices.jsx'))
const Tracker = lazy(() => import('../Tracker.jsx'))

export default function Fleet({ user, onSignOut }) {
  const { devices, loading } = useFleet()
  const { online, since } = useOnline()
  const weekend = isWeekend()
  const isAdmin = user.role === 'admin'
  const [, force] = useReducer((x) => x + 1, 0)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(true)
  const [focus, setFocus] = useState(null)
  const [replay, setReplay] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [deviceId, setDeviceId] = useState(localStorage.getItem('deviceId'))
  const selected = devices.find((d) => d.id === selectedId)

  useEffect(() => startOps(user), [user])
  useEffect(() => subscribeOps(force), [])
  useEffect(() => {
    const f = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if (e.key === '/' && !typing) { e.preventDefault(); setOpen(true); setTimeout(() => document.querySelector('.search')?.focus(), 0); return }
      if (e.key !== 'Escape') return
      if (sheet) setSheet(null)
      else if (selectedId) { setSelectedId(null); setReplay(null) }
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [sheet, selectedId])
  useEffect(() => { let off = () => {}; startSource(user).then((f) => { off = f }); return () => off() }, [user])

  // Onglet du navigateur : le nombre d'alertes s'affiche même si la fenêtre est en arrière-plan.
  useEffect(() => { document.title = ops.alerts.length ? `(${ops.alerts.length}) TrackPulse` : 'TrackPulse' })
  const select = (id) => { setSelectedId(id); setReplay(null); setFocus({ id, n: Date.now() }) }
  const doExport = (d) => { exportTrail(d); audit('Export du trajet', d.name, user.email) }
  const doZone = (d) => {
    const name = prompt('Nom de la zone ?'); const r = Number(prompt('Rayon en mètres ?', '500'))
    if (name && r > 0) addZone(name, d.lat, d.lng, r, user.email)
  }
  const exportReport = (rows) => {
    const csv = ['appareil,km,heures_route,heures_arret', ...rows.map((d) => `${csvCell(d.name)},${d.km.toFixed(1)},${(d.movingSec / 3600).toFixed(1)},${(d.idleSec / 3600).toFixed(1)}`)].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'rapport-hebdo.csv'; a.click()
    audit('Export du rapport', 'rapport-hebdo.csv', user.email)
  }
  const tabs = [['alerts', `Alertes${ops.alerts.length ? ` (${ops.alerts.length})` : ''}`], ['zones', 'Zones'], ['report', 'Rapports'],
    ...(isAdmin ? [['audit', 'Journal']] : []), ...(!DEMO ? [['devices', 'Appareils']] : [])]
  const titles = { alerts: 'Alertes', zones: 'Zones', report: 'Rapport hebdomadaire', audit: 'Journal d’audit', devices: 'Appareils' }

  return (
    <div className="fleet">
      <MapView hidden={weekend} selectedId={selectedId} onSelect={select} focus={focus} replay={replay} />
      <div className="glass topbar">
        <button className="icon" onClick={() => setOpen(!open)} aria-label="Afficher ou masquer la liste">☰</button>
        <strong>TrackPulse</strong>
        <nav className="tabs">{tabs.map(([k, l]) => <button key={k} className={sheet === k ? 'on' : ''} onClick={() => setSheet(sheet === k ? null : k)}>{l}</button>)}</nav>
        <span className="muted mono who">{user.email} · {isAdmin ? 'admin' : 'membre'}</span>
        <button className="icon txt" onClick={async () => { await Promise.race([audit('Déconnexion', '', user.email), new Promise((r) => setTimeout(r, 1500))]); onSignOut() }}>Quitter</button>
      </div>
      {open && <Sidebar {...{ devices, loading, query, setQuery, filter, setFilter, selectedId, onSelect: select }} />}
      {sheet && (
        <Sheet title={titles[sheet]} onClose={() => setSheet(null)}>
          {sheet === 'alerts' && <AlertsPanel />}
          {sheet === 'zones' && <ZonesPanel isAdmin={isAdmin} user={user} />}
          {sheet === 'report' && <ReportPanel devices={devices} onExport={exportReport} />}
          {sheet === 'audit' && <AuditPanel />}
          {sheet === 'devices' && <Suspense fallback={null}><Devices user={user} isAdmin={isAdmin} devices={devices} deviceId={deviceId} setDeviceId={setDeviceId} /></Suspense>}
        </Sheet>
      )}
      {selected && <Drawer d={selected} isAdmin={isAdmin} replay={replay} setReplay={setReplay} onClose={() => { setSelectedId(null); setReplay(null) }} onCenter={(id) => setFocus({ id, n: Date.now() })} onExport={doExport} onZone={doZone} />}
      {!online && <div className="banner bad" role="status">Connexion perdue. Données figées à <span className="mono">{hms(since)}</span>.</div>}
      {!DEMO && user.verified === false && <div className="banner" style={{ bottom: 152 }} role="status">E-mail non vérifié : vérifiez-le puis reconnectez-vous pour enregistrer un appareil.</div>}
      {weekend && <div className="banner" role="status">Suivi suspendu pendant le week-end. Il reprend lundi.</div>}
      {!DEMO && deviceId && <Suspense fallback={null}><Tracker deviceId={deviceId} onGone={() => { localStorage.removeItem('deviceId'); setDeviceId(null) }} /></Suspense>}
    </div>
  )
}
