const _ = require('lodash')

export function findStorage(storageKey) {
  const cachedStorageList = JSON.parse(localStorage.getItem('storages'))
  if (!_.isArray(cachedStorageList))
    throw new Error("Target storage doesn't exist.")
  const storage = _.find(cachedStorageList, { key: storageKey })
  if (storage === undefined) throw new Error("Target storage doesn't exist.")

  return storage
}

export default {
  findStorage
}
