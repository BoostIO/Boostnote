const path = require('path')
const sander = require('sander')
const constant = require('./constant')
const findStorage = require('browser/lib/findStorage')

/**
 * @description Deletes the attachment folder specified by the given storageKey and noteKey
 * @param storageKey Key of the storage of the note to be deleted
 * @param noteKey Key of the note to be deleted
 */
function deleteAttachmentFolder (storageKey, noteKey) {
  const storagePath = findStorage.findStorage(storageKey)
  const noteAttachmentPath = path.join(storagePath.path, constant.DESTINATION_FOLDER, noteKey)
  sander.rimrafSync(noteAttachmentPath)
}

module.exports = deleteAttachmentFolder
