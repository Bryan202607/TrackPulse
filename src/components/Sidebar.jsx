import { STATUS, ago } from '../lib/format'

export const Signal = ({ n }) => (
  <span className="sig" aria-label={`Signal ${n}/4`}>{[0, 1, 2, 3].map((i) => <i key={i} className={i < n ? 'on' : ''} style={{ height: 4 + i * 3 }} />)}</span>
)
const FILTERS = [['all', 'Tous'], ['moving', 'En mouvement'], ['idle', 'À l’arrêt'], ['offline', 'Hors ligne']]

export default function Sidebar({ devices, loading, query, setQuery, filter, setFilter, selectedId, onSelect }) {
  const count = (k) => (k === 'all' ? devices.length : devices.filter((d) => d.status === k).length)
  const list = devices.filter((d) => (filter === 'all' || d.status === filter) && `${d.name} ${d.user} ${d.id}`.toLowerCase().includes(query.toLowerCase()))
  return (
    <aside className="panel side">
      <input className="search" placeholder="Rechercher un appareil, un utilisateur…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="filters">
        {FILTERS.map(([k, l]) => (
          <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l} <span className="mono">{loading ? '–' : count(k)}</span></button>
        ))}
      </div>
      <div className="list">
        {loading && Array.from({ length: 7 }, (_, i) => <div key={i} className="skel" />)}
        {!loading && list.length === 0 && <p className="muted pad">Aucun appareil ne correspond.</p>}
        {!loading && list.map((d) => (
          <button key={d.id} className={`item ${selectedId === d.id ? 'on' : ''}`} onClick={() => onSelect(d.id)}>
            <i className="dot" style={{ background: STATUS[d.status].color }} />
            <span className="grow"><strong>{d.name}</strong><small>{d.user}</small></span>
            <span className="meta">
              <span className="mono">{Math.round(d.battery)}%</span>
              <Signal n={d.offline ? 0 : d.signal} />
              <small>{ago(d.lastSeen)}</small>
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
