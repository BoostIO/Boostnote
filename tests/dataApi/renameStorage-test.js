const test = require('ava')
const renameStorage = require('browser/main/lib/dataApi/renameStorage')

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

const storagePath = path.join(os.tmpdir(), 'test/rename-storage')

test.beforeEach(t => {
  t.context.storage = TestDummy.dummyStorage(storagePath)
  localStorage.setItem('storages', JSON.stringify([t.context.storage.cache]))
})

test.serial('Rename a storage', t => {
  const storageKey = t.context.storage.cache.key
  return Promise.resolve()
    .then(function doTest() {
      return renameStorage(storageKey, 'changed')
    })
    .then(function assert(data) {
      const cachedStorageList = JSON.parse(localStorage.getItem('storages'))
      t.true(_.find(cachedStorageList, { key: storageKey }).name === 'changed')
    })
})

test.after(function after() {
  localStorage.clear()
  sander.rimrafSync(storagePath)
})
