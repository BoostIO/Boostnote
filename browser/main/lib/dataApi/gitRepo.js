const git = require('simple-git/promise')

/**
 * Remove exported files
 * @param tasks Array of copy task objects. Object consists of two mandatory fields – `src` and `dst`
 */

setInterval(() => syncGitRepos(), 10 * 1000)

setInterval(() => {
  const today = new Date()
  const time = today.getMinutes() + ':' + today.getSeconds()
  console.log(time)
}, 1000)
function syncGitRepos () {
  console.log('syncing git repos')
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
      .then(() => repo.commit('automatically synced updates'))
      .then(() => repo.push())
      .catch(e => console.warn(e))
  }

  const promiseToSyncRepos = []

  cachedStorageList.forEach(({type, path}) => {
    if (type === 'GITREPO') {
      promiseToSyncRepos.push(syncRepo(path))
    }
  })

  return Promise.all(promiseToSyncRepos)
}

module.exports = syncGitRepos
