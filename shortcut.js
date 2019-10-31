import ee from 'browser/main/lib/eventEmitter'

module.exports = {
  'toggleMode': {
    'action': 'keyup',
    'invoke': () => {
      ee.emit('topbar:togglemodebutton')
    }
  },
  'deleteNote': () => {
    ee.emit('hotkey:deletenote')
  },
  'toggleMenuBar': {
    'action': 'keyup',
    'invoke': () => {
      ee.emit('menubar:togglemenubar')
    }
  }
}
