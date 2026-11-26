import { hms } from '../lib/format'
import { ops, removeZone } from '../lib/ops'

export const Sheet = ({ title, onClose, children }) => (
  <aside className="panel sheet">
    <header><strong>{title}</strong><button className="icon" onClick={onClose} aria-label="Fermer">✕</button></header>
    <div className="sheet-body">{children}</div>
  </aside>
)

export function AlertsPanel() {
  if (!ops.alerts.length) return <p className="muted">Aucune alerte pour le moment. Limites : {ops.limits.speed} km/h, batterie {ops.limits.battery} %.</p>
  return ops.alerts.map((a) => (
    <div className="kv" key={a.id}>
      <span><i className="dot" style={{ background: a.level === 'bad' ? '#DC2626' : '#D97706' }} /> {a.text}</span>
      <span className="mono">{hms(a.t)}</span>
    </div>
  ))
}

export function ZonesPanel({ isAdmin, user }) {
  return (
    <>
      {ops.zones.map((z) => (
        <div className="kv" key={z.id}>
          <span>{z.name} <span className="mono muted">{z.r} m</span></span>
          {isAdmin && <button className="icon txt" onClick={() => confirm(`Supprimer la zone « ${z.name} » ?`) && removeZone(z, user.email)}>Supprimer</button>}
        </div>
      ))}
      <p className="muted small">{isAdmin ? 'Pour créer une zone : ouvrez un appareil, puis « Créer une zone ici ».' : 'Seul un administrateur peut modifier les zones.'}</p>
    </>
  )
}

export function ReportPanel({ devices, onExport }) {
  const rows = [...devices].sort((a, b) => b.km - a.km)
  return (
    <>
      <p className="muted small">Semaine en cours. Distance, temps de route et temps d’arrêt par appareil.</p>
      <table>
        <thead><tr><th>Appareil</th><th>Km</th><th>Route</th><th>Arrêt</th><th>Alertes</th></tr></thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td className="mono">{d.km.toFixed(1)}</td>
              <td className="mono">{(d.movingSec / 3600).toFixed(1)} h</td>
              <td className="mono">{(d.idleSec / 3600).toFixed(1)} h</td>
              <td className="mono">{ops.alerts.filter((a) => a.deviceId === d.id).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="secondary" onClick={() => onExport(rows)}>Exporter en CSV</button>
    </>
  )
}

export function AuditPanel() {
  if (!ops.audit.length) return <p className="muted">Aucune action enregistrée.</p>
  return ops.audit.map((a) => (
    <div className="kv" key={a.t + a.action}>
      <span><strong>{a.action}</strong> <span className="muted">{a.detail}</span><br /><span className="muted small">{a.user}</span></span>
      <span className="mono">{hms(a.t)}</span>
    </div>
  ))
}
