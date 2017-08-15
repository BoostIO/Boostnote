const OSX = global.process.platform === 'darwin'
const Config = require('electron-config')

const DEFAULT_SHORTCUTS = {
  newNote: 'CommandOrControl+N',
  focusNote: 'Control+E',
  deleteNote: OSX? 'Control+Backspace' : 'Control+Delete',
  print: 'CommandOrControl+P',
  nextNote: 'Control+J',
  previousNote: 'Control+K',
  focusSearch: 'Control+S'
}

function setShortcuts (newShortcuts) {
  const currentShortcuts = getShortcuts()
  const config = new Config()
  const shortcuts = Object.assign({}, currentShortcuts, newShortcuts)
  config.set('menuShortcuts', shortcuts)
}

function getShortcuts () {
  const config = new Config()
  const shortcuts = config.get('menuShortcuts')
  if (shortcuts) {
    return Object.assign({}, DEFAULT_SHORTCUTS, shortcuts)
  } else {
    return DEFAULT_SHORTCUTS
  }
}

module.exports = {
  DEFAULT_SHORTCUTS,
  setShortcuts,
  getShortcuts
}
