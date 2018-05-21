const path = require('path')
const mdurl = require('mdurl')
const escapeStringRegexp = require('escape-string-regexp')
const constant = require('./constant')

/**
 * @description Deletes all :storage and noteKey references from the given input.
 * @param input Input in which the references should be deleted
 * @param noteKey Key of the current note
 * @returns {String} Input without the references
 */
function removeStorageAndNoteReferences (input, noteKey) {
  return input.replace(new RegExp(mdurl.encode(path.sep), 'g'), path.sep).replace(new RegExp(constant.STORAGE_FOLDER_PLACEHOLDER + escapeStringRegexp(path.sep) + noteKey, 'g'), constant.DESTINATION_FOLDER)
}

module.exports = removeStorageAndNoteReferences
