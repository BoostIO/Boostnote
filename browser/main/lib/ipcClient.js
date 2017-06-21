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
      console.log('Connected successfully')
      ipcRenderer.send('config-renew', {config: ConfigManager.get()})
    })
    nodeIpc.of.node.on('disconnect', function () {
      console.log('disconnected')
    })

    nodeIpc.of.node.on('request-data-from-finder', function () {
      console.log('throttle')
      var { data } = store.getState()
      console.log(data.starredSet.toJS())
      nodeIpc.of.node.emit('throttle-data', {
        storageMap: data.storageMap.toJS(),
        noteMap: data.noteMap.toJS(),
        starredSet: data.starredSet.toJS(),
        storageNoteMap: data.storageNoteMap.toJS(),
        folderNoteMap: data.folderNoteMap.toJS(),
        tagNoteMap: data.tagNoteMap.toJS()
      })
    })
  }
)

module.exports = nodeIpc
