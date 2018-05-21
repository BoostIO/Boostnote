const fs = require('fs')
const path = require('path')
const constant = require('./constant')

/**
 * Checks whether the destination directory for attachments of a note (storagePath/noteKey) exists
 * If not it will be created
 * @param storagePath storagePath of the current note
 * @param noteKey key of the current note
 */
function createAttachmentDestinationFolder (storagePath, noteKey) {
  let destinationDir = path.join(storagePath, constant.DESTINATION_FOLDER)
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir)
  }
  destinationDir = path.join(storagePath, constant.DESTINATION_FOLDER, noteKey)
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir)
  }
}

module.exports = createAttachmentDestinationFolder
