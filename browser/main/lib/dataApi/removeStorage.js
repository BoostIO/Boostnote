const _ = require('lodash')

/**
 * @param {String} key
 * @return {key}
 */
function removeStorage(key) {
  let rawStorages

  try {
    rawStorages = JSON.parse(localStorage.getItem('storages'))
    if (!_.isArray(rawStorages)) throw new Error('invalid storages')
  } catch (e) {
    console.warn(e)
    rawStorages = []
  }

  rawStorages = rawStorages.filter(function excludeTargetStorage(rawStorage) {
    return rawStorage.key !== key
  })

  localStorage.setItem('storages', JSON.stringify(rawStorages))

  return Promise.resolve({
    storageKey: key
  })
}

module.exports = removeStorage
