// Sans clés Firebase (.env), l'appli tourne en mode démo : n'importe quel identifiant est accepté.
export const DEMO = !import.meta.env.VITE_FIREBASE_API_KEY
const store = () => (localStorage.getItem('demo-user') ? localStorage : sessionStorage)
const demoUser = (email) => ({ email, uid: 'demo', role: /admin/i.test(email) ? 'admin' : 'member' })

async function withRole(u) {
  const { db } = await import('../firebase'); const fs = await import('firebase/firestore')
  const s = await fs.getDoc(fs.doc(db, 'users', u.uid))
  return { email: u.email, uid: u.uid, role: s.data()?.role || 'member', verified: u.emailVerified }
}
export async function watchSession(cb) {
  if (DEMO) { const e = store().getItem('demo-user'); cb(e ? demoUser(e) : null); return () => {} }
  const { auth } = await import('../firebase'); const { onAuthStateChanged } = await import('firebase/auth')
  return onAuthStateChanged(auth, async (u) => cb(u ? await withRole(u) : null))
}
export async function signIn(email, password, remember) {
  if (DEMO) { (remember ? localStorage : sessionStorage).setItem('demo-user', email); return demoUser(email) }
  const { auth } = await import('../firebase'); const fa = await import('firebase/auth')
  await fa.setPersistence(auth, remember ? fa.browserLocalPersistence : fa.browserSessionPersistence)
  return withRole((await fa.signInWithEmailAndPassword(auth, email, password)).user)
}
export async function register(name, email, password) {
  const { auth, db } = await import('../firebase')
  const fa = await import('firebase/auth'); const fs = await import('firebase/firestore')
  const { user } = await fa.createUserWithEmailAndPassword(auth, email, password)
  await fa.sendEmailVerification(user)
  await fs.setDoc(fs.doc(db, 'users', user.uid), { name, email, role: 'member', createdAt: fs.serverTimestamp() })
  return { email, uid: user.uid, role: 'member' }
}
export async function signOutUser() {
  localStorage.removeItem('demo-user'); sessionStorage.removeItem('demo-user')
  if (!DEMO) { const { auth } = await import('../firebase'); await (await import('firebase/auth')).signOut(auth) }
}
