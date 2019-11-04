const git = require('simple-git/promise')
const _ = require('lodash')

/**
 * Helper functions to work with git integration
 * Also keeps autosync git storages in sync
 */

setInterval(() => syncAllGitStorage(), 30 * 1000)

function syncAllGitStorage () {
  let cachedStorageList
  try {
    cachedStorageList = JSON.parse(localStorage.getItem('storages'))
    if (!_.isArray(cachedStorageList)) throw new Error('invalid storages')
  } catch (err) {
    console.error(err)
    throw err
  }

  const syncRepo = (path) => {
    const repo = git(path)
    return repo.pull()
      .then(() => repo.add('./*'))
      .then(() => repo.commit('automatically synced update'))
      .then(() => repo.push())
      .catch(e => console.warn(e))
  }

  const promiseToSyncRepos = []

  cachedStorageList.forEach(({type, path, options}) => {
    if (type === 'GITREPO' && options && options.autoSync) {
      promiseToSyncRepos.push(syncRepo(path))
    }
  })

  return Promise.all(promiseToSyncRepos)
}

function syncGitFile (path, fileKey) {
  const repo = git(path)
  return repo.pull()
    .then(() => repo.add(`boostnote.json`))
    .then(() => repo.add(`notes/${fileKey}.cson`))
    .then(() => repo.commit('manually synced update'))
    .then(() => repo.push())
}

function isFileSynced (path, fileKey) {
  const file = `notes/${fileKey}.cson`
  const repo = git(path)

  return repo.status()
    .then(({created, deleted, modified, not_added, renamed}) => {
      const changes = created.concat(deleted, modified, not_added, renamed)
      if (changes.includes(file)) {
        return false
      } else {
        return true
      }
    })
}

module.exports = {
  syncAllGitStorage,
  syncGitFile,
  isFileSynced
}
