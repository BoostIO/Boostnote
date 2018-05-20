const path = require('path')
const copyAttachment = require('./copyAttachments')
const constant = require('./constant')
const generateAttachmentMarkdown = require('./generateAttachmentMarkdown')
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
    const imageMd = generateAttachmentMarkdown(originalFileName, path.join(constant.STORAGE_FOLDER_PLACEHOLDER, noteKey, fileName), showPreview)
    codeEditor.insertAttachmentMd(imageMd)
  })
}

module.exports = handleAttachmentDrop
