import Mousetrap from 'mousetrap'
import CM from 'browser/main/lib/ConfigManager'
import ee from 'browser/main/lib/eventEmitter'
import { isObjectEqual } from 'browser/lib/utils'
require('mousetrap-global-bind')
import functions from './shortcut'

let shortcuts = CM.get().hotkey

ee.on('config-renew', function() {
  // only update if hotkey changed !
  const newHotkey = CM.get().hotkey
  if (!isObjectEqual(newHotkey, shortcuts)) {
    updateShortcut(newHotkey)
  }
})

function updateShortcut(newHotkey) {
  Mousetrap.reset()
  shortcuts = newHotkey
  applyShortcuts(newHotkey)
}

function formatShortcut(shortcut) {
  return shortcut.toLowerCase().replace(/ /g, '')
}

function applyShortcuts(shortcuts) {
  for (const shortcut in shortcuts) {
    const toggler = formatShortcut(shortcuts[shortcut])
    // only bind if the function for that shortcut exists
    if (functions[shortcut]) {
      Mousetrap.bindGlobal(toggler, functions[shortcut])
    }
  }
}

applyShortcuts(CM.get().hotkey)

module.exports = applyShortcuts
