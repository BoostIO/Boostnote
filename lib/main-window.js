const electron = require('electron')
const { app, BrowserWindow, Menu, MenuItem, Tray, ipcMain } = electron
const path = require('path')
const Config = require('electron-config')
const config = new Config()
const _ = require('lodash')
const manifest = require('../package.json')
const product = `${manifest.productName} ${manifest.version}`

var menu
// set up some chrome extensions
if (process.env.NODE_ENV === 'development') {
  const {
    default: installExtension,
    REACT_DEVELOPER_TOOLS,
    REACT_PERF
  } = require('electron-devtools-installer')

  require('electron-debug')({ showDevTools: false })

  const ChromeLens = {
    // ID of the extension (https://chrome.google.com/webstore/detail/chromelens/idikgljglpfilbhaboonnpnnincjhjkd)
    id: 'idikgljglpfilbhaboonnpnnincjhjkd',
    electron: '>=1.2.1'
  }

  const extensions = [REACT_DEVELOPER_TOOLS, REACT_PERF, ChromeLens]

  for (const extension of extensions) {
    try {
      installExtension(extension)
    } catch (e) {
      console.error(`[ELECTRON] Extension installation failed`, e)
    }
  }
}

const windowSize = config.get('windowsize') || {
  x: null,
  y: null,
  width: 1080,
  height: 720
}

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
  icon: path.resolve(__dirname, '../resources/app.png')
})
const url = path.resolve(__dirname, process.env.NODE_ENV === 'production' ? './main.production.html' : './main.development.html')

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

if (process.platform === 'darwin' || process.env.DESKTOP_SESSION === 'cinnamon') {
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

  mainWindow.webContents.send('tray:probe-close')
}

app.on('before-quit', function (e) {
  mainWindow.removeAllListeners()
})

app.on('window-all-closed', function () {
  app.quit()
})

mainWindow.on('resize', _.throttle(storeWindowSize, 500))
mainWindow.on('move', _.throttle(storeWindowSize, 500))

function storeWindowSize () {
  try {
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

ipcMain.on('tray:update', handleTrayUpdate)

ipcMain.on('tray:quit', function (e, notes) {
  ipcMain.removeListener('tray:update', handleTrayUpdate)
  menu = null
  app.quit()
})

function handleTrayUpdate (e, notes) {
  updateTray(notes)
}

function updateTray (notes) {
  const menu = new Menu()

  menu.append(new MenuItem({
    label: `Open ${product}`,
    click: function () {
      mainWindow.show()
    }
  }))

  if (notes && notes.length) {
    menu.append(new MenuItem({type: 'separator'}))
    notes.forEach(note => {
      menu.append(new MenuItem({
        label: note.title,
        click: function () {
          mainWindow.webContents.send('list:jump', note.key)
          mainWindow.show()
        }
      }))
    })
    menu.append(new MenuItem({type: 'separator'}))
  }

  menu.append(new MenuItem({
    label: 'Quit',
    click: function () {
      app.quit()
    }
  }))

  tray.setContextMenu(menu)

  return menu
}

const tray = new Tray(path.join(__dirname, '../resources/tray-icon-dark@2x.png'))
menu = updateTray()
tray.setToolTip(product)
tray.on('click', function (e) {
  e.preventDefault()
  tray.popUpContextMenu(menu)
})

module.exports = mainWindow
