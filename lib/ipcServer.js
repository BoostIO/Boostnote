const nodeIpc = require('node-ipc')
const { app, Menu, globalShortcut, ipcMain } = require('electron')
const path = require('path')
const mainWindow = require('./main-window')

nodeIpc.config.id = 'node'
nodeIpc.config.retry = 1500
nodeIpc.config.silent = true

function toggleMainWindow () {
  switch (global.process.platform) {
    case 'darwin':
      if (mainWindow.isFocused()) {
        Menu.sendActionToFirstResponder('hide:')
      } else {
        mainWindow.show()
      }
      return
    default:
      if (mainWindow.isFocused()) {
        mainWindow.minimize()
      } else {
        mainWindow.minimize()
        mainWindow.restore()
      }
  }
}

function toggleFinder () {
  nodeIpc.server.broadcast('open-finder')
}

ipcMain.on('config-renew', (e, payload) => {
  nodeIpc.server.broadcast('config-renew', payload)

  globalShortcut.unregisterAll()
  var { config } = payload

  var errors = []
  try {
    globalShortcut.register(config.hotkey.toggleFinder, toggleFinder)
  } catch (err) {
    errors.push('toggleFinder')
  }
  try {
    globalShortcut.register(config.hotkey.toggleMain, toggleMainWindow)
  } catch (err) {
    errors.push('toggleMain')
  }
  if (!config.silent) {
    if (errors.length === 0) {
      mainWindow.webContents.send('APP_SETTING_DONE', {})
    } else {
      mainWindow.webContents.send('APP_SETTING_ERROR', {
        message: 'Failed to apply hotkey: ' + errors.join(' ')
      })
    }
  }
})

ipcMain.on('boostnote-loaded', (event, msg) => {
  console.log('cccccccccccccccc')
  event.sender.send('load-plugins')
})

nodeIpc.serve(
  path.join(app.getPath('userData'), 'boostnote.service'),
  function () {
    nodeIpc.server.on('open-main-from-finder', toggleMainWindow)

    nodeIpc.server.on('quit-from-finder', function () {
      app.quit()
    })

    nodeIpc.server.on('connect', function (socket) {
      nodeIpc.log('ipc server >> socket joinned'.rainbow)
      socket.on('close', function () {
        nodeIpc.log('ipc server >> socket closed'.rainbow)
      })
    })
    nodeIpc.server.on('error', function (err) {
      nodeIpc.log('Node IPC error'.rainbow, err)
    })

    // Todo: Direct connection between Main window renderer & Finder window renderer
    nodeIpc.server.on('request-data-from-finder', function () {
      nodeIpc.server.broadcast('request-data-from-finder')
    })
    nodeIpc.server.on('throttle-data', function (payload) {
      nodeIpc.server.broadcast('throttle-data', payload)
    })
  }
)

module.exports = nodeIpc
