const electron = require('electron')
const app = electron.app
const Menu = electron.Menu
const ipc = electron.ipcMain
const path = require('path')
const ChildProcess = require('child_process')
const _ = require('lodash')
const GhReleases = require('electron-gh-releases')
const fs = require('fs')

// electron.crashReporter.start()
var ipcServer = null

var mainWindow = null

// support for portable mode
const execPathDir = path.dirname(process.execPath)
const portableFile = path.join(execPathDir, '.boost-portable')
const userDataPath = fs.existsSync(portableFile) ? path.join(execPathDir, 'userdata') : app.getPath('userData')
app.setPath('userData', userDataPath)

var shouldQuit = app.makeSingleInstance(function (commandLine, workingDirectory) {
  if (mainWindow) {
    if (process.platform === 'win32') {
      mainWindow.minimize()
      mainWindow.restore()
    }
    mainWindow.focus()
  }
  return true
})

if (shouldQuit) {
  app.quit()
}

var isUpdateReady = false

var ghReleasesOpts = {
  repo: 'BoostIO/boost-releases',
  currentVersion: app.getVersion()
}

const updater = new GhReleases(ghReleasesOpts)

// Check for updates
// `status` returns true if there is a new update available
function checkUpdate () {
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

updater.on('update-downloaded', (info) => {
  if (mainWindow != null) {
    mainWindow.webContents.send('update-ready', 'Update available!')
    isUpdateReady = true
  }
})

updater.autoUpdater.on('error', (err) => {
  console.log(err)
})

ipc.on('update-app-confirm', function (event, msg) {
  if (isUpdateReady) {
    mainWindow.removeAllListeners()
    updater.install()
  }
})

function spawnFinder () {
  var finderArgv = [path.join(__dirname, 'finder-app.js'), '--finder']
  if (_.find(process.argv, a => a === '--hot')) finderArgv.push('--hot')
  var finderProcess = ChildProcess
    .execFile(process.execPath, finderArgv)

  app.on('before-quit', function () {
    finderProcess.kill()
  })
}

app.on('ready', function () {
  mainWindow = require('./main-window')

  var template = require('./main-menu')
  var menu = Menu.buildFromTemplate(template)
  switch (process.platform) {
    case 'darwin':
      spawnFinder()
      Menu.setApplicationMenu(menu)
      break
    case 'win32':
      require('./finder-window')
      mainWindow.setMenu(menu)
      break
    case 'linux':
      require('./finder-window')
      Menu.setApplicationMenu(menu)
      mainWindow.setMenu(menu)
  }

  // Check update every hour
  setInterval(function () {
    checkUpdate()
  }, 1000 * 60 * 60 * 24)

  // Check update after 10 secs to prevent file locking of Windows
  setTimeout(() => {
    checkUpdate()

    ipc.on('update-check', function (event, msg) {
      if (isUpdateReady) {
        mainWindow.webContents.send('update-ready', 'Update available!')
      } else {
        checkUpdate()
      }
    })
  }, 10000)
  ipcServer = require('./ipcServer')
  ipcServer.server.start()
})

module.exports = app
