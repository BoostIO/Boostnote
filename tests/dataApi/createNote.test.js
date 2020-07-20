const createNote = require('browser/main/lib/dataApi/createNote')

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

const storagePath = path.join(os.tmpdir(), 'test/create-note')

let storageContext

beforeEach(() => {
  storageContext = TestDummy.dummyStorage(storagePath)
  localStorage.setItem('storages', JSON.stringify([storageContext.cache]))
})

it('Create a note', done => {
  const storageKey = storageContext.cache.key
  const folderKey = storageContext.json.folders[0].key

  const randLinesHighlightedArray = new Array(10)
    .fill()
    .map(() => Math.round(Math.random() * 10))

  const input1 = {
    type: 'SNIPPET_NOTE',
    description: faker.lorem.lines(),
    snippets: [
      {
        name: faker.system.fileName(),
        mode: 'text',
        content: faker.lorem.lines(),
        linesHighlighted: randLinesHighlightedArray
      }
    ],
    tags: faker.lorem.words().split(' '),
    folder: folderKey
  }
  input1.title = input1.description.split('\n').shift()

  const input2 = {
    type: 'MARKDOWN_NOTE',
    content: faker.lorem.lines(),
    tags: faker.lorem.words().split(' '),
    folder: folderKey,
    linesHighlighted: randLinesHighlightedArray
  }
  input2.title = input2.content.split('\n').shift()

  return Promise.resolve()
    .then(() => {
      return Promise.all([
        createNote(storageKey, input1),
        createNote(storageKey, input2)
      ])
    })
    .then(data => {
      const data1 = data[0]
      const data2 = data[1]

      expect(storageKey).toEqual(data1.storage)
      const jsonData1 = CSON.readFileSync(
        path.join(storagePath, 'notes', data1.key + '.cson')
      )

      expect(input1.title).toEqual(data1.title)
      expect(input1.title).toEqual(jsonData1.title)
      expect(input1.description).toEqual(data1.description)
      expect(input1.description).toEqual(jsonData1.description)
      expect(input1.tags.length).toEqual(data1.tags.length)
      expect(input1.tags.length).toEqual(jsonData1.tags.length)
      expect(input1.snippets.length).toEqual(data1.snippets.length)
      expect(input1.snippets.length).toEqual(jsonData1.snippets.length)
      expect(input1.snippets[0].content).toEqual(data1.snippets[0].content)
      expect(input1.snippets[0].content).toEqual(jsonData1.snippets[0].content)
      expect(input1.snippets[0].name).toEqual(data1.snippets[0].name)
      expect(input1.snippets[0].name).toEqual(jsonData1.snippets[0].name)
      expect(input1.snippets[0].linesHighlighted).toEqual(
        data1.snippets[0].linesHighlighted
      )
      expect(input1.snippets[0].linesHighlighted).toEqual(
        jsonData1.snippets[0].linesHighlighted
      )

      expect(storageKey).toEqual(data2.storage)
      const jsonData2 = CSON.readFileSync(
        path.join(storagePath, 'notes', data2.key + '.cson')
      )
      expect(input2.title).toEqual(data2.title)
      expect(input2.title).toEqual(jsonData2.title)
      expect(input2.content).toEqual(data2.content)
      expect(input2.content).toEqual(jsonData2.content)
      expect(input2.tags.length).toEqual(data2.tags.length)
      expect(input2.tags.length).toEqual(jsonData2.tags.length)
      expect(input2.linesHighlighted).toEqual(data2.linesHighlighted)
      expect(input2.linesHighlighted).toEqual(jsonData2.linesHighlighted)

      done()
    })
})

afterAll(function after() {
  localStorage.clear()
  sander.rimrafSync(storagePath)
})
