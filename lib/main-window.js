const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')

var mainWindow = new BrowserWindow({
  width: 1080,
  height: 720,
  minWidth: 420,
  minHeight: 320,
  webPreferences: {
    zoomFactor: 1.0,
    blinkFeatures: 'OverlayScrollbars'
  }
})

const url = path.resolve(__dirname, './main.html')

mainWindow.loadURL('file://' + url)

mainWindow.webContents.on('new-window', function (e) {
  e.preventDefault()
})

mainWindow.webContents.sendInputEvent({
  type: 'keyDown',
  keyCode: '\u0008'
})

mainWindow.webContents.sendInputEvent({
  type: 'keyUp',
  keyCode: '\u0008'
})

if (process.platform !== 'linux' || process.env.DESKTOP_SESSION === 'cinnamon') {
  mainWindow.on('close', function (e) {
    if (process.platform === 'win32') {
      mainWindow.minimize()
    } else {
      mainWindow.hide()
    }
    e.preventDefault()
  })

  app.on('before-quit', function (e) {
    mainWindow.removeAllListeners()
  })
} else {
  app.on('window-all-closed', function () {
    app.quit()
  })
}

app.on('activate', function () {
  if (mainWindow == null) return null
  mainWindow.show()
})

module.exports = mainWindow
