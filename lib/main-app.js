const electron = require('electron')
const app = electron.app
const Menu = electron.Menu
const ipc = electron.ipcMain
const autoUpdater = electron.autoUpdater
const path = require('path')
const ChildProcess = require('child_process')
const _ = require('lodash')
const nodeIpc = require('@rokt33r/node-ipc')
const GhReleases = require('electron-gh-releases')
// electron.crashReporter.start()

require('./config')
var mainWindow = null
var finderProcess = null
var finderWindow = null
var update = null

const appRootPath = path.join(process.execPath, '../..')
const updateDotExePath = path.join(appRootPath, 'Update.exe')
const exeName = path.basename(process.execPath)

// For windows app
function spawnUpdate (args, cb) {
  var stdout = ''
  var updateProcess = null
  try {
    updateProcess = ChildProcess.spawn(updateDotExePath, args)
  } catch (e) {
    process.nextTick(function () {
      cb(e)
    })
  }

  updateProcess.stdout.on('data', function (data) {
    stdout += data
  })

  error = null
  updateProcess.on('error', function (_error) {
    error = _error
  })
  updateProcess.on('close', function (code, signal) {
    if (code !== 0) {
      error = new Error("Command failed: #{signal ? code}")
      error.code = code
      error.stdout = stdout
    }

    cb(error, stdout)
  })
}

var handleStartupEvent = function () {
  if (process.platform !== 'win32') {
    return false
  }

  var squirrelCommand = process.argv[1]
  switch (squirrelCommand) {
    case '--squirrel-install':
      spawnUpdate(['--createShortcut', exeName], function (err) {
        quitApp()
      })
      return true
    case '--squirrel-updated':
      quitApp()
      return true
    case '--squirrel-uninstall':
      spawnUpdate(['--removeShortcut', exeName], function (err) {
        quitApp()
      })
      quitApp()
      return true
    case '--squirrel-obsolete':
      quitApp()
      return true
  }
}

if (handleStartupEvent()) {
  return
}

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
  quitApp()
  return
}

var appQuit = false

var version = app.getVersion()
var versionText = (version == null || version.length === 0) ? 'DEV version' : 'v' + version
var versionNotified = false

function notify (title, body) {
  if (mainWindow != null) {
    mainWindow.webContents.send('notify', {
      title: title,
      body: body
    })
  }
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
  if (process.platform === 'linux') {
    return true
  }
  updater.check((err, status) => {
    if (err) {
      var isLatest = err.message === 'There is no newer version.'
      if (!isLatest && !versionNotified) console.error('Updater error! %s', err.message)
    }
    if (!err) {
      if (status) {
        notify('Update is available!', 'Download started.. wait for the update ready.')
        updater.download()
      } else {
        if (!versionNotified) {
          versionNotified = true
          notify('Latest Build!! ' + versionText, 'Hope you to enjoy our app :D')
        }
      }
    }
  })
}

updater.on('update-downloaded', (info) => {
  if (mainWindow != null) {
    notify('Ready to Update!', 'Click update button on Main window.')
    mainWindow.webContents.send('update-available', 'Update available!')
    isUpdateReady = true
  }
})

nodeIpc.config.id = 'node'
nodeIpc.config.retry = 1500
nodeIpc.config.silent = true

nodeIpc.serve(
  path.join(app.getPath('userData'), 'boost.service'),
  function () {
    nodeIpc.server.on(
      'connect',
      function (socket) {
        socket.on('close', function () {
          console.log('socket dead')
          if (!appQuit) spawnFinder()
        })
      }
    )
    nodeIpc.server.on(
      'message',
      function (data, socket) {
        console.log('>>', data)
        handleIpcEvent(data)
      }
    )
    nodeIpc.server.on(
      'error',
      function (err) {
        console.log('>>', err)
      }
    )
  }
)

function handleIpcEvent (payload) {
  switch (payload.type) {
    case 'show-main-window':
      switch (process.platform) {
        case 'darwin':
          mainWindow.show()
        case 'win32':
          mainWindow.minimize()
          mainWindow.restore()
        case 'linux':
          // Do nothing
          // due to bug of `app.focus()` some desktop Env
      }
      break
    case 'copy-finder':
      mainWindow.webContents.send('copy-finder')
      break
    case 'quit-app':
      quitApp()
      break
  }
}

function spawnFinder() {
  if (process.platform === 'darwin') {
    var finderArgv = [path.join(__dirname, 'finder-app.js'), '--finder']
    if (_.find(process.argv, a => a === '--hot')) finderArgv.push('--hot')
    finderProcess = ChildProcess
      .execFile(process.execPath, finderArgv)
  }
}

function quitApp () {
  appQuit = true
  if (finderProcess) finderProcess.kill()
  app.quit()
}

app.on('ready', function () {
  app.on('before-quit', function () {
    appQuit = true
    if (finderProcess) finderProcess.kill()
  })

  app.on('activate-with-no-open-windows', function(){
    mainWindow.show()
  })

  var template = require('./main-menu')
  if (process.platform === 'win32') {
    template.unshift({
      label: 'Boostnote',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'Control+Q',
          click: function (e) {
            quitApp()
          }
        }
      ]
    })
  }
  var menu = Menu.buildFromTemplate(template)
  if (process.platform === 'darwin' || process.platform === 'linux') {
    Menu.setApplicationMenu(menu)
  }

  setInterval(function () {
    checkUpdate()
  }, 1000 * 60 * 60 * 24)

  ipc.on('check-update', function (event, msg) {
    if (update == null) checkUpdate()
  })

  ipc.on('update-app', function (event, msg) {
    if (isUpdateReady) {
      appQuit = true
      updater.install()
    }
  })

  checkUpdate()

  mainWindow = require('./main-window')
  if (process.platform === 'win32' || process.platform === 'linux') {
    mainWindow.setMenu(menu)
  }

  mainWindow.on('close', function (e) {
    if (process.platform == 'darwin') {
      if (!appQuit) {
        e.preventDefault();
        mainWindow.hide();
      }
    } else {
      quitApp()
    }
  })

  switch (process.platform) {
    case 'darwin':
      spawnFinder()
      break
    case 'win32':
      finderWindow = require('./finder-window')
      finderWindow.on('close', function (e) {
        if (appQuit) return true
        e.preventDefault()
        finderWindow.hide()
      })
      break
    case 'linux':
      if (process.env.DESKTOP_SESSION === 'cinnamon') {
        finderWindow = require('./finder-window')
        finderWindow.on('close', function (e) {
          if (appQuit) return true
          e.preventDefault()
          finderWindow.hide()
        })
      }
      // Do nothing.
  }

  nodeIpc.server.start(function (err) {
    if (err.code === 'EADDRINUSE') {
      notify('Error occurs!', 'You have to kill other Boostnote processes.')
      quitApp()
    }
  })

  require('./hotkey')
})

module.exports = app

