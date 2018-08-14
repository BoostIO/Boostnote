const uniqueSlug = require('unique-slug')
const fs = require('fs')
const path = require('path')
const findStorage = require('browser/lib/findStorage')
const mdurl = require('mdurl')
const fse = require('fs-extra')
const escapeStringRegexp = require('escape-string-regexp')
const sander = require('sander')
import i18n from 'browser/lib/i18n'

const STORAGE_FOLDER_PLACEHOLDER = ':storage'
const DESTINATION_FOLDER = 'attachments'
const PATH_SEPARATORS = escapeStringRegexp(path.posix.sep) + escapeStringRegexp(path.win32.sep)

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

      const inputFileStream = fs.createReadStream(sourceFilePath)
      let destinationName
      if (useRandomName) {
        destinationName = `${uniqueSlug()}${path.extname(sourceFilePath)}`
      } else {
        destinationName = path.basename(sourceFilePath)
      }
      const destinationDir = path.join(targetStorage.path, DESTINATION_FOLDER, noteKey)
      createAttachmentDestinationFolder(targetStorage.path, noteKey)
      const outputFile = fs.createWriteStream(path.join(destinationDir, destinationName))
      inputFileStream.pipe(outputFile)
      inputFileStream.on('end', () => {
        resolve(destinationName)
      })
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
 * @description Moves attachments from the old location ('/images') to the new one ('/attachments/noteKey)
 * @param markdownContent of the current note
 * @param storagePath Storage path of the current note
 * @param noteKey Key of the current note
 */
function migrateAttachments (markdownContent, storagePath, noteKey) {
  if (noteKey !== undefined && sander.existsSync(path.join(storagePath, 'images'))) {
    const attachments = getAttachmentsInMarkdownContent(markdownContent) || []
    if (attachments.length) {
      createAttachmentDestinationFolder(storagePath, noteKey)
    }
    for (const attachment of attachments) {
      const attachmentBaseName = path.basename(attachment)
      const possibleLegacyPath = path.join(storagePath, 'images', attachmentBaseName)
      if (sander.existsSync(possibleLegacyPath)) {
        const destinationPath = path.join(storagePath, DESTINATION_FOLDER, attachmentBaseName)
        if (!sander.existsSync(destinationPath)) {
          sander.copyFileSync(possibleLegacyPath).to(destinationPath)
        }
      }
    }
  }
}

/**
 * @description Fixes the URLs embedded in the generated HTML so that they again refer actual local files.
 * @param {String} renderedHTML HTML in that the links should be fixed
 * @param {String} storagePath Path of the current storage
 * @returns {String} postprocessed HTML in which all :storage references are mapped to the actual paths.
 */
function fixLocalURLS (renderedHTML, storagePath) {
  return renderedHTML.replace(new RegExp('/?' + STORAGE_FOLDER_PLACEHOLDER + '.*?"', 'g'), function (match) {
    var encodedPathSeparators = new RegExp(mdurl.encode(path.win32.sep) + '|' + mdurl.encode(path.posix.sep), 'g')
    return match.replace(encodedPathSeparators, path.sep).replace(new RegExp('/?' + STORAGE_FOLDER_PLACEHOLDER, 'g'), 'file:///' + path.join(storagePath, DESTINATION_FOLDER))
  })
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
    const showPreview = fileType.startsWith('image')
    const imageMd = generateAttachmentMarkdown(originalFileName, path.join(STORAGE_FOLDER_PLACEHOLDER, noteKey, fileName), showPreview)
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

  const imageName = `${uniqueSlug()}.png`
  const imagePath = path.join(destinationDir, imageName)

  reader.onloadend = function () {
    base64data = reader.result.replace(/^data:image\/png;base64,/, '')
    base64data += base64data.replace('+', ' ')
    const binaryData = new Buffer(base64data, 'base64').toString('binary')
    fs.writeFileSync(imagePath, binaryData, 'binary')
    const imageReferencePath = path.join(STORAGE_FOLDER_PLACEHOLDER, noteKey, imageName)
    const imageMd = generateAttachmentMarkdown(imageName, imageReferencePath, true)
    codeEditor.insertAttachmentMd(imageMd)
  }
  reader.readAsDataURL(blob)
}

/**
* @description Returns all attachment paths of the given markdown
* @param {String} markdownContent content in which the attachment paths should be found
* @returns {String[]} Array of the relative paths (starting with :storage) of the attachments of the given markdown
*/
function getAttachmentsInMarkdownContent (markdownContent) {
  const preparedInput = markdownContent.replace(new RegExp('[' + PATH_SEPARATORS + ']', 'g'), path.sep)
  const regexp = new RegExp('/?' + STORAGE_FOLDER_PLACEHOLDER + '(' + escapeStringRegexp(path.sep) + ')' + '?([a-zA-Z0-9]|-)*' + '(' + escapeStringRegexp(path.sep) + ')' + '([a-zA-Z0-9]|\\.)+(\\.[a-zA-Z0-9]+)?', 'g')
  return preparedInput.match(regexp)
}

/**
 * @description Returns an array of the absolute paths of the attachments referenced in the given markdown code
 * @param {String} markdownContent content in which the attachment paths should be found
 * @param {String} storagePath path of the current storage
 * @returns {String[]} Absolute paths of the referenced attachments
 */
function getAbsolutePathsOfAttachmentsInContent (markdownContent, storagePath) {
  const temp = getAttachmentsInMarkdownContent(markdownContent) || []
  const result = []
  for (const relativePath of temp) {
    result.push(relativePath.replace(new RegExp(STORAGE_FOLDER_PLACEHOLDER, 'g'), path.join(storagePath, DESTINATION_FOLDER)))
  }
  return result
}

/**
 * @description Moves the attachments of the current note to the new location.
 * Returns a modified version of the given content so that the links to the attachments point to the new note key.
 * @param {String} oldPath Source of the note to be moved
 * @param {String} newPath Destination of the note to be moved
 * @param {String} noteKey Old note key
 * @param {String} newNoteKey New note key
 * @param {String} noteContent Content of the note to be moved
 * @returns {String} Modified version of noteContent in which the paths of the attachments are fixed
 */
function moveAttachments (oldPath, newPath, noteKey, newNoteKey, noteContent) {
  const src = path.join(oldPath, DESTINATION_FOLDER, noteKey)
  const dest = path.join(newPath, DESTINATION_FOLDER, newNoteKey)
  if (fse.existsSync(src)) {
    fse.moveSync(src, dest)
  }
  return replaceNoteKeyWithNewNoteKey(noteContent, noteKey, newNoteKey)
}

/**
 * Modifies the given content so that in all attachment references the oldNoteKey is replaced by the new one
 * @param noteContent content that should be modified
 * @param oldNoteKey note key to be replaced
 * @param newNoteKey note key serving as a replacement
 * @returns {String} modified note content
 */
function replaceNoteKeyWithNewNoteKey (noteContent, oldNoteKey, newNoteKey) {
  if (noteContent) {
    const preparedInput = noteContent.replace(new RegExp('[' + PATH_SEPARATORS + ']', 'g'), path.sep)
    return preparedInput.replace(new RegExp(STORAGE_FOLDER_PLACEHOLDER + escapeStringRegexp(path.sep) + oldNoteKey, 'g'), path.join(STORAGE_FOLDER_PLACEHOLDER, newNoteKey))
  }
  return noteContent
}

/**
 * @description Deletes all :storage and noteKey references from the given input.
 * @param input Input in which the references should be deleted
 * @param noteKey Key of the current note
 * @returns {String} Input without the references
 */
function removeStorageAndNoteReferences (input, noteKey) {
  return input.replace(new RegExp(mdurl.encode(path.sep), 'g'), path.sep).replace(new RegExp(STORAGE_FOLDER_PLACEHOLDER + '(' + escapeStringRegexp(path.sep) + noteKey + ')?', 'g'), DESTINATION_FOLDER)
}

/**
 * @description Deletes the attachment folder specified by the given storageKey and noteKey
 * @param storageKey Key of the storage of the note to be deleted
 * @param noteKey Key of the note to be deleted
 */
function deleteAttachmentFolder (storageKey, noteKey) {
  const storagePath = findStorage.findStorage(storageKey)
  const noteAttachmentPath = path.join(storagePath.path, DESTINATION_FOLDER, noteKey)
  sander.rimrafSync(noteAttachmentPath)
}

/**
 * @description Deletes all attachments stored in the attachment folder of the give not that are not referenced in the markdownContent
 * @param markdownContent Content of the note. All unreferenced notes will be deleted
 * @param storageKey StorageKey of the current note. Is used to determine the belonging attachment folder.
 * @param noteKey NoteKey of the current note. Is used to determine the belonging attachment folder.
 */
function deleteAttachmentsNotPresentInNote (markdownContent, storageKey, noteKey) {
  if (storageKey == null || noteKey == null || markdownContent == null) {
    return
  }
  const targetStorage = findStorage.findStorage(storageKey)
  const attachmentFolder = path.join(targetStorage.path, DESTINATION_FOLDER, noteKey)
  const attachmentsInNote = getAttachmentsInMarkdownContent(markdownContent)
  const attachmentsInNoteOnlyFileNames = []
  if (attachmentsInNote) {
    for (let i = 0; i < attachmentsInNote.length; i++) {
      attachmentsInNoteOnlyFileNames.push(attachmentsInNote[i].replace(new RegExp(STORAGE_FOLDER_PLACEHOLDER + escapeStringRegexp(path.sep) + noteKey + escapeStringRegexp(path.sep), 'g'), ''))
    }
  }
  if (fs.existsSync(attachmentFolder)) {
    fs.readdir(attachmentFolder, (err, files) => {
      if (err) {
        console.error('Error reading directory "' + attachmentFolder + '". Error:')
        console.error(err)
        return
      }
      files.forEach(file => {
        if (!attachmentsInNoteOnlyFileNames.includes(file)) {
          const absolutePathOfFile = path.join(targetStorage.path, DESTINATION_FOLDER, noteKey, file)
          fs.unlink(absolutePathOfFile, (err) => {
            if (err) {
              console.error('Could not delete "%s"', absolutePathOfFile)
              console.error(err)
              return
            }
            console.info('File "' + absolutePathOfFile + '" deleted because it was not included in the content of the note')
          })
        }
      })
    })
  } else {
    console.info('Attachment folder ("' + attachmentFolder + '") did not exist..')
  }
}

/**
 * Clones the attachments of a given note.
 * Copies the attachments to their new destination and updates the content of the new note so that the attachment-links again point to the correct destination.
 * @param oldNote Note that is being cloned
 * @param newNote Clone of the note
 */
function cloneAttachments (oldNote, newNote) {
  if (newNote.type === 'MARKDOWN_NOTE') {
    const oldStorage = findStorage.findStorage(oldNote.storage)
    const newStorage = findStorage.findStorage(newNote.storage)
    const attachmentsPaths = getAbsolutePathsOfAttachmentsInContent(oldNote.content, oldStorage.path) || []

    const destinationFolder = path.join(newStorage.path, DESTINATION_FOLDER, newNote.key)
    if (!sander.existsSync(destinationFolder)) {
      sander.mkdirSync(destinationFolder)
    }

    for (const attachment of attachmentsPaths) {
      const destination = path.join(newStorage.path, DESTINATION_FOLDER, newNote.key, path.basename(attachment))
      sander.copyFileSync(attachment).to(destination)
    }
    newNote.content = replaceNoteKeyWithNewNoteKey(newNote.content, oldNote.key, newNote.key)
  } else {
    console.debug('Cloning of the attachment was skipped since it only works for MARKDOWN_NOTEs')
  }
}

function generateFileNotFoundMarkdown () {
  return '**' + i18n.__('⚠ You have pasted a link referring an attachment that could not be found in the storage location of this note. Pasting links referring attachments is only supported if the source and destination location is the same storage. Please Drag&Drop the attachment instead! ⚠') + '**'
}

/**
 * Determines whether a given text is a link to an boostnote attachment
 * @param text Text that might contain a attachment link
 * @return {Boolean} Result of the test
 */
function isAttachmentLink (text) {
  if (text) {
    return text.match(new RegExp('.*\\[.*\\]\\( *' + escapeStringRegexp(STORAGE_FOLDER_PLACEHOLDER) + '[' + PATH_SEPARATORS + ']' + '.*\\).*', 'gi')) != null
  }
  return false
}

/**
 * @description Handles the paste of an attachment link. Copies the referenced attachment to the location belonging to the new note.
 *  Returns a modified version of the pasted text so that it matches the copied attachment (resp. the new location)
 * @param storageKey StorageKey of the current note
 * @param noteKey NoteKey of the currentNote
 * @param linkText Text that was pasted
 * @return {Promise<String>} Promise returning the modified text
 */
function handleAttachmentLinkPaste (storageKey, noteKey, linkText) {
  if (storageKey != null && noteKey != null && linkText != null) {
    const storagePath = findStorage.findStorage(storageKey).path
    const attachments = getAttachmentsInMarkdownContent(linkText) || []
    const replaceInstructions = []
    const copies = []
    for (const attachment of attachments) {
      const absPathOfAttachment = attachment.replace(new RegExp(STORAGE_FOLDER_PLACEHOLDER, 'g'), path.join(storagePath, DESTINATION_FOLDER))
      copies.push(
        sander.exists(absPathOfAttachment)
          .then((fileExists) => {
            if (!fileExists) {
              const fileNotFoundRegexp = new RegExp('!?' + escapeStringRegexp('[') + '[\\w|\\d|\\s|\\.]*\\]\\(\\s*' + STORAGE_FOLDER_PLACEHOLDER + '[\\w|\\d|\\-|' + PATH_SEPARATORS + ']*' + escapeStringRegexp(path.basename(absPathOfAttachment)) + escapeStringRegexp(')'))
              replaceInstructions.push({regexp: fileNotFoundRegexp, replacement: this.generateFileNotFoundMarkdown()})
              return Promise.resolve()
            }
            return this.copyAttachment(absPathOfAttachment, storageKey, noteKey)
              .then((fileName) => {
                const replaceLinkRegExp = new RegExp(escapeStringRegexp('(') + ' *' + STORAGE_FOLDER_PLACEHOLDER + '[\\w|\\d|\\-|' + PATH_SEPARATORS + ']*' + escapeStringRegexp(path.basename(absPathOfAttachment)) + ' *' + escapeStringRegexp(')'))
                replaceInstructions.push({
                  regexp: replaceLinkRegExp,
                  replacement: '(' + path.join(STORAGE_FOLDER_PLACEHOLDER, noteKey, fileName) + ')'
                })
                return Promise.resolve()
              })
          })
      )
    }
    return Promise.all(copies).then(() => {
      let modifiedLinkText = linkText
      for (const replaceInstruction of replaceInstructions) {
        modifiedLinkText = modifiedLinkText.replace(replaceInstruction.regexp, replaceInstruction.replacement)
      }
      return modifiedLinkText
    })
  } else {
    console.log('One if the parameters was null -> Do nothing..')
    return Promise.resolve(linkText)
  }
}

module.exports = {
  copyAttachment,
  fixLocalURLS,
  generateAttachmentMarkdown,
  handleAttachmentDrop,
  handlePastImageEvent,
  getAttachmentsInMarkdownContent,
  getAbsolutePathsOfAttachmentsInContent,
  removeStorageAndNoteReferences,
  deleteAttachmentFolder,
  deleteAttachmentsNotPresentInNote,
  moveAttachments,
  cloneAttachments,
  isAttachmentLink,
  handleAttachmentLinkPaste,
  generateFileNotFoundMarkdown,
  migrateAttachments,
  STORAGE_FOLDER_PLACEHOLDER,
  DESTINATION_FOLDER
}
