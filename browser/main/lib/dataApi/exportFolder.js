import { findStorage } from 'browser/lib/findStorage'
import resolveStorageData from './resolveStorageData'
import resolveStorageNotes from './resolveStorageNotes'
import exportNote from './exportNote'
import filenamify from 'filenamify'
import * as path from 'path'

/**
 * @param {String} storageKey
 * @param {String} folderKey
 * @param {String} fileType
 * @param {String} exportDir
 *
 * @return {Object}
 * ```
 * {
 *   storage: Object,
 *   folderKey: String,
 *   fileType: String,
 *   exportDir: String
 * }
 * ```
 */

function exportFolder(storageKey, folderKey, fileType, exportDir) {
  let targetStorage
  try {
    targetStorage = findStorage(storageKey)
  } catch (e) {
    return Promise.reject(e)
  }

  return resolveStorageData(targetStorage)
    .then(function assignNotes(storage) {
      return resolveStorageNotes(storage).then(notes => {
        return {
          storage,
          notes
        }
      })
    })
    .then(function exportNotes(data) {
      const { storage, notes } = data

      return Promise.all(
        notes
          .filter(
            note =>
              note.folder === folderKey &&
              note.isTrashed === false &&
              note.type === 'MARKDOWN_NOTE'
          )
          .map(note => {
            const notePath = path.join(
              exportDir,
              `${filenamify(note.title, { replacement: '_' })}.${fileType}`
            )
            return exportNote(
              note.key,
              storage.path,
              note.content,
              notePath,
              null
            )
          })
      ).then(() => ({
        storage,
        folderKey,
        fileType,
        exportDir
      }))
    })
}

module.exports = exportFolder
