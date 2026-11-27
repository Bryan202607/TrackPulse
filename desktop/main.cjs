// Fenêtre Windows de TrackPulse : charge le site compilé (dossier app/), sans accès réseau autre que la carte.
const { app, BrowserWindow, Menu, session, shell } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    title: 'TrackPulse', backgroundColor: '#F8FAFC',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  })
  win.loadFile(path.join(__dirname, 'app', 'index.html'))
  // Les liens externes s'ouvrent dans le navigateur ; la fenêtre ne navigue jamais ailleurs.
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) e.preventDefault() })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  // Aucune permission (position, caméra...) n'est accordée : le suivi se fait depuis les téléphones.
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))
  createWindow()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
