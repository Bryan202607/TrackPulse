import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const TYPES = { phone: 'Téléphone', tablet: 'Tablette', computer: 'Ordinateur' }
const ACTIONS = { disconnect: 'déconnexion', delete: 'suppression' }

export default function Devices({ user, isAdmin, devices, deviceId, setDeviceId }) {
  const [form, setForm] = useState({ name: '', brand: '', color: '#0f4c5c', userName: '', type: 'phone' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function register(e) {
    e.preventDefault()
    const ref = await addDoc(collection(db, 'devices'), {
      ...form, ownerUid: user.uid, status: 'active', pendingAction: null, position: null, createdAt: serverTimestamp()
    })
    localStorage.setItem('deviceId', ref.id)
    setDeviceId(ref.id)
  }

  const request = (d, action) => updateDoc(doc(db, 'devices', d.id), { pendingAction: action })
  const reject = (d) => updateDoc(doc(db, 'devices', d.id), { pendingAction: null })
  const approve = (d) =>
    d.pendingAction === 'delete'
      ? deleteDoc(doc(db, 'devices', d.id))
      : updateDoc(doc(db, 'devices', d.id), { status: 'disconnected', pendingAction: null })

  return (
    <>
      {!deviceId && (
        <form className="card" onSubmit={register}>
          <h2>Enregistrer cet appareil</h2>
          <label>Type
            <select value={form.type} onChange={set('type')}>
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Nom de l’appareil<input value={form.name} onChange={set('name')} required /></label>
          <label>Marque<input value={form.brand} onChange={set('brand')} required /></label>
          <label>Nom de l’utilisateur<input value={form.userName} onChange={set('userName')} required /></label>
          <label>Couleur d’identification<input type="color" value={form.color} onChange={set('color')} /></label>
          <button type="submit">Enregistrer et activer le suivi</button>
        </form>
      )}

      <h2>Appareils</h2>
      {devices.length === 0 && <p className="muted">Aucun appareil enregistré.</p>}
      {devices.map((d) => (
        <div className="card row" key={d.id}>
          <span className="dot" style={{ background: d.color }} />
          <div className="grow">
            <strong>{d.name}</strong> <span className="muted">· {TYPES[d.type]} {d.brand}</span>
            <div className="muted">{d.userName} · {d.status === 'active' ? 'actif' : 'déconnecté'}</div>
            {d.pendingAction && <div className="badge">Demande de {ACTIONS[d.pendingAction]} en attente</div>}
          </div>
          {d.pendingAction ? (
            isAdmin && (
              <>
                <button onClick={() => approve(d)}>Approuver</button>
                <button className="ghost" onClick={() => reject(d)}>Refuser</button>
              </>
            )
          ) : (
            <>
              {d.status === 'active' && <button className="ghost" onClick={() => request(d, 'disconnect')}>Déconnecter</button>}
              <button className="ghost" onClick={() => request(d, 'delete')}>Supprimer</button>
            </>
          )}
        </div>
      ))}
    </>
  )
}
