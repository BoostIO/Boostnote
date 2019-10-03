const _ = require('lodash')
const path = require('path')
const git = require('simple-git/promise')
const CSON = require('@rokt33r/season')
const migrateFromV6Storage = require('./migrateFromV6Storage')

function resolveStorageData (storageCache) {
  const storage = {
    key: storageCache.key,
    name: storageCache.name,
    type: storageCache.type,
    path: storageCache.path,
    isOpen: storageCache.isOpen
  }

  const resolveType = ({type} = storage) => {
    switch (type) {
      case 'FILESYSTEM':
        return resolveFileSystem(storage)
      case 'GITREPO':
        return resolveGitRepo(storage)
      default:
        // Assume undefined type is just filesystem
        storage.type = 'FILESYSTEM'
        return resolveFileSystem(storage)
    }
  }

  return resolvePath(storage).then(storage => resolveType(storage))
}

function resolvePath (storage) {
  const boostnoteJSONPath = path.join(storage.path, 'boostnote.json')
  return Promise.resolve().then(() => {
    const jsonData = CSON.readFileSync(boostnoteJSONPath)
    if (!_.isArray(jsonData.folders)) throw new Error('folders should be an array.')
    storage.folders = jsonData.folders
    storage.version = jsonData.version
  }).catch((err) => {
    if (err.code === 'ENOENT') {
      console.warn('boostnote.json file doesn\'t exist the given path')
      CSON.writeFileSync(boostnoteJSONPath, {folders: [], version: '1.0'})
    } else {
      console.error(err)
    }
    storage.folders = []
    storage.version = '1.0'
  })
  .then(() => storage)
}

function resolveFileSystem (storage) {
  const version = parseInt(storage.version, 10)
  if (version >= 1) {
    return Promise.resolve(storage)
  }

  return migrateFromV6Storage(storage.path)
    .then(() => storage)
}

function resolveGitRepo (storage) {
  return git(storage.path).checkIsRepo()
    .then((isRepo) => {
      if (!isRepo) {
        throw new Error('is not a repo')
      }
      return storage
    })
}

module.exports = resolveStorageData
