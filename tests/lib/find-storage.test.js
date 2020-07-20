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

let storageContext

beforeEach(() => {
  storageContext = TestDummy.dummyStorage(storagePath)
  localStorage.setItem('storages', JSON.stringify([storageContext.cache]))
})

// Unit test
test('findStorage() should return a correct storage path(string)', () => {
  const storageKey = storageContext.cache.key

  expect(findStorage(storageKey).key).toBe(storageKey)
  expect(findStorage(storageKey).path).toBe(storagePath)
})

afterAll(function after() {
  localStorage.clear()
  sander.rimrafSync(storagePath)
})
