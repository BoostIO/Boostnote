const _ = require('lodash')
const path = require('path')
const resolveStorageData = require('./resolveStorageData')
const CSON = require('@rokt33r/season')
const { findStorage } = require('browser/lib/findStorage')

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
function updateFolder(storageKey, folderKey, input) {
  let targetStorage
  try {
    if (input == null) throw new Error('No input found.')
    if (!_.isString(input.name)) throw new Error('Name must be a string.')
    if (!_.isString(input.color)) throw new Error('Color must be a string.')

    targetStorage = findStorage(storageKey)
  } catch (e) {
    return Promise.reject(e)
  }

  return resolveStorageData(targetStorage).then(function updateFolder(storage) {
    const targetFolder = _.find(storage.folders, { key: folderKey })
    if (targetFolder == null) throw new Error("Target folder doesn't exist.")
    targetFolder.name = input.name
    targetFolder.color = input.color

    CSON.writeFileSync(
      path.join(storage.path, 'boostnote.json'),
      _.pick(storage, ['folders', 'version'])
    )

    return {
      storage
    }
  })
}

module.exports = updateFolder
