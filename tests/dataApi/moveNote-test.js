const test = require('ava')
const moveNote = require('browser/main/lib/dataApi/moveNote')

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
const CSON = require('@rokt33r/season')

const storagePath = path.join(os.tmpdir(), 'test/move-note')
const storagePath2 = path.join(os.tmpdir(), 'test/move-note2')

test.beforeEach(t => {
  t.context.storage1 = TestDummy.dummyStorage(storagePath)
  t.context.storage2 = TestDummy.dummyStorage(storagePath2)
  localStorage.setItem(
    'storages',
    JSON.stringify([t.context.storage1.cache, t.context.storage2.cache])
  )
})

test.serial('Move a note', t => {
  const storageKey1 = t.context.storage1.cache.key
  const folderKey1 = t.context.storage1.json.folders[0].key
  const note1 = t.context.storage1.notes[0]
  const note2 = t.context.storage1.notes[1]
  const storageKey2 = t.context.storage2.cache.key
  const folderKey2 = t.context.storage2.json.folders[0].key

  return Promise.resolve()
    .then(function doTest() {
      return Promise.all([
        moveNote(storageKey1, note1.key, storageKey1, folderKey1),
        moveNote(storageKey1, note2.key, storageKey2, folderKey2)
      ])
    })
    .then(function assert(data) {
      const data1 = data[0]
      const data2 = data[1]

      const jsonData1 = CSON.readFileSync(
        path.join(storagePath, 'notes', data1.key + '.cson')
      )

      t.is(jsonData1.folder, folderKey1)
      t.is(jsonData1.title, note1.title)

      const jsonData2 = CSON.readFileSync(
        path.join(storagePath2, 'notes', data2.key + '.cson')
      )
      t.is(jsonData2.folder, folderKey2)
      t.is(jsonData2.title, note2.title)
      try {
        CSON.readFileSync(path.join(storagePath, 'notes', note2.key + '.cson'))
        t.fail('The old note should be deleted.')
      } catch (err) {
        t.is(err.code, 'ENOENT')
      }
    })
})

test.after(function after() {
  localStorage.clear()
  sander.rimrafSync(storagePath)
  sander.rimrafSync(storagePath2)
})
