const uniqueSlug = require('unique-slug')
const fs = require('fs')
const path = require('path')
const findStorage = require('browser/lib/findStorage')

const constant = require('./constant')
const createAttachmentDestinationFolder = require('./createAttachmentDestinationFolder')

/**
 * @description
 * Copies a copy of an attachment to the storage folder specified by the given key and return the generated attachment name.
 * Renames the file to match a unique file name.
 *
 * @param {String} sourceFilePath The source path of the attachment to be copied
 * @param {String} storageKey Storage key of the destination storage
 * @param {String} noteKey Key of the current note. Will be used as subfolder in :storage
 * @param {boolean} useRandomName determines whether a random filename for the new file is used. If false the source file name is used
 * @return {Promise<String>} name (inclusive extension) of the generated file
 */
function copyAttachment (sourceFilePath, storageKey, noteKey, useRandomName = true) {
  return new Promise((resolve, reject) => {
    if (!sourceFilePath) {
      reject('sourceFilePath has to be given')
    }

    if (!storageKey) {
      reject('storageKey has to be given')
    }

    if (!noteKey) {
      reject('noteKey has to be given')
    }

    try {
      if (!fs.existsSync(sourceFilePath)) {
        reject('source file does not exist')
      }

      const targetStorage = findStorage.findStorage(storageKey)

      const inputFile = fs.createReadStream(sourceFilePath)
      let destinationName
      if (useRandomName) {
        destinationName = `${uniqueSlug()}${path.extname(sourceFilePath)}`
      } else {
        destinationName = path.basename(sourceFilePath)
      }
      const destinationDir = path.join(targetStorage.path, constant.DESTINATION_FOLDER, noteKey)
      createAttachmentDestinationFolder(targetStorage.path, noteKey)
      const outputFile = fs.createWriteStream(path.join(destinationDir, destinationName))
      inputFile.pipe(outputFile)
      resolve(destinationName)
    } catch (e) {
      return reject(e)
    }
  })
}

module.exports = copyAttachment
