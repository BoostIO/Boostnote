const _ = require('lodash')
const path = require('path')
const resolveStorageData = require('./resolveStorageData')
const CSON = require('@rokt33r/season')

/**
 * @param {String} storageKey
 * @param {String} folderKey
 * @param {Object} input
 * ```
 * {
 *   color: String,
 *   name: String
 * }
 * ```
 *
 * @return {Object}
 * ```
 * {
 *   storage: Object
 * }
 * ```
 */
function updateFolder (storageKey, folderKey, input) {
  let rawStorages
  let targetStorage
  try {
    if (input == null) throw new Error('No input found.')
    if (!_.isString(input.name)) throw new Error('Name must be a string.')
    if (!_.isString(input.color)) throw new Error('Color must be a string.')

    rawStorages = JSON.parse(localStorage.getItem('storages'))
    if (!_.isArray(rawStorages)) throw new Error('Target storage doesn\'t exist.')

    targetStorage = _.find(rawStorages, {key: storageKey})
    if (targetStorage == null) throw new Error('Target storage doesn\'t exist.')
  } catch (e) {
    return Promise.reject(e)
  }

  return resolveStorageData(targetStorage)
    .then(function updateFolder (storage) {
      let targetFolder = _.find(storage.folders, {key: folderKey})
      if (targetFolder == null) throw new Error('Target folder doesn\'t exist.')
      targetFolder.name = input.name
      targetFolder.color = input.color
      // For compativility
      if (targetFolder.pinnedNotes) {
        targetFolder.pinnedNotes.push(input.pinnedNote)
      } else {
        targetFolder.pinnedNotes = [input.pinnedNote]
      }

      CSON.writeFileSync(path.join(storage.path, 'boostnote.json'), _.pick(storage, ['folders', 'version']))

      return {
        storage
      }
    })
}

module.exports = updateFolder
