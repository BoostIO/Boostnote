const _ = require('lodash')
const path = require('path')
const resolveStorageData = require('./resolveStorageData')
const CSON = require('@rokt33r/season')

/**
 * @param {String} storageKey
 * @param {Array} folders
 * @return {Object}
 * ```
 * {
 *   storage: Object
 * }
 * ```
 */

function moveFolder (storageKey, folders) {
  let rawStorages
  let targetStorage
  let movedStorage
  return new Promise((resolve, reject) => {
    try {
      rawStorages = JSON.parse(localStorage.getItem('storages'))
      if (!_.isArray(rawStorages)) throw new Error('Target storage doesn\'t exist.')

      targetStorage = _.find(rawStorages, {key: storageKey})
      if (targetStorage == null) throw new Error('Target storage doesn\'t exist.')

      resolveStorageData(targetStorage)
        .then((storage) => {
          storage.folders = folders
          movedStorage = storage
          CSON.writeFileSync(path.join(storage.path, 'boostnote.json'), _.pick(storage, ['folders', 'version']))
        })
      resolve(movedStorage)
    } catch (e) {
      reject(e)
    }
  })
}
module.exports = moveFolder
