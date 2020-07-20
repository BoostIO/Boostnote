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

let storageContext

beforeEach(() => {
  storageContext = TestDummy.dummyStorage(storagePath)
  localStorage.setItem('storages', JSON.stringify([storageContext.cache]))
})

it('Create a note from URL', () => {
  const storageKey = storageContext.cache.key
  const folderKey = storageContext.json.folders[0].key

  const url = 'https://shapeshed.com/writing-cross-platform-node/'

  return createNoteFromUrl(url, storageKey, folderKey).then(function assert({
    note
  }) {
    expect(storageKey).toEqual(note.storage)
    const jsonData = CSON.readFileSync(
      path.join(storagePath, 'notes', note.key + '.cson')
    )

    // Test if saved content is matching the created in memory note
    expect(note.content).toEqual(jsonData.content)
    expect(note.tags.length).toEqual(jsonData.tags.length)
  })
})

afterAll(function after() {
  localStorage.clear()
  sander.rimrafSync(storagePath)
})
