const test = require('ava')
const migrateFromV6Storage = require('browser/main/lib/dataApi/migrateFromV6Storage')

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
const CSON = require('@rokt33r/season')
const _ = require('lodash')
const os = require('os')

const dummyStoragePath = path.join(os.tmpdir(), 'test/migrate-test-storage')

test.beforeEach(t => {
  const dummyData = (t.context.dummyData = TestDummy.dummyLegacyStorage(
    dummyStoragePath
  ))
  console.log('init count', dummyData.notes.length)
  localStorage.setItem('storages', JSON.stringify([dummyData.cache]))
})

test.serial('Migrate legacy storage into v1 storage', t => {
  return Promise.resolve()
    .then(function test() {
      return migrateFromV6Storage(dummyStoragePath)
    })
    .then(function assert(data) {
      // Check the result. It must be true if succeed.
      t.true(data)

      // Check all notes migrated.
      const dummyData = t.context.dummyData
      const noteDirPath = path.join(dummyStoragePath, 'notes')
      const fileList = sander.readdirSync(noteDirPath)
      t.is(dummyData.notes.length, fileList.length)
      const noteMap = fileList.map(filePath => {
        return CSON.readFileSync(path.join(noteDirPath, filePath))
      })
      dummyData.notes.forEach(function(targetNote) {
        t.true(
          _.find(noteMap, {
            title: targetNote.title,
            folder: targetNote.folder
          }) != null
        )
      })

      // Check legacy folder directory is removed
      dummyData.json.folders.forEach(function(folder) {
        try {
          sander.statSync(dummyStoragePath, folder.key)
          t.fail('Folder still remains. ENOENT error must be occured.')
        } catch (err) {
          t.is(err.code, 'ENOENT')
        }
      })
    })
})

test.after.always(function() {
  localStorage.clear()
  sander.rimrafSync(dummyStoragePath)
})
