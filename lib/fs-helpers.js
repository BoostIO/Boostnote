const fs = require('fs')

export default {
  pathExists
}

function pathExists (path) {
  try {
    fs.statSync(path)
    return true
  } catch (e) {
    if (e.errno === -2) {
      // no such file or dir
      return false
    } else {
      throw e
    }
  }
}
