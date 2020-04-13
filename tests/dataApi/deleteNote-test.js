const test = require('ava')
const createNote = require('browser/main/lib/dataApi/createNote')
const deleteNote = require('browser/main/lib/dataApi/deleteNote')

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
const faker = require('faker')
const fs = require('fs')
const attachmentManagement = require('browser/main/lib/dataApi/attachmentManagement')

const storagePath = path.join(os.tmpdir(), 'test/delete-note')

test.beforeEach(t => {
  t.context.storage = TestDummy.dummyStorage(storagePath)
  localStorage.setItem('storages', JSON.stringify([t.context.storage.cache]))
})

test.serial('Delete a note', t => {
  const storageKey = t.context.storage.cache.key
  const folderKey = t.context.storage.json.folders[0].key

  const input1 = {
    type: 'SNIPPET_NOTE',
    description: faker.lorem.lines(),
    snippets: [
      {
        name: faker.system.fileName(),
        mode: 'text',
        content: faker.lorem.lines()
      }
    ],
    tags: faker.lorem.words().split(' '),
    folder: folderKey
  }
  input1.title = input1.description.split('\n').shift()

  return Promise.resolve()
    .then(function doTest() {
      return createNote(storageKey, input1)
        .then(function createAttachmentFolder(data) {
          fs.mkdirSync(
            path.join(storagePath, attachmentManagement.DESTINATION_FOLDER)
          )
          fs.mkdirSync(
            path.join(
              storagePath,
              attachmentManagement.DESTINATION_FOLDER,
              data.key
            )
          )
          return data
        })
        .then(function(data) {
          return deleteNote(storageKey, data.key)
        })
    })
    .then(function assert(data) {
      try {
        CSON.readFileSync(
          path.join(storagePath, 'notes', data.noteKey + '.cson')
        )
        t.fail('note cson must be deleted.')
      } catch (err) {
        t.is(err.code, 'ENOENT')
        return data
      }
    })
    .then(function assertAttachmentFolderDeleted(data) {
      const attachmentFolderPath = path.join(
        storagePath,
        attachmentManagement.DESTINATION_FOLDER,
        data.noteKey
      )
      t.is(fs.existsSync(attachmentFolderPath), false)
    })
})

test.after(function after() {
  localStorage.clear()
  sander.rimrafSync(storagePath)
})
