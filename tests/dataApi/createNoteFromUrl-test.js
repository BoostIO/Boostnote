const test = require('ava')
const createNoteFromUrl = require('browser/main/lib/dataApi/createNoteFromUrl')

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

const storagePath = path.join(os.tmpdir(), 'test/create-note-from-url')

test.beforeEach(t => {
  t.context.storage = TestDummy.dummyStorage(storagePath)
  localStorage.setItem('storages', JSON.stringify([t.context.storage.cache]))
})

test.serial('Create a note from URL', t => {
  const storageKey = t.context.storage.cache.key
  const folderKey = t.context.storage.json.folders[0].key

  const url = 'https://shapeshed.com/writing-cross-platform-node/'

  return createNoteFromUrl(url, storageKey, folderKey).then(function assert({
    note
  }) {
    t.is(storageKey, note.storage)
    const jsonData = CSON.readFileSync(
      path.join(storagePath, 'notes', note.key + '.cson')
    )

    // Test if saved content is matching the created in memory note
    t.is(note.content, jsonData.content)
    t.is(note.tags.length, jsonData.tags.length)
  })
})

test.after(function after() {
  localStorage.clear()
  sander.rimrafSync(storagePath)
})
