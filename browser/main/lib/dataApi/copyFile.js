const fs = require('fs')
const path = require('path')

/**
 * @description Copy a file from source to destination
 * @param {String} srcPath
 * @param {String} dstPath
 * @return {Promise} an image path
 */
function copyFile(srcPath, dstPath) {
  if (!path.extname(dstPath)) {
    dstPath = path.join(dstPath, path.basename(srcPath))
  }

  return new Promise((resolve, reject) => {
    const dstFolder = path.dirname(dstPath)
    if (!fs.existsSync(dstFolder)) fs.mkdirSync(dstFolder)

    const input = fs.createReadStream(decodeURI(srcPath))
    const output = fs.createWriteStream(dstPath)

    output.on('error', reject)
    input.on('error', reject)
    input.on('end', () => {
      resolve(dstPath)
    })
    input.pipe(output)
  })
}

module.exports = copyFile
