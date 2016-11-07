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

var shouldOpenUrl = false;
var urlToOpen = '';

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

function openURL (url) {
  //verify that url matches boostnote custom url scheme
  let boostnoteUrlScheme = 'boost';
  let urlPrefix = boostnoteUrlScheme + '://';
  if (url.substring(0, urlPrefix.length) != urlPrefix) return;

  //extract note uniqueKey from url
  let uniqueKey = url.substring(urlPrefix.length, url.length);
  //DEBUG : const uniqueKey
  //let uniqueKey = 'd10cfc66ee6219028db8-4e35671f4545a6da975b'; //dri note uniqueKey
  //let uniqueKey = '32e4d3ba364e2d9e0f58-dbb26b49dd71c3e353c4'; //Welcome note uniqueKey

  //send message to NoteList to show note corresponding to uniqueKey
  mainWindow.webContents.send('ipc-open-note', uniqueKey);
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
  
  mainWindow.webContents.on('did-finish-load', function () {
    //if app was launched with open-url
    if (shouldOpenUrl) {
      openURL(urlToOpen);
      shouldOpenUrl = false;
    }
  });
})

//Listen to custom protocol incoming messages (if app not started, called before ready event)
app.on('open-url', function (event, url) {
  event.preventDefault();
  //open URL if app ready - if not it means app was closed when URL was clicked. URL will be opened once app has fully loaded (webContents did-finish-load).
  if (app.isReady()) openURL(url);
  else { shouldOpenUrl = true; urlToOpen = url; }

});

module.exports = app

