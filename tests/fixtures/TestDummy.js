const faker = require('faker')
const keygen = require('browser/lib/keygen')
const _ = require('lodash')
const sander = require('sander')
const CSON = require('@rokt33r/season')
const path = require('path')

function dummyFolder(override = {}) {
  var data = {
    name: faker.lorem.word(),
    color: faker.internet.color()
  }
  if (override.key == null) data.key = keygen()

  Object.assign(data, override)

  return data
}

function dummyBoostnoteJSONData(override = {}, isLegacy = false) {
  var data = {}
  if (override.folders == null) {
    data.folders = []

    var folderCount = Math.floor(Math.random() * 5) + 2
    for (var i = 0; i < folderCount; i++) {
      var key = keygen()
      while (data.folders.some(folder => folder.key === key)) {
        key = keygen()
      }

      data.folders.push(
        dummyFolder({
          key
        })
      )
    }
  }
  if (!isLegacy) data.version = '1.0'

  Object.assign(data, override)

  return data
}

function dummyNote(override = {}) {
  var data =
    Math.random() > 0.5
      ? {
          type: 'MARKDOWN_NOTE',
          content: faker.lorem.lines()
        }
      : {
          type: 'SNIPPET_NOTE',
          description: faker.lorem.lines(),
          snippets: [
            {
              name: faker.system.fileName(),
              mode: 'text',
              content: faker.lorem.lines()
            }
          ]
        }
  data.title =
    data.type === 'MARKDOWN_NOTE'
      ? data.content.split('\n').shift()
      : data.description.split('\n').shift()
  data.createdAt = faker.date.past()
  data.updatedAt = faker.date.recent()
  data.isStarred = false
  data.tags = faker.lorem.words().split(' ')

  if (override.key == null) data.key = keygen()
  if (override.folder == null) data.folder = keygen()
  Object.assign(data, override)

  return data
}

/**
 * @param  {String}
 * @param  {Object}
 * ```
 * {
 *   json: {
 *    folders: []
 *    version: String(enum:'1.0')
 *   },
 *   cache: {
 *     key: String,
 *     name: String,
 *     type: String(enum:'FILESYSTEM'),
 *     path: String
 *   },
 *   notes: []
 * }
 * ```
 * @return {[type]}
 */
function dummyStorage(storagePath, override = {}) {
  var jsonData =
    override.json != null ? override.json : dummyBoostnoteJSONData()
  var cacheData = override.cache != null ? override.cache : {}
  if (cacheData.key == null) cacheData.key = keygen()
  if (cacheData.name == null) cacheData.name = faker.random.word()
  if (cacheData.type == null) cacheData.type = 'FILESYSTEM'
  cacheData.path = storagePath

  sander.writeFileSync(
    path.join(storagePath, 'boostnote.json'),
    JSON.stringify(jsonData)
  )
  var notesData = []
  var noteCount = Math.floor(Math.random() * 15) + 2
  for (var i = 0; i < noteCount; i++) {
    var key = keygen(true)
    while (notesData.some(note => note.key === key)) {
      key = keygen(true)
    }

    var noteData = dummyNote({
      key,
      folder:
        jsonData.folders[Math.floor(Math.random() * jsonData.folders.length)]
          .key
    })

    notesData.push(noteData)
  }
  notesData.forEach(function saveNoteCSON(note) {
    CSON.writeFileSync(
      path.join(storagePath, 'notes', note.key + '.cson'),
      _.omit(note, ['key'])
    )
  })

  return {
    json: jsonData,
    cache: cacheData,
    notes: notesData
  }
}

function dummyLegacyStorage(storagePath, override = {}) {
  var jsonData =
    override.json != null ? override.json : dummyBoostnoteJSONData({}, true)
  var cacheData = override.cache != null ? override.cache : {}
  if (cacheData.key == null) cacheData.key = keygen()
  if (cacheData.name == null) cacheData.name = faker.random.word()
  if (cacheData.type == null) cacheData.type = 'FILESYSTEM'
  cacheData.path = storagePath

  sander.writeFileSync(
    path.join(storagePath, 'boostnote.json'),
    JSON.stringify(jsonData)
  )

  var notesData = []
  for (var j = 0; j < jsonData.folders.length; j++) {
    var folderNotes = []
    var noteCount = Math.floor(Math.random() * 5) + 1
    for (var i = 0; i < noteCount; i++) {
      var key = keygen(true)
      while (folderNotes.some(note => note.key === key)) {
        key = keygen(true)
      }

      var noteData = dummyNote({
        key,
        folder: jsonData.folders[j].key
      })
      folderNotes.push(noteData)
    }
    notesData = notesData.concat(folderNotes)
    CSON.writeFileSync(
      path.join(storagePath, jsonData.folders[j].key, 'data.json'),
      { notes: folderNotes.map(note => _.omit(note, ['folder'])) }
    )
  }

  return {
    json: jsonData,
    cache: cacheData,
    notes: notesData
  }
}

module.exports = {
  dummyFolder,
  dummyBoostnoteJSONData,
  dummyStorage,
  dummyLegacyStorage,
  dummyNote
}
