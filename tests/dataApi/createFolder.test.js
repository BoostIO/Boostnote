const createFolder = require('browser/main/lib/dataApi/createFolder')

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

const storagePath = path.join(os.tmpdir(), 'test/create-folder')

let storageContext

beforeAll(() => {
  storageContext = TestDummy.dummyStorage(storagePath)
  localStorage.setItem('storages', JSON.stringify([storageContext.cache]))
})

it('Create a folder', done => {
  const storageKey = storageContext.cache.key
  const input = {
    name: 'created',
    color: '#ff5555'
  }
  return Promise.resolve()
    .then(() => {
      return createFolder(storageKey, input)
    })
    .then(data => {
      expect(_.find(data.storage.folders, input)).not.toBeNull()
      const jsonData = CSON.readFileSync(
        path.join(data.storage.path, 'boostnote.json')
      )
      expect(_.find(jsonData.folders, input)).not.toBeNull()
      done()
    })
})

afterAll(() => {
  localStorage.clear()
  sander.rimrafSync(storagePath)
})
