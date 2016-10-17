const electron = require('electron')
const app = electron.app
const Menu = electron.Menu
const ipc = electron.ipcMain
const autoUpdater = electron.autoUpdater
const path = require('path')
const ChildProcess = require('child_process')
const _ = require('lodash')
const GhReleases = require('electron-gh-releases')
// electron.crashReporter.start()
var ipcServer = null

var mainWindow = null
var finderWindow = null

var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
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
  return
}

var version = app.getVersion()
var versionText = (version == null || version.length === 0) ? 'DEV version' : 'v' + version

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

ipc.on('update-check', function (event, msg) {
  if (isUpdateReady) {
    mainWindow.webContents.send('update-ready', 'Update available!')
  } else {
    checkUpdate()
  }
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
      finderWindow = require('./finder-window')
      mainWindow.setMenu(menu)
      break
    case 'linux':
      // Finder is available on cinnamon only.
      if (process.env.DESKTOP_SESSION === 'cinnamon') {
        finderWindow = require('./finder-window')
      }
      Menu.setApplicationMenu(menu)
      mainWindow.setMenu(menu)
  }

  // Check update every hour
  setInterval(function () {
    checkUpdate()
  }, 1000 * 60 * 60)

  checkUpdate()
  ipcServer = require('./ipcServer')
  ipcServer.server.start()
})

module.exports = app

