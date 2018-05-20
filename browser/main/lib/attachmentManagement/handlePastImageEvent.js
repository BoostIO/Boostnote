const path = require('path')
const fs = require('fs')
const uniqueSlug = require('unique-slug')

const findStorage = require('browser/lib/findStorage')
const constant = require('./constant')
const createAttachmentDestinationFolder = require('./createAttachmentDestinationFolder')
const generateAttachmentMarkdown = require('./generateAttachmentMarkdown')

/**
 * @description Creates a new file in the storage folder belonging to the current note and inserts the correct markdown code
 * @param {CodeEditor} codeEditor Markdown editor. Its insertAttachmentMd() method will be called to include the markdown code
 * @param {String} storageKey Key of the current storage
 * @param {String} noteKey Key of the current note
 * @param {DataTransferItem} dataTransferItem Part of the past-event
 */
function handlePastImageEvent (codeEditor, storageKey, noteKey, dataTransferItem) {
  if (!codeEditor) {
    throw new Error('codeEditor has to be given')
  }
  if (!storageKey) {
    throw new Error('storageKey has to be given')
  }

  if (!noteKey) {
    throw new Error('noteKey has to be given')
  }
  if (!dataTransferItem) {
    throw new Error('dataTransferItem has to be given')
  }

  const blob = dataTransferItem.getAsFile()
  const reader = new FileReader()
  let base64data
  const targetStorage = findStorage.findStorage(storageKey)
  const destinationDir = path.join(targetStorage.path, constant.DESTINATION_FOLDER, noteKey)
  createAttachmentDestinationFolder(targetStorage.path, noteKey)

  const imageName = `${uniqueSlug()}.png`
  const imagePath = path.join(destinationDir, imageName)

  reader.onloadend = function () {
    base64data = reader.result.replace(/^data:image\/png;base64,/, '')
    base64data += base64data.replace('+', ' ')
    const binaryData = new Buffer(base64data, 'base64').toString('binary')
    fs.writeFile(imagePath, binaryData, 'binary')
    const imageMd = generateAttachmentMarkdown(imageName, imagePath, true)
    codeEditor.insertAttachmentMd(imageMd)
  }
  reader.readAsDataURL(blob)
}

module.exports = handlePastImageEvent
