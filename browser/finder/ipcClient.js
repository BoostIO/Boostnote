const nodeIpc = require('node-ipc')
const { remote, ipcRenderer } = require('electron')
const { app, Menu } = remote
const path = require('path')
const store = require('./store')
const consts = require('browser/lib/consts')

nodeIpc.config.id = 'finder'
nodeIpc.config.retry = 1500
nodeIpc.config.silent = true

function killFinder () {
  let finderWindow = remote.getCurrentWindow()
  finderWindow.removeAllListeners()
  if (global.process.platform === 'darwin') {
    // Only OSX has another app process.
    nodeIpc.of.node.emit('quit-from-finder')
  } else {
    finderWindow.close()
  }
}

function toggleFinder () {
  let finderWindow = remote.getCurrentWindow()
  if (global.process.platform === 'darwin') {
    if (finderWindow.isVisible()) {
      finderWindow.hide()
      Menu.sendActionToFirstResponder('hide:')
    } else {
      nodeIpc.of.node.emit('request-data-from-finder')
      finderWindow.show()
    }
  } else {
    if (finderWindow.isVisible()) {
      finderWindow.blur()
      finderWindow.hide()
    } else {
      nodeIpc.of.node.emit('request-data-from-finder')
      finderWindow.show()
      finderWindow.focus()
    }
  }
}

nodeIpc.connectTo(
  'node',
  path.join(app.getPath('userData'), 'boostnote.service'),
  function () {
    nodeIpc.of.node.on('error', function (err) {
      console.log(err)
    })
    nodeIpc.of.node.on('connect', function () {
      console.log('Connected successfully')
    })
    nodeIpc.of.node.on('disconnect', function () {
      console.log('disconnected')
    })

    nodeIpc.of.node.on('open-finder', function () {
      toggleFinder()
    })

    ipcRenderer.on('open-finder-from-tray', function () {
      toggleFinder()
    })
    ipcRenderer.on('open-main-from-tray', function () {
      nodeIpc.of.node.emit('open-main-from-finder')
    })

    ipcRenderer.on('quit-from-tray', function () {
      nodeIpc.of.node.emit('quit-from-finder')
      killFinder()
    })

    nodeIpc.of.node.on('throttle-data', function (payload) {
      console.log('Received data from Main renderer')
      store.default.dispatch({
        type: 'THROTTLE_DATA',
        data: payload
      })
    })

    nodeIpc.of.node.on('config-renew', function (payload) {
      const { config } = payload
      if (config.ui.theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark')
      } else {
        document.body.setAttribute('data-theme', 'default')
      }

      let editorTheme = document.getElementById('editorTheme')
      if (editorTheme == null) {
        editorTheme = document.createElement('link')
        editorTheme.setAttribute('id', 'editorTheme')
        editorTheme.setAttribute('rel', 'stylesheet')
        document.head.appendChild(editorTheme)
      }

      config.editor.theme = consts.THEMES.some((theme) => theme === config.editor.theme)
        ? config.editor.theme
        : 'default'

      if (config.editor.theme !== 'default') {
        editorTheme.setAttribute('href', '../node_modules/codemirror/theme/' + config.editor.theme + '.css')
      }

      store.default.dispatch({
        type: 'SET_CONFIG',
        config: config
      })
    })

    nodeIpc.of.node.on('quit-finder-app', function () {
      nodeIpc.of.node.emit('quit-finder-app-confirm')
      killFinder()
    })
  }
)

const ipc = {}

module.exports = ipc
