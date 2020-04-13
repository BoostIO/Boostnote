const path = require('path')

function notify(title, options) {
  if (process.platform === 'win32') {
    options.icon = path.join(
      'file://',
      global.__dirname,
      '../../resources/app.png'
    )
    options.silent = false
  }
  return new window.Notification(title, options)
}

export default notify
