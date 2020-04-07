const _ = require('lodash')
const resolveStorageData = require('./resolveStorageData')

/**
 * @param {String} key
 * @param {Boolean} isOpen
 * @return {Object} Storage meta data
 */
function toggleStorage(key, isOpen) {
  let cachedStorageList
  try {
    cachedStorageList = JSON.parse(localStorage.getItem('storages'))
    if (!_.isArray(cachedStorageList)) throw new Error('invalid storages')
  } catch (err) {
    console.error(err)
    return Promise.reject(err)
  }
  const targetStorage = _.find(cachedStorageList, { key: key })
  if (targetStorage == null) return Promise.reject('Storage')

  targetStorage.isOpen = isOpen
  localStorage.setItem('storages', JSON.stringify(cachedStorageList))

  return resolveStorageData(targetStorage)
}

module.exports = toggleStorage
