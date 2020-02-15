const sander = require('sander')
const path = require('path')
const CSON = require('@rokt33r/season')

function resolveStorageNotes(storage) {
  const notesDirPath = path.join(storage.path, 'notes')
  let notePathList
  try {
    notePathList = sander.readdirSync(notesDirPath)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(notesDirPath, " doesn't exist.")
      sander.mkdirSync(notesDirPath)
    } else {
      console.warn('Failed to find note dir', notesDirPath, err)
    }
    notePathList = []
  }
  const notes = notePathList
    .filter(function filterOnlyCSONFile(notePath) {
      return /\.cson$/.test(notePath)
    })
    .map(function parseCSONFile(notePath) {
      try {
        const data = CSON.readFileSync(path.join(notesDirPath, notePath))
        data.key = path.basename(notePath, '.cson')
        data.storage = storage.key
        return data
      } catch (err) {
        console.error(`error on note path: ${notePath}, error: ${err}`)
      }
    })
    .filter(function filterOnlyNoteObject(noteObj) {
      return typeof noteObj === 'object'
    })

  return Promise.resolve(notes)
}

module.exports = resolveStorageNotes
