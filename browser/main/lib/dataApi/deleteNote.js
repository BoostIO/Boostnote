const resolveStorageData = require('./resolveStorageData')
const path = require('path')
const sander = require('sander')
const attachmentManagement = require('./attachmentManagement')
const { findStorage } = require('browser/lib/findStorage')

function deleteNote(storageKey, noteKey) {
  let targetStorage
  try {
    targetStorage = findStorage(storageKey)
  } catch (e) {
    return Promise.reject(e)
  }

  return resolveStorageData(targetStorage)
    .then(function deleteNoteFile(storage) {
      const notePath = path.join(storage.path, 'notes', noteKey + '.cson')

      try {
        sander.unlinkSync(notePath)
      } catch (err) {
        console.warn('Failed to delete note cson', err)
      }
      return {
        noteKey,
        storageKey
      }
    })
    .then(function deleteAttachments(storageInfo) {
      attachmentManagement.deleteAttachmentFolder(
        storageInfo.storageKey,
        storageInfo.noteKey
      )
      return storageInfo
    })
}

module.exports = deleteNote
