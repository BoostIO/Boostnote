const _ = require('lodash')
const path = require('path')
const CSON = require('@rokt33r/season')
const migrateFromV6Storage = require('./migrateFromV6Storage')

function resolveStorageData(storageCache) {
  const storage = {
    key: storageCache.key,
    name: storageCache.name,
    type: storageCache.type,
    path: storageCache.path,
    isOpen: storageCache.isOpen
  }

  const boostnoteJSONPath = path.join(storageCache.path, 'boostnote.json')
  try {
    const jsonData = CSON.readFileSync(boostnoteJSONPath)
    if (!_.isArray(jsonData.folders))
      throw new Error('folders should be an array.')
    storage.folders = jsonData.folders
    storage.version = jsonData.version
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn("boostnote.json file doesn't exist the given path")
      CSON.writeFileSync(boostnoteJSONPath, { folders: [], version: '1.0' })
    } else {
      console.error(err)
    }
    storage.folders = []
    storage.version = '1.0'
  }

  const version = parseInt(storage.version, 10)
  if (version >= 1) {
    return Promise.resolve(storage)
  }

  return migrateFromV6Storage(storage.path).then(() => storage)
}

module.exports = resolveStorageData
