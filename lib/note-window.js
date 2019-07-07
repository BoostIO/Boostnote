const electron = require('electron')
const { app, remote } = electron
const { BrowserWindow } = remote
const path = require('path')
const Config = require('electron-config')
const config = new Config()
const _ = require('lodash')

const windowSize = config.get('windowsize') || {
  x: null,
  y: null,
  width: 1080,
  height: 720
}

function createNewWindow (basepath, currentNote) {
  const mainWindow = new BrowserWindow({
    x: windowSize.x,
    y: windowSize.y,
    width: windowSize.width,
    height: windowSize.height,
    useContentSize: true,
    minWidth: 500,
    minHeight: 320,
    webPreferences: {
      zoomFactor: 1.0,
      enableBlinkFeatures: 'OverlayScrollbars'
    },
    icon: path.resolve(basepath, '../resources/app.png')
  })
  const url = path.resolve(basepath, './main.development.html')

  mainWindow.loadURL('file://' + url)
  mainWindow.setMenuBarVisibility(false)

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

  if (process.platform === 'darwin') {
    mainWindow.on('close', function (e) {
      e.preventDefault()
      if (mainWindow.isFullScreen()) {
        mainWindow.once('leave-full-screen', function () {
          mainWindow.hide()
        })
        mainWindow.setFullScreen(false)
      } else {
        mainWindow.hide()
      }
    })

    app.on('before-quit', function (e) {
      mainWindow.removeAllListeners()
    })
  }

  const storeWindowSize = () => {
    try {
      config.set('windowsize', mainWindow.getBounds())
    } catch (e) {
      // ignore any errors because an error occurs only on update
      // refs: https://github.com/BoostIO/Boostnote/issues/243
    }
  }

  mainWindow.on('resize', _.throttle(storeWindowSize, 500))
  mainWindow.on('move', _.throttle(storeWindowSize, 500))
  mainWindow.show()
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('set-current-note', currentNote)
  })
}

module.exports = {
  createNewWindow
}
