const test = require('ava')
const exportStorage = require('browser/main/lib/dataApi/exportStorage')

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
const os = require('os')
const fs = require('fs')
const sander = require('sander')

test.beforeEach(t => {
  t.context.storageDir = path.join(os.tmpdir(), 'test/export-storage')
  t.context.storage = TestDummy.dummyStorage(t.context.storageDir)
  t.context.exportDir = path.join(os.tmpdir(), 'test/export-storage-output')
  try {
    fs.mkdirSync(t.context.exportDir)
  } catch (e) {}
  localStorage.setItem('storages', JSON.stringify([t.context.storage.cache]))
})

test.serial('Export a storage', t => {
  const storageKey = t.context.storage.cache.key
  const folders = t.context.storage.json.folders
  const notes = t.context.storage.notes
  const exportDir = t.context.exportDir
  const folderKeyToName = folders.reduce((acc, folder) => {
    acc[folder.key] = folder.name
    return acc
  }, {})
  return exportStorage(storageKey, 'md', exportDir).then(() => {
    notes.forEach(note => {
      const noteDir = path.join(
        exportDir,
        folderKeyToName[note.folder],
        `${note.title}.md`
      )
      if (note.type === 'MARKDOWN_NOTE') {
        t.true(fs.existsSync(noteDir))
        t.is(fs.readFileSync(noteDir, 'utf8'), note.content)
      } else if (note.type === 'SNIPPET_NOTE') {
        t.false(fs.existsSync(noteDir))
      }
    })
  })
})

test.afterEach.always(t => {
  localStorage.clear()
  sander.rimrafSync(t.context.storageDir)
  sander.rimrafSync(t.context.exportDir)
})
