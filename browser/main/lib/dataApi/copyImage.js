const fs = require('fs')
const path = require('path')
const { findStorage } = require('browser/lib/findStorage')

/**
 * @description Copy an image and return the path.
 * @param {String} filePath
 * @param {String} storageKey
 * @param {Boolean} rename create new filename or leave the old one
 * @return {Promise<any>} an image path
 */
function copyImage (filePath, storageKey, rename = true) {
  return new Promise((resolve, reject) => {
    try {
      const targetStorage = findStorage(storageKey)

      const inputImage = fs.createReadStream(filePath)
      const imageExt = path.extname(filePath)
      const imageName = rename ? Math.random().toString(36).slice(-16) : path.basename(filePath, imageExt)
      const basename = `${imageName}${imageExt}`
      const imageDir = path.join(targetStorage.path, 'images')
      if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir)
      const outputImage = fs.createWriteStream(path.join(imageDir, basename))
      inputImage.pipe(outputImage)
      resolve(basename)
    } catch (e) {
      return reject(e)
    }
  })
}

module.exports = copyImage
