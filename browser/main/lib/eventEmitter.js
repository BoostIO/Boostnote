const electron = require('electron')
const { ipcRenderer, remote } = electron

function on(name, listener) {
  ipcRenderer.on(name, listener)
}

function off(name, listener) {
  ipcRenderer.removeListener(name, listener)
}

function once(name, listener) {
  ipcRenderer.once(name, listener)
}

function emit(name, ...args) {
  remote.getCurrentWindow().webContents.send(name, ...args)
}

export default {
  emit,
  on,
  off,
  once
}
