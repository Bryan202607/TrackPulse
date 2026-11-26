import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import { fleet } from '../lib/simulator'
import { STATUS } from '../lib/format'
import { ops, subscribeOps } from '../lib/ops'

const icon = (status, heading) =>
  L.divIcon({
    className: '', iconSize: [28, 28],
    html: `<svg width="28" height="28" viewBox="0 0 28 28" style="transform:rotate(${heading}deg)"><path d="M14 1l6 10H8z" fill="${STATUS[status].color}"/><circle cx="14" cy="15" r="8" fill="${STATUS[status].color}" stroke="#fff" stroke-width="2"/></svg>`
  })

// Les marqueurs sont déplacés directement sur la couche Leaflet : aucun re-rendu React à chaque position.
function Layer({ hidden, selectedId, onSelect, focus, fit, replay }) {
  const map = useMap()
  const sel = useRef(selectedId), pick = useRef(onSelect)
  sel.current = selectedId; pick.current = onSelect

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 45,
      iconCreateFunction: (c) => L.divIcon({ html: `<div class="cl">${c.getChildCount()}</div>`, className: '', iconSize: [34, 34] })
    })
    const trail = L.polyline([], { color: '#0F172A', weight: 3, opacity: 0.55, dashArray: '4 6' }).addTo(map)
    const markers = {}
    map.addLayer(group)
    const zl = L.layerGroup().addTo(map)
    const drawZones = () => {
      zl.clearLayers()
      ops.zones.forEach((z) => L.circle([z.lat, z.lng], { radius: z.r, color: '#1D4ED8', weight: 1.5, fillOpacity: 0.06 }).bindTooltip(Object.assign(document.createElement('span'), { textContent: z.name })).addTo(zl))
    }
    drawZones()
    const offZ = subscribeOps(drawZones)
    const render = () => {
      if (hidden) return
      for (const d of fleet.getAll()) {
        if (d.lat == null) continue
        const key = d.status + Math.round(d.heading / 10)
        let m = markers[d.id]
        if (!m) {
          m = L.marker([d.lat, d.lng], { icon: icon(d.status, d.heading) }).on('click', () => pick.current(d.id))
          m._k = key; markers[d.id] = m; group.addLayer(m)
        } else {
          m.setLatLng([d.lat, d.lng])
          if (m._k !== key) { m.setIcon(icon(d.status, d.heading)); m._k = key }
        }
      }
      group.refreshClusters()
      const s = fleet.getAll().find((d) => d.id === sel.current)
      trail.setLatLngs(s ? s.trail.map((p) => [p[1], p[2]]) : [])
    }
    render()
    const off = fleet.subscribe(render)
    return () => { off(); offZ(); map.removeLayer(group); trail.remove(); zl.remove() }
  }, [map, hidden])

  useEffect(() => {
    const pts = fleet.getAll().map((d) => [d.lat, d.lng])
    if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [80, 80], maxZoom: 13 })
  }, [fit])

  useEffect(() => {
    const d = focus && fleet.getAll().find((x) => x.id === focus.id)
    if (d) map.flyTo([d.lat, d.lng], 15, { duration: 0.8 })
  }, [focus])
  const rm = useRef(null)
  useEffect(() => {
    const d = replay && fleet.getAll().find((x) => x.id === replay.id)
    const pt = d && d.trail[Math.min(replay.i, d.trail.length - 1)]
    if (!pt) { rm.current?.remove(); rm.current = null; return }
    const ll = [pt[1], pt[2]]
    if (!rm.current) rm.current = L.circleMarker(ll, { radius: 9, color: '#1D4ED8', fillColor: '#fff', fillOpacity: 1, weight: 3 }).addTo(map)
    else rm.current.setLatLng(ll)
    map.panTo(ll)
  }, [replay])
  useEffect(() => () => rm.current?.remove(), [])
  return null
}

export default function MapView(props) {
  const [fit, setFit] = useState(0)
  return (
    <>
      <MapContainer center={[3.95, 10.6]} zoom={8} zoomControl={false} className="map">
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        <ZoomControl position="bottomright" />
        <Layer {...props} fit={fit} />
      </MapContainer>
      <button className="glass fitbtn" onClick={() => setFit((f) => f + 1)}>Recentrer la flotte</button>
    </>
  )
}
