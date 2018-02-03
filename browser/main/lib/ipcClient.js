import ConfigManager from './ConfigManager'
import store from 'browser/main/store'

const nodeIpc = require('node-ipc')
const { remote, ipcRenderer } = require('electron')
const { app } = remote
const path = require('path')

nodeIpc.config.id = 'main'
nodeIpc.config.retry = 1500
nodeIpc.config.silent = true

nodeIpc.connectTo(
  'node',
  path.join(app.getPath('userData'), 'boostnote.service'),
  function () {
    nodeIpc.of.node.on('error', function (err) {
      console.log(err)
    })
    nodeIpc.of.node.on('connect', function () {
      console.log('Conncted successfully')
      ipcRenderer.send('config-renew', {config: ConfigManager.get()})
    })
    nodeIpc.of.node.on('disconnect', function () {
      console.log('disconnected')
    })
  }
)

module.exports = nodeIpc
