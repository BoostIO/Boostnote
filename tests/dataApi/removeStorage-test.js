const test = require('ava')
const removeStorage = require('browser/main/lib/dataApi/removeStorage')

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

const storagePath = path.join(os.tmpdir(), 'test/remove-storage')

test.beforeEach(t => {
  t.context.storage = TestDummy.dummyStorage(storagePath)
  localStorage.setItem('storages', JSON.stringify([t.context.storage.cache]))
})

test('Remove a storage', t => {
  const storageKey = t.context.storage.cache.key
  return Promise.resolve()
    .then(function doTest() {
      return removeStorage(storageKey)
    })
    .then(function assert(data) {
      t.is(JSON.parse(localStorage.getItem('storages')).length, 0)
    })
})

test.after(function after() {
  localStorage.clear()
  sander.rimrafSync(storagePath)
})
