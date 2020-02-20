const test = require('ava')
const reorderFolder = require('browser/main/lib/dataApi/reorderFolder')

global.document = require('jsdom').jsdom('<body></body>')
global.window = document.defaultView
global.navigator = window.navigator

const Storage = require('dom-storage')
const localStorage = (window.localStorage = global.localStorage = new Storage(
  null,
  { strict: true }
))
const path = require('path')
const _ = require('lodash')
const TestDummy = require('../fixtures/TestDummy')
const sander = require('sander')
const os = require('os')
const CSON = require('@rokt33r/season')

const storagePath = path.join(os.tmpdir(), 'test/reorder-folder')

test.beforeEach(t => {
  t.context.storage = TestDummy.dummyStorage(storagePath)
  localStorage.setItem('storages', JSON.stringify([t.context.storage.cache]))
})

test.serial('Reorder a folder', t => {
  const storageKey = t.context.storage.cache.key
  const firstFolderKey = t.context.storage.json.folders[0].key
  const secondFolderKey = t.context.storage.json.folders[1].key

  return Promise.resolve()
    .then(function doTest() {
      return reorderFolder(storageKey, 0, 1)
    })
    .then(function assert(data) {
      t.true(_.nth(data.storage.folders, 0).key === secondFolderKey)
      t.true(_.nth(data.storage.folders, 1).key === firstFolderKey)

      const jsonData = CSON.readFileSync(
        path.join(data.storage.path, 'boostnote.json')
      )

      t.true(_.nth(jsonData.folders, 0).key === secondFolderKey)
      t.true(_.nth(jsonData.folders, 1).key === firstFolderKey)
    })
})

test.after(function after() {
  localStorage.clear()
  sander.rimrafSync(storagePath)
})
