const test = require('ava')
const addStorage = require('browser/main/lib/dataApi/addStorage')

global.document = require('jsdom').jsdom('<body></body>')
global.window = document.defaultView
global.navigator = window.navigator

const Storage = require('dom-storage')
const localStorage = (window.localStorage = global.localStorage = new Storage(
  null,
  { strict: true }
))
const path = require('path')
const TestDummy = require('../fixtures/TestDummy')
const sander = require('sander')
const _ = require('lodash')
const os = require('os')
const CSON = require('@rokt33r/season')

const v1StoragePath = path.join(os.tmpdir(), 'test/addStorage-v1-storage')
// const legacyStoragePath = path.join(os.tmpdir(), 'test/addStorage-legacy-storage')
// const emptyDirPath = path.join(os.tmpdir(), 'test/addStorage-empty-storage')

test.beforeEach(t => {
  t.context.v1StorageData = TestDummy.dummyStorage(v1StoragePath)
  // t.context.legacyStorageData = TestDummy.dummyLegacyStorage(legacyStoragePath)

  localStorage.setItem('storages', JSON.stringify([]))
})

test.serial('Add Storage', t => {
  const input = {
    type: 'FILESYSTEM',
    name: 'add-storage1',
    path: v1StoragePath
  }
  return Promise.resolve()
    .then(function doTest() {
      return addStorage(input)
    })
    .then(function validateResult(data) {
      const { storage, notes } = data

      // Check data.storage
      t.true(_.isString(storage.key))
      t.is(storage.name, input.name)
      t.is(storage.type, input.type)
      t.is(storage.path, input.path)
      t.is(storage.version, '1.0')
      t.is(storage.folders.length, t.context.v1StorageData.json.folders.length)

      // Check data.notes
      t.is(notes.length, t.context.v1StorageData.notes.length)
      notes.forEach(function validateNote(note) {
        t.is(note.storage, storage.key)
      })

      // Check localStorage
      const cacheData = _.find(JSON.parse(localStorage.getItem('storages')), {
        key: data.storage.key
      })
      t.is(cacheData.name, input.name)
      t.is(cacheData.type, input.type)
      t.is(cacheData.path, input.path)

      // Check boostnote.json
      const jsonData = CSON.readFileSync(
        path.join(storage.path, 'boostnote.json')
      )
      t.true(_.isArray(jsonData.folders))
      t.is(jsonData.version, '1.0')
      t.is(jsonData.folders.length, t.context.v1StorageData.json.folders.length)
    })
})

test.after.always(() => {
  localStorage.clear()
  sander.rimrafSync(v1StoragePath)
})
