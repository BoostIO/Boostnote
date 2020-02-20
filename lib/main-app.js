const electron = require('electron')
const app = electron.app
const Menu = electron.Menu
const ipc = electron.ipcMain
const GhReleases = require('electron-gh-releases')
const { isPackaged } = app
const electronConfig = new (require('electron-config'))()
// electron.crashReporter.start()
const singleInstance = app.requestSingleInstanceLock()

var ipcServer = null

var mainWindow = null

// Single Instance Lock
if (!singleInstance) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, it should focus the existing instance.
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  })
}

var isUpdateReady = false

var ghReleasesOpts = {
  repo: 'BoostIO/boost-releases',
  currentVersion: app.getVersion()
}

const updater = new GhReleases(ghReleasesOpts)

// Check for updates
// `status` returns true if there is a new update available
function checkUpdate() {
  if (!isPackaged) {
    // Prevents app from attempting to update when in dev mode.
    console.log('Updates are disabled in Development mode, see main-app.js')
    return true
  }
  if (!electronConfig.get('autoUpdateEnabled', true)) return
  if (process.platform === 'linux' || isUpdateReady) {
    return true
  }
  updater.check((err, status) => {
    if (err) {
      var isLatest = err.message === 'There is no newer version.'
      if (!isLatest) console.error('Updater error! %s', err.message)
      return
    }
    if (status) {
      mainWindow.webContents.send('update-found', 'Update available!')
      updater.download()
    }
  })
}

updater.on('update-downloaded', info => {
  if (mainWindow != null) {
    mainWindow.webContents.send('update-ready', 'Update available!')
    isUpdateReady = true
  }
})

updater.autoUpdater.on('error', err => {
  console.error(err)
})

ipc.on('update-app-confirm', function(event, msg) {
  if (isUpdateReady) {
    mainWindow.removeAllListeners()
    updater.install()
  }
})

app.on('window-all-closed', function() {
  app.quit()
})

app.on('ready', function() {
  mainWindow = require('./main-window')

  var template = require('./main-menu')
  var menu = Menu.buildFromTemplate(template)
  var touchBarMenu = require('./touchbar-menu')
  switch (process.platform) {
    case 'darwin':
      Menu.setApplicationMenu(menu)
      mainWindow.setTouchBar(touchBarMenu)
      break
    case 'win32':
      mainWindow.setMenu(menu)
      break
    case 'linux':
      Menu.setApplicationMenu(menu)
      mainWindow.setMenu(menu)
  }

  // Check update every day
  setInterval(function() {
    if (isPackaged) checkUpdate()
  }, 1000 * 60 * 60 * 24)

  // Check update after 10 secs to prevent file locking of Windows
  setTimeout(() => {
    if (isPackaged) checkUpdate()

    ipc.on('update-check', function(event, msg) {
      if (isUpdateReady) {
        mainWindow.webContents.send('update-ready', 'Update available!')
      } else {
        checkUpdate()
      }
    })
  }, 10 * 1000)
  ipcServer = require('./ipcServer')
  ipcServer.server.start()
})

module.exports = app
