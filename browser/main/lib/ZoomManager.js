import ConfigManager from './ConfigManager'

const electron = require('electron')
const { remote } = electron

_init()

function _init() {
  setZoom(getZoom(), true)
}

function _saveZoom(zoomFactor) {
  ConfigManager.set({ zoom: zoomFactor })
}

function setZoom(zoomFactor, noSave = false) {
  if (!noSave) _saveZoom(zoomFactor)
  remote.getCurrentWebContents().setZoomFactor(zoomFactor)
}

function getZoom() {
  const config = ConfigManager.get()

  return config.zoom
}

export default {
  setZoom,
  getZoom
}
