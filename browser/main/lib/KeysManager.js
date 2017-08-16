const electron = require('electron')
const ipcRenderer = electron.ipcRenderer

const OSX = global.process.platform === 'darwin'
const Config = require('electron-config')
const config = new Config()

const DEFAULT_SHORTCUTS = {
  newNote: 'CommandOrControl+N',
  focusNote: 'Control+E',
  deleteNote: OSX? 'Control+Backspace' : 'Control+Delete',
  print: 'CommandOrControl+P',
  nextNote: 'Control+J',
  previousNote: 'Control+K',
  focusSearch: 'Control+S',
}

const DEFAULT_HOTKEY = {
  toggleFinder: OSX ? 'Cmd + Alt + S' : 'Super + Alt + S',
  toggleMain: OSX ? 'Cmd + Alt + L' : 'Super + Alt + E'
}

function setShortcuts (newShortcuts) {
  const currentShortcuts = getShortcuts()
  const shortcuts = Object.assign({}, currentShortcuts, newShortcuts)
  config.set('shortcuts', shortcuts)
}

function getShortcuts () {
  const shortcuts = config.get('shortcuts')
  if (shortcuts) {
    return Object.assign({}, DEFAULT_SHORTCUTS, shortcuts)
  } else {
    return DEFAULT_SHORTCUTS
  }
}

function setHotkey (newHotkey) {
  const currentHotkey = getHotkey()
  const hotkey = Object.assign({}, currentHotkey, newHotkey)
  ipcRenderer.send('config-renew', {config: {hotkey: hotkey}})
  config.set('hotkey', hotkey)

  // For compatibility
  if (window && window.localStorage) {
    const cachedConfig = JSON.parse(window.localStorage.getItem('config'))
    const newConfig = Object.assign({}, cachedConfig, {hotkey: hotkey})
    window.localStorage.setItem('config', JSON.stringify(newConfig))
  }
}

function getHotkey () {
  // For compatibility
  let hotkey
  if (window && window.localStorage) {
    const cachedConfig = JSON.parse(window.localStorage.getItem('config'))
    hotkey = cachedConfig ? cachedConfig.hotkey : cachedConfig
  } else {
    hotkey = config.get('hotkey')
  }

  if (hotkey) {
    return Object.assign({}, DEFAULT_HOTKEY, hotkey)
  } else {
    return DEFAULT_HOTKEY
  }
}

module.exports = {
  DEFAULT_SHORTCUTS,
  setShortcuts,
  getShortcuts,
  setHotkey,
  getHotkey
}
