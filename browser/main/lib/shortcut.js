import ee from 'browser/main/lib/eventEmitter'

module.exports = {
  'toggleMode': () => {
    ee.emit('topbar:togglemodebutton')
  }
}
