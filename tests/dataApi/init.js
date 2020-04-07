const test = require('ava')
const init = require('browser/main/lib/dataApi/init')

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
const keygen = require('browser/lib/keygen')
const sander = require('sander')
const _ = require('lodash')
const os = require('os')

const v1StoragePath = path.join(os.tmpdir(), 'test/init-v1-storage')
const legacyStoragePath = path.join(os.tmpdir(), 'test/init-legacy-storage')
const emptyDirPath = path.join(os.tmpdir(), 'test/init-empty-storage')

test.beforeEach(t => {
  localStorage.clear()
  // Prepare 3 types of dir
  t.context.v1StorageData = TestDummy.dummyStorage(v1StoragePath, {
    cache: { name: 'v1' }
  })
  t.context.legacyStorageData = TestDummy.dummyLegacyStorage(
    legacyStoragePath,
    { cache: { name: 'legacy' } }
  )
  t.context.emptyStorageData = {
    cache: {
      type: 'FILESYSTEM',
      name: 'empty',
      key: keygen(),
      path: emptyDirPath
    }
  }

  localStorage.setItem(
    'storages',
    JSON.stringify([
      t.context.v1StorageData.cache,
      t.context.legacyStorageData.cache,
      t.context.emptyStorageData.cache
    ])
  )
})

test.serial('Initialize All Storages', t => {
  const { v1StorageData, legacyStorageData } = t.context
  return Promise.resolve()
    .then(function test() {
      return init()
    })
    .then(function assert(data) {
      t.true(Array.isArray(data.storages))
      t.is(
        data.notes.length,
        v1StorageData.notes.length + legacyStorageData.notes.length
      )
      t.is(data.storages.length, 3)
      data.storages.forEach(function assertStorage(storage) {
        t.true(_.isString(storage.key))
        t.true(_.isString(storage.name))
        t.true(storage.type === 'FILESYSTEM')
        t.true(_.isString(storage.path))
      })
    })
    .then(function after() {
      localStorage.clear()
    })
})

test.after.always(() => {
  localStorage.clear()
  sander.rimrafSync(v1StoragePath)
  sander.rimrafSync(legacyStoragePath)
  sander.rimrafSync(emptyDirPath)
})
