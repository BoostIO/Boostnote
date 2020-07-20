const deleteFolder = require('browser/main/lib/dataApi/deleteFolder')
const attachmentManagement = require('browser/main/lib/dataApi/attachmentManagement')
const createNote = require('browser/main/lib/dataApi/createNote')
const fs = require('fs')
const faker = require('faker')

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
const CSON = require('@rokt33r/season')

const storagePath = path.join(os.tmpdir(), 'test/delete-folder')

let storageContext

beforeEach(() => {
  storageContext = TestDummy.dummyStorage(storagePath)
  localStorage.setItem('storages', JSON.stringify([storageContext.cache]))
})

it('Delete a folder', () => {
  const storageKey = storageContext.cache.key
  const folderKey = storageContext.json.folders[0].key
  let noteKey

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
    .then(function prepare() {
      return createNote(storageKey, input1).then(
        function createAttachmentFolder(data) {
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
          noteKey = data.key

          return data
        }
      )
    })
    .then(function doTest() {
      return deleteFolder(storageKey, folderKey)
    })
    .then(function assert(data) {
      expect(_.find(data.storage.folders, { key: folderKey })).toBeUndefined()
      const jsonData = CSON.readFileSync(
        path.join(data.storage.path, 'boostnote.json')
      )

      expect(_.find(jsonData.folders, { key: folderKey })).toBeUndefined()
      const notePaths = sander.readdirSync(data.storage.path, 'notes')
      expect(notePaths.length).toBe(
        storageContext.notes.filter(note => note.folder !== folderKey).length
      )

      const attachmentFolderPath = path.join(
        storagePath,
        attachmentManagement.DESTINATION_FOLDER,
        noteKey
      )
      expect(fs.existsSync(attachmentFolderPath)).toBe(false)
    })
})

afterAll(() => {
  localStorage.clear()
  sander.rimrafSync(storagePath)
})
