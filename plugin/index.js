module.exports =
class Plugins {
  constructor() {
  }

  pluginPath () {
    const plugins = JSON.parse(window.localStorage.getItem('plugins'))
    return plugins.map(plugin => { return plugin.path })
  }
}
