import { useState } from 'react'
import { DEMO, register, signIn, signOutUser } from '../lib/session'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      if (mode === 'register') {
        await register(name, email, password)
        await signOutUser()
        setMode('login'); setNotice('Compte créé. Cliquez sur le lien reçu par e-mail, puis connectez-vous.'); setBusy(false)
      } else onLogin(await signIn(email, password, remember))
    }
    catch { setError('E-mail ou mot de passe incorrect.'); setBusy(false) }
  }

  return (
    <div className="login">
      <section className="login-form">
        <div className="brand"><span className="logo" />TrackPulse</div>
        <form onSubmit={submit}>
          <h1>{mode === 'register' ? 'Créer un compte' : 'Connexion à votre espace'}</h1>
          <p className="muted">{DEMO ? 'Mode démo : tout identifiant est accepté. Un e-mail contenant « admin » donne le rôle administrateur.' : 'Accès réservé aux équipes autorisées.'}</p>
          {mode === 'register' && <label>Nom complet<input value={name} onChange={(e) => setName(e.target.value)} required /></label>}
          <label>E-mail professionnel
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@entreprise.com" required />
          </label>
          <label>Mot de passe
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Rester connecté</label>
          {notice && <p className="muted" role="status">{notice}</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={busy}>{busy ? 'Patientez…' : mode === 'register' ? 'Créer le compte' : 'Se connecter'}</button>
          <button type="button" className="secondary">Continuer avec le SSO de l’entreprise</button>
          {!DEMO && <button type="button" className="secondary" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Créer un compte' : 'J’ai déjà un compte'}</button>}
        </form>
        <p className="muted small">Les positions ne sont pas suivies le week-end.</p>
      </section>
      <section className="login-preview" aria-hidden="true">
        <div className="chip"><i className="dot" style={{ background: '#16A34A' }} />Systèmes opérationnels <span className="mono">· Latence &lt; 50 ms</span></div>
        <svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice">
          <defs><pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#1E293B" strokeWidth="1" /></pattern></defs>
          <rect width="600" height="420" fill="url(#g)" />
          <path d="M0 300 C150 280 220 200 340 190 S520 120 600 90" stroke="#334155" strokeWidth="8" fill="none" />
          <path d="M180 0 C200 120 260 250 240 420" stroke="#334155" strokeWidth="5" fill="none" />
          <path d="M60 380 L220 240 L330 190" stroke="#16A34A" strokeWidth="2" strokeDasharray="4 6" fill="none" />
          {[[330, 190, '#16A34A', 40], [220, 240, '#D97706', 200], [430, 150, '#16A34A', 70], [120, 330, '#DC2626', 0]].map(([x, y, c, r], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}><circle r="10" fill={c} stroke="#0F172A" strokeWidth="3" /><path d="M0 -20L6 -9H-6Z" fill={c} /></g>
          ))}
        </svg>
        <p className="caption">Visibilité en temps réel sur l’ensemble de vos appareils.</p>
      </section>
    </div>
  )
}
