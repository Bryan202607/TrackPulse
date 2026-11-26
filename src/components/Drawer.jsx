import { useRef } from 'react'
import { STATUS, ago, coord, exportTrail, hms, nearestPlace } from '../lib/format'
import { Signal } from './Sidebar.jsx'

const Row = ({ k, v, mono }) => <div className="kv"><span>{k}</span><span className={mono ? 'mono' : ''}>{v}</span></div>

const project = (v, rate = 0.998) => ((v / 1000) * rate) / (1 - rate) // v en px/s
const rubber = (o, dim = 300, c = 0.55) => (o * dim * c) / (dim + c * Math.abs(o))

// Feuille basse (mobile) : suit le doigt 1:1, reprend depuis la position affichée, décide selon la vitesse.
function useSheetDrag(onClose) {
  const ref = useRef(null), g = useRef(null)
  const y = () => new DOMMatrix(getComputedStyle(ref.current).transform).m42
  return {
    ref,
    handlers: {
      onPointerDown(e) {
        e.currentTarget.setPointerCapture(e.pointerId)
        const y0 = y()
        ref.current.style.transition = 'none'
        g.current = { start: e.clientY, y0, hist: [[e.timeStamp, e.clientY]] }
      },
      onPointerMove(e) {
        if (!g.current) return
        g.current.hist.push([e.timeStamp, e.clientY]); if (g.current.hist.length > 5) g.current.hist.shift()
        const dy = g.current.y0 + e.clientY - g.current.start
        ref.current.style.transform = `translateY(${dy < 0 ? rubber(dy) : dy}px)`
      },
      onPointerUp() {
        if (!g.current) return
        const [t0, a] = g.current.hist[0], [t1, b] = g.current.hist.at(-1)
        const v = t1 > t0 ? ((b - a) / (t1 - t0)) * 1000 : 0
        g.current = null
        const el = ref.current
        el.style.transition = 'transform 320ms cubic-bezier(.2,.9,.25,1)'
        if (y() + project(v) > el.offsetHeight * 0.5) { el.style.transform = 'translateY(110%)'; setTimeout(onClose, 240) }
        else el.style.transform = 'translateY(0)'
      }
    }
  }
}

export default function Drawer({ d, isAdmin, replay, setReplay, onClose, onCenter, onExport, onZone }) {
  const last = Math.max(0, d.trail.length - 1)
  const { ref, handlers } = useSheetDrag(onClose)
  const s = STATUS[d.status]
  return (
    <aside className="panel drawer" ref={ref}>
      <div className="grab" {...handlers} aria-hidden="true" />
      <header>
        <div><strong>{d.name}</strong><div className="mono muted">{d.id}</div></div>
        <button className="icon" onClick={onClose} aria-label="Fermer">✕</button>
      </header>
      <span className="pill" style={{ color: s.color, borderColor: s.color }}><i className="dot" style={{ background: s.color }} />{s.label}</span>
      <section>
        <Row k="Utilisateur" v={d.user} />
        <Row k="Vitesse" v={`${Math.round(d.speed)} km/h`} mono />
        <Row k="Cap" v={`${Math.round(d.heading)}°`} mono />
        <Row k="Batterie" v={`${Math.round(d.battery)}%`} mono />
        <Row k="Signal" v={<Signal n={d.offline ? 0 : d.signal} />} />
        <Row k="Position" v={`${coord(d.lat)}, ${coord(d.lng)}`} mono />
        <Row k="Précision" v={`± ${d.accuracy} m`} mono />
        <Row k="Adresse (approx.)" v={nearestPlace(d.lat, d.lng)} />
        <Row k="Dernière mise à jour" v={ago(d.lastSeen)} />
      </section>
      <section>
        <h3>Trajet récent</h3>
        {d.trail.length === 0 && <p className="muted">Aucun point enregistré.</p>}
        {d.trail.slice(-5).reverse().map((p) => (
          <div className="kv" key={p[0]}><span className="mono">{hms(p[0])}</span><span className="mono">{coord(p[1])}, {coord(p[2])}</span></div>
        ))}
      </section>
      <section>
        <h3>Relecture</h3>
        {replay?.id === d.id ? (
          <>
            <input type="range" min="0" max={last} value={Math.min(replay.i, last)} onChange={(e) => setReplay({ id: d.id, i: Number(e.target.value) })} aria-label="Position dans le trajet" />
            <div className="kv"><span className="mono">{d.trail[replay.i] ? hms(d.trail[replay.i][0]) : '–'}</span><button className="icon txt" onClick={() => setReplay(null)}>Arrêter</button></div>
          </>
        ) : (
          <button className="secondary" disabled={d.trail.length < 2} onClick={() => setReplay({ id: d.id, i: last })}>Relire le trajet</button>
        )}
        {isAdmin && <button className="secondary" style={{ marginTop: 8 }} onClick={() => onZone(d)}>Créer une zone ici</button>}
      </section>
      <div className="actions">
        <button className="primary" onClick={() => onCenter(d.id)}>Centrer</button>
        <button className="secondary" onClick={() => onExport(d)} disabled={!d.trail.length}>Exporter le trajet</button>
      </div>
    </aside>
  )
}
