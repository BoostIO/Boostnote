const uniqueSlug = require('unique-slug')
const fs = require('fs')
const path = require('path')
const findStorage = require('browser/lib/findStorage')
const mdurl = require('mdurl')
const escapeStringRegexp = require('escape-string-regexp')

const STORAGE_FOLDER_PLACEHOLDER = ':storage'
const DESTINATION_FOLDER = 'attachments'

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
      const destinationDir = path.join(targetStorage.path, DESTINATION_FOLDER, noteKey)
      createAttachmentDestinationFolder(targetStorage.path, noteKey)
      const outputFile = fs.createWriteStream(path.join(destinationDir, destinationName))
      inputFile.pipe(outputFile)
      resolve(destinationName)
    } catch (e) {
      return reject(e)
    }
  })
}

function createAttachmentDestinationFolder (destinationStoragePath, noteKey) {
  let destinationDir = path.join(destinationStoragePath, DESTINATION_FOLDER)
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir)
  }
  destinationDir = path.join(destinationStoragePath, DESTINATION_FOLDER, noteKey)
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir)
  }
}

/**
 * @description Fixes the URLs embedded in the generated HTML so that they again refer actual local files.
 * @param {String} renderedHTML HTML in that the links should be fixed
 * @param {String} storagePath Path of the current storage
 * @returns {String} postprocessed HTML in which all :storage references are mapped to the actual paths.
 */
function fixLocalURLS (renderedHTML, storagePath) {
  return renderedHTML.replace(new RegExp(mdurl.encode(path.sep), 'g'), path.sep).replace(new RegExp(STORAGE_FOLDER_PLACEHOLDER, 'g'), 'file:///' + path.join(storagePath, DESTINATION_FOLDER))
}

/**
 * @description Generates the markdown code for a given attachment
 * @param {String} fileName Name of the attachment
 * @param {String} path Path of the attachment
 * @param {Boolean} showPreview Indicator whether the generated markdown should show a preview of the image. Note that at the moment only previews for images are supported
 * @returns {String} Generated markdown code
 */
function generateAttachmentMarkdown (fileName, path, showPreview) {
  return `${showPreview ? '!' : ''}[${fileName}](${path})`
}

/**
 * @description Handles the drop-event of a file. Includes the necessary markdown code and copies the file to the corresponding storage folder.
 * The method calls {CodeEditor#insertAttachmentMd()} to include the generated markdown at the needed place!
 * @param {CodeEditor} codeEditor Markdown editor. Its insertAttachmentMd() method will be called to include the markdown code
 * @param {String} storageKey Key of the current storage
 * @param {String} noteKey Key of the current note
 * @param {Event} dropEvent DropEvent
 */
function handleAttachmentDrop (codeEditor, storageKey, noteKey, dropEvent) {
  const file = dropEvent.dataTransfer.files[0]
  const filePath = file.path
  const originalFileName = path.basename(filePath)
  const fileType = file['type']

  copyAttachment(filePath, storageKey, noteKey).then((fileName) => {
    let showPreview = fileType.startsWith('image')
    let imageMd = generateAttachmentMarkdown(originalFileName, path.join(STORAGE_FOLDER_PLACEHOLDER, noteKey, fileName), showPreview)
    codeEditor.insertAttachmentMd(imageMd)
  })
}

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
  const destinationDir = path.join(targetStorage.path, DESTINATION_FOLDER, noteKey)
  createAttachmentDestinationFolder(targetStorage.path, noteKey)

  let imageName = `${uniqueSlug()}.png`
  const imagePath = path.join(destinationDir, imageName)

  reader.onloadend = function () {
    base64data = reader.result.replace(/^data:image\/png;base64,/, '')
    base64data += base64data.replace('+', ' ')
    const binaryData = new Buffer(base64data, 'base64').toString('binary')
    fs.writeFile(imagePath, binaryData, 'binary')
    let imageMd = generateAttachmentMarkdown(imageName, imagePath, true)
    codeEditor.insertAttachmentMd(imageMd)
  }
  reader.readAsDataURL(blob)
}

/**
 * @description Returns all attachment paths of the given markdown
 * @param {String} markdownContent content in which the attachment paths should be found
 * @returns {String[]} Array of the relativ paths (starting with :storage) of the attachments of the given markdown
 */
function getAttachmentsInContent (markdownContent) {
  let preparedInput = markdownContent.replace(new RegExp(mdurl.encode(path.sep), 'g'), path.sep)
  let regexp = new RegExp(STORAGE_FOLDER_PLACEHOLDER + escapeStringRegexp(path.sep) + '([a-zA-Z0-9]|-)+' + escapeStringRegexp(path.sep) + '[a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)?', 'g')
  return preparedInput.match(regexp)
}

/**
 * @description Returns an array of the absolute paths of the attachments referenced in the given markdown code
 * @param {String} markdownContent content in which the attachment paths should be found
 * @param {String} storagePath path of the current storage
 * @returns {String[]} Absolute paths of the referenced attachments
 */
function getAbsolutePathsOfAttachmentsInContent (markdownContent, storagePath) {
  let temp = getAttachmentsInContent(markdownContent)
  let result = []
  for (let relativePath of temp) {
    result.push(relativePath.replace(new RegExp(STORAGE_FOLDER_PLACEHOLDER, 'g'), path.join(storagePath, DESTINATION_FOLDER)))
  }
  return result
}

/**
 * @description Deletes all :storage and noteKey references from the given input.
 * @param input Input in which the references should be deleted
 * @param noteKey Key of the current note
 * @returns {String} Input without the references
 */
function removeStorageAndNoteReferences (input, noteKey) {
  return input.replace(new RegExp(mdurl.encode(path.sep), 'g'), path.sep).replace(new RegExp(STORAGE_FOLDER_PLACEHOLDER + escapeStringRegexp(path.sep) + noteKey, 'g'), DESTINATION_FOLDER)
}

module.exports = {
  copyAttachment,
  fixLocalURLS,
  generateAttachmentMarkdown,
  handleAttachmentDrop,
  handlePastImageEvent,
  getAttachmentsInContent,
  getAbsolutePathsOfAttachmentsInContent,
  removeStorageAndNoteReferences,
  STORAGE_FOLDER_PLACEHOLDER,
  DESTINATION_FOLDER
}
