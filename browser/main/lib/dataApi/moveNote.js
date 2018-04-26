const resolveStorageData = require('./resolveStorageData')
const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const CSON = require('@rokt33r/season')
const keygen = require('browser/lib/keygen')
const sander = require('sander')
const { findStorage } = require('browser/lib/findStorage')
const copyImage = require('./copyImage')

function moveNote (storageKey, noteKey, newStorageKey, newFolderKey) {
  let oldStorage, newStorage
  try {
    oldStorage = findStorage(storageKey)
    newStorage = findStorage(newStorageKey)
    if (newStorage == null) throw new Error('Target storage doesn\'t exist.')
  } catch (e) {
    return Promise.reject(e)
  }

  return resolveStorageData(oldStorage)
    .then(function saveNote (_oldStorage) {
      oldStorage = _oldStorage
      let noteData
      const notePath = path.join(oldStorage.path, 'notes', noteKey + '.cson')
      try {
        noteData = CSON.readFileSync(notePath)
      } catch (err) {
        console.warn('Failed to find note cson', err)
        throw err
      }
      let newNoteKey
      return Promise.resolve()
        .then(function resolveNewStorage () {
          if (storageKey === newStorageKey) {
            newNoteKey = noteKey
            return oldStorage
          }
          return resolveStorageData(newStorage)
            .then(function findNewNoteKey (_newStorage) {
              newStorage = _newStorage
              newNoteKey = keygen(true)
              let isUnique = false
              while (!isUnique) {
                try {
                  sander.statSync(path.join(newStorage.path, 'notes', newNoteKey + '.cson'))
                  newNoteKey = keygen(true)
                } catch (err) {
                  if (err.code === 'ENOENT') {
                    isUnique = true
                  } else {
                    throw err
                  }
                }
              }

              return newStorage
            })
        })
        .then(function checkFolderExistsAndPrepareNoteData (newStorage) {
          if (_.find(newStorage.folders, {key: newFolderKey}) == null) throw new Error('Target folder doesn\'t exist.')

          noteData.folder = newFolderKey
          noteData.key = newNoteKey
          noteData.storage = newStorageKey
          noteData.updatedAt = new Date()

          return noteData
        })
        .then(function moveImages (noteData) {
          if (oldStorage.path === newStorage.path) return noteData

          const searchImagesRegex = /!\[.*?]\(\s*?\/:storage\/(.*\.\S*?)\)/gi
          let match = searchImagesRegex.exec(noteData.content)

          const moveTasks = []
          while (match != null) {
            const [, filename] = match
            const oldPath = path.join(oldStorage.path, 'images', filename)
            //TODO: ehhc: attachmentManagement
            moveTasks.push(
                copyImage(oldPath, noteData.storage, false)
                .then(() => {
                  fs.unlinkSync(oldPath)
                })
            )

            // find next occurence
            match = searchImagesRegex.exec(noteData.content)
          }

          return Promise.all(moveTasks).then(() => noteData)
        })
        .then(function writeAndReturn (noteData) {
          CSON.writeFileSync(path.join(newStorage.path, 'notes', noteData.key + '.cson'), _.omit(noteData, ['key', 'storage']))
          return noteData
        })
        .then(function deleteOldNote (data) {
          if (storageKey !== newStorageKey) {
            try {
              sander.unlinkSync(path.join(oldStorage.path, 'notes', noteKey + '.cson'))
            } catch (err) {
              console.warn(err)
            }
          }

          return data
        })
    })
}

module.exports = moveNote
