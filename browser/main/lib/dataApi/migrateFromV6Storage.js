const path = require('path')
const sander = require('sander')
const keygen = require('browser/lib/keygen')
const _ = require('lodash')
const CSON = require('@rokt33r/season')

function migrateFromV5Storage(storagePath) {
  var boostnoteJSONPath = path.join(storagePath, 'boostnote.json')
  return Promise.resolve()
    .then(function readBoostnoteJSON() {
      return sander.readFile(boostnoteJSONPath, {
        encoding: 'utf-8'
      })
    })
    .then(function verifyVersion(rawData) {
      var boostnoteJSONData = JSON.parse(rawData)
      if (boostnoteJSONData.version === '1.0')
        throw new Error('Target storage seems to be transformed already.')
      if (!_.isArray(boostnoteJSONData.folders))
        throw new Error('the value of folders is not an array.')

      return boostnoteJSONData
    })
    .then(function setVersion(boostnoteJSONData) {
      boostnoteJSONData.version = '1.0'
      return sander
        .writeFile(boostnoteJSONPath, JSON.stringify(boostnoteJSONData))
        .then(() => boostnoteJSONData)
    })
    .then(function fetchNotes(boostnoteJSONData) {
      var fetchNotesFromEachFolder = boostnoteJSONData.folders.map(function(
        folder
      ) {
        const folderDataJSONPath = path.join(
          storagePath,
          folder.key,
          'data.json'
        )
        return sander
          .readFile(folderDataJSONPath, {
            encoding: 'utf-8'
          })
          .then(function(rawData) {
            var data = JSON.parse(rawData)
            if (!_.isArray(data.notes))
              throw new Error('value of notes is not an array.')
            return data.notes.map(function setFolderToNote(note) {
              note.folder = folder.key
              return note
            })
          })
          .catch(function failedToReadDataJSON(err) {
            console.warn('Failed to fetch notes from ', folderDataJSONPath, err)
            return []
          })
      })

      return Promise.all(fetchNotesFromEachFolder)
        .then(function flatten(folderNotes) {
          return folderNotes.reduce(function concatNotes(sum, notes) {
            return sum.concat(notes)
          }, [])
        })
        .then(function saveNotes(notes) {
          notes.forEach(function renewKey(note) {
            var newKey = keygen()
            while (notes.some(_note => _note.key === newKey)) {
              newKey = keygen()
            }
            note.key = newKey
          })

          const noteDirPath = path.join(storagePath, 'notes')
          notes.map(function saveNote(note) {
            CSON.writeFileSync(path.join(noteDirPath, note.key) + '.cson', note)
          })
          return true
        })
        .then(function deleteFolderDir(check) {
          if (check) {
            boostnoteJSONData.folders.forEach(folder => {
              sander.rimrafSync(path.join(storagePath, folder.key))
            })
          }
          return check
        })
    })
    .catch(function handleError(err) {
      console.warn(err)
      return false
    })
}

module.exports = migrateFromV5Storage
