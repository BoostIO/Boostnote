const _ = require('lodash')
const keygen = require('browser/lib/keygen')
const resolveStorageData = require('./resolveStorageData')
const consts = require('browser/lib/consts')
const CSON = require('@rokt33r/season')
const path = require('path')
const sander = require('sander')

function migrateFromV5Storage(storageKey, data) {
  let targetStorage
  try {
    const cachedStorageList = JSON.parse(localStorage.getItem('storages'))
    if (!_.isArray(cachedStorageList))
      throw new Error("Target storage doesn't exist.")

    targetStorage = _.find(cachedStorageList, { key: storageKey })
    if (targetStorage == null) throw new Error("Target storage doesn't exist.")
  } catch (e) {
    return Promise.reject(e)
  }
  return resolveStorageData(targetStorage).then(function(storage) {
    return importAll(storage, data)
  })
}

function importAll(storage, data) {
  const oldArticles = data.articles
  const notes = []
  data.folders.forEach(function(oldFolder) {
    let folderKey = keygen()
    while (storage.folders.some(folder => folder.key === folderKey)) {
      folderKey = keygen()
    }
    const newFolder = {
      key: folderKey,
      name: oldFolder.name,
      color: consts.FOLDER_COLORS[Math.floor(Math.random() * 7) % 7]
    }

    storage.folders.push(newFolder)

    const articles = oldArticles.filter(
      article => article.FolderKey === oldFolder.key
    )
    articles.forEach(article => {
      let noteKey = keygen()
      let isUnique = false
      while (!isUnique) {
        try {
          sander.statSync(path.join(storage.path, 'notes', noteKey + '.cson'))
          noteKey = keygen()
        } catch (err) {
          if (err.code === 'ENOENT') {
            isUnique = true
          } else {
            console.error('Failed to read `notes` directory.')
            throw err
          }
        }
      }

      if (article.mode === 'markdown') {
        const newNote = {
          tags: article.tags,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
          folder: folderKey,
          storage: storage.key,
          type: 'MARKDOWN_NOTE',
          isStarred: false,
          title: article.title,
          content: '# ' + article.title + '\n\n' + article.content,
          key: noteKey,
          linesHighlighted: article.linesHighlighted
        }
        notes.push(newNote)
      } else {
        const newNote = {
          tags: article.tags,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
          folder: folderKey,
          storage: storage.key,
          type: 'SNIPPET_NOTE',
          isStarred: false,
          title: article.title,
          description: article.title,
          key: noteKey,
          snippets: [
            {
              name: article.mode,
              mode: article.mode,
              content: article.content,
              linesHighlighted: article.linesHighlighted
            }
          ]
        }
        notes.push(newNote)
      }
    })
  })

  notes.forEach(function(note) {
    CSON.writeFileSync(
      path.join(storage.path, 'notes', note.key + '.cson'),
      _.omit(note, ['storage', 'key'])
    )
  })

  CSON.writeFileSync(
    path.join(storage.path, 'boostnote.json'),
    _.pick(storage, ['version', 'folders'])
  )

  return {
    storage,
    notes
  }
}

module.exports = migrateFromV5Storage
