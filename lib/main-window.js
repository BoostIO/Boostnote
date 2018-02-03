const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const Config = require('electron-config')
const config = new Config()
const _ = require('lodash')

var showMenu = process.platform !== 'win32'
const windowSize = config.get('windowsize') || { width: 1080, height: 720 }
console.log(windowSize)
const mainWindow = new BrowserWindow({
  width: windowSize.width,
  height: windowSize.height,
  minWidth: 500,
  minHeight: 320,
  autoHideMenuBar: showMenu,
  webPreferences: {
    zoomFactor: 1.0,
    blinkFeatures: 'OverlayScrollbars'
  },
  icon: path.resolve(__dirname, '../resources/app.png')
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
    e.preventDefault()
    if (process.platform === 'win32') {
      quitApp()
    } else {
      if (mainWindow.isFullScreen()) {
        mainWindow.once('leave-full-screen', function () {
          mainWindow.hide()
        })
        mainWindow.setFullScreen(false)
      } else {
        mainWindow.hide()
      }
    }
  })

  app.on('before-quit', function (e) {
    mainWindow.removeAllListeners()
  })
} else {
  app.on('window-all-closed', function () {
    app.quit()
  })
}
mainWindow.on('resize', _.throttle(storeWindowSize, 500))
function quitApp () {
  app.quit()
}

function storeWindowSize () {
  try {
    console.log(mainWindow.getBounds())
    config.set('windowsize', mainWindow.getBounds())
  } catch (e) {
    // ignore any errors because an error occurs only on update
    // refs: https://github.com/BoostIO/Boostnote/issues/243
  }
}

app.on('activate', function () {
  if (mainWindow == null) return null
  mainWindow.show()
})

module.exports = mainWindow
