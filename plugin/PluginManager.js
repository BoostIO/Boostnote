module.exports =
class PluginManager {
  constructor() {
  }

  load () {
    const plugins = JSON.parse(localStorage.getItem('plugins'))
    plugins.forEach(plugin => {
      require(plugin.path)
    })
  }
}
