const test = require('ava')
const { findStorage } = require('browser/lib/findStorage')

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
const os = require('os')
const storagePath = path.join(os.tmpdir(), 'test/find-storage')

test.beforeEach(t => {
  t.context.storage = TestDummy.dummyStorage(storagePath)
  localStorage.setItem('storages', JSON.stringify([t.context.storage.cache]))
})

// Unit test
test('findStorage() should return a correct storage path(string)', t => {
  const storageKey = t.context.storage.cache.key

  t.is(findStorage(storageKey).key, storageKey)
  t.is(findStorage(storageKey).path, storagePath)
})

test.after(function after() {
  localStorage.clear()
  sander.rimrafSync(storagePath)
})
