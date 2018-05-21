const fse = require('fs-extra')
const path = require('path')
const escapeStringRegexp = require('escape-string-regexp')
const constant = require('./constant')

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
  const src = path.join(oldPath, constant.DESTINATION_FOLDER, noteKey)
  const dest = path.join(newPath, constant.DESTINATION_FOLDER, newNoteKey)
  if (fse.existsSync(src)) {
    fse.moveSync(src, dest)
  }
  if (noteContent) {
    return noteContent.replace(new RegExp(constant.STORAGE_FOLDER_PLACEHOLDER + escapeStringRegexp(path.sep) + noteKey, 'g'), path.join(constant.STORAGE_FOLDER_PLACEHOLDER, newNoteKey))
  }
  return noteContent
}

module.exports = moveAttachments
