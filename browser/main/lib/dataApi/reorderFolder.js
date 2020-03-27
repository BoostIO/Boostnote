const _ = require('lodash')
_.move = require('lodash-move').default
const path = require('path')
const resolveStorageData = require('./resolveStorageData')
const CSON = require('@rokt33r/season')
const { findStorage } = require('browser/lib/findStorage')

/**
 * @param {String} storageKey
 * @param {number} oldIndex
 * @param {number} newIndex
 *
 * @return {Object}
 * ```
 * {
 *   storage: Object
 * }
 * ```
 */
function reorderFolder(storageKey, oldIndex, newIndex) {
  let targetStorage
  try {
    if (!_.isNumber(oldIndex)) throw new Error('oldIndex must be a number.')
    if (!_.isNumber(newIndex)) throw new Error('newIndex must be a number.')

    targetStorage = findStorage(storageKey)
  } catch (e) {
    return Promise.reject(e)
  }

  return resolveStorageData(targetStorage).then(function reorderFolder(
    storage
  ) {
    storage.folders = _.move(storage.folders, oldIndex, newIndex)
    CSON.writeFileSync(
      path.join(storage.path, 'boostnote.json'),
      _.pick(storage, ['folders', 'version'])
    )

    return {
      storage
    }
  })
}

module.exports = reorderFolder
