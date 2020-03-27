const _ = require('lodash')
const resolveStorageData = require('./resolveStorageData')

/**
 * @param {String} key
 * @param {String} name
 * @return {Object} Storage meta data
 */
function renameStorage(key, name) {
  if (!_.isString(name))
    return Promise.reject(new Error('Name must be a string.'))

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

  targetStorage.name = name
  localStorage.setItem('storages', JSON.stringify(cachedStorageList))

  targetStorage.path

  return resolveStorageData(targetStorage)
}

module.exports = renameStorage
