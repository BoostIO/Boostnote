const path = require('path')
const fs = require('fs')
const escapeStringRegexp = require('escape-string-regexp')
const findStorage = require('browser/lib/findStorage')
const constant = require('./constant')
const getAttachmentsInContent = require('./getAttachmentsInContent')

/**
 * @description Deletes all attachments stored in the attachment folder of the give not that are not referenced in the markdownContent
 * @param markdownContent Content of the note. All unreferenced notes will be deleted
 * @param storageKey StorageKey of the current note. Is used to determine the belonging attachment folder.
 * @param noteKey NoteKey of the current note. Is used to determine the belonging attachment folder.
 */
function deleteAttachmentsNotPresentInNote (markdownContent, storageKey, noteKey) {
  const targetStorage = findStorage.findStorage(storageKey)
  const attachmentFolder = path.join(targetStorage.path, constant.DESTINATION_FOLDER, noteKey)
  const attachmentsInNote = getAttachmentsInContent(markdownContent)
  const attachmentsInNoteOnlyFileNames = []
  if (attachmentsInNote) {
    for (let i = 0; i < attachmentsInNote.length; i++) {
      attachmentsInNoteOnlyFileNames.push(attachmentsInNote[i].replace(new RegExp(constant.STORAGE_FOLDER_PLACEHOLDER + escapeStringRegexp(path.sep) + noteKey + escapeStringRegexp(path.sep), 'g'), ''))
    }
  }

  if (fs.existsSync(attachmentFolder)) {
    fs.readdir(attachmentFolder, (err, files) => {
      if (err) {
        console.error("Error reading directory '" + attachmentFolder + "'. Error:")
        console.error(err)
        return
      }
      files.forEach(file => {
        if (!attachmentsInNoteOnlyFileNames.includes(file)) {
          const absolutePathOfFile = path.join(targetStorage.path, constant.DESTINATION_FOLDER, noteKey, file)
          fs.unlink(absolutePathOfFile, (err) => {
            if (err) {
              console.error("Could not delete '%s'", absolutePathOfFile)
              console.error(err)
              return
            }
            console.info("File '" + absolutePathOfFile + "' deleted because it was not included in the content of the note")
          })
        }
      })
    })
  } else {
    console.info("Attachment folder ('" + attachmentFolder + "') did not exist..")
  }
}

module.exports = deleteAttachmentsNotPresentInNote
