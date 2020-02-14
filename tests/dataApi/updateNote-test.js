const test = require('ava')
const createNote = require('browser/main/lib/dataApi/createNote')
const updateNote = require('browser/main/lib/dataApi/updateNote')

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

const storagePath = path.join(os.tmpdir(), 'test/update-note')

test.beforeEach(t => {
  t.context.storage = TestDummy.dummyStorage(storagePath)
  localStorage.setItem('storages', JSON.stringify([t.context.storage.cache]))
})

test.serial('Update a note', t => {
  const storageKey = t.context.storage.cache.key
  const folderKey = t.context.storage.json.folders[0].key

  const randLinesHighlightedArray = new Array(10)
    .fill()
    .map(() => Math.round(Math.random() * 10))
  const randLinesHighlightedArray2 = new Array(15)
    .fill()
    .map(() => Math.round(Math.random() * 15))

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

  const input3 = {
    type: 'SNIPPET_NOTE',
    description: faker.lorem.lines(),
    snippets: [
      {
        name: faker.system.fileName(),
        mode: 'text',
        content: faker.lorem.lines(),
        linesHighlighted: randLinesHighlightedArray2
      }
    ],
    tags: faker.lorem.words().split(' ')
  }
  input3.title = input3.description.split('\n').shift()

  const input4 = {
    type: 'MARKDOWN_NOTE',
    content: faker.lorem.lines(),
    tags: faker.lorem.words().split(' '),
    linesHighlighted: randLinesHighlightedArray2
  }
  input4.title = input4.content.split('\n').shift()

  return Promise.resolve()
    .then(function doTest() {
      return Promise.all([
        createNote(storageKey, input1),
        createNote(storageKey, input2)
      ]).then(function updateNotes(data) {
        const data1 = data[0]
        const data2 = data[1]
        return Promise.all([
          updateNote(data1.storage, data1.key, input3),
          updateNote(data1.storage, data2.key, input4)
        ])
      })
    })
    .then(function assert(data) {
      const data1 = data[0]
      const data2 = data[1]

      const jsonData1 = CSON.readFileSync(
        path.join(storagePath, 'notes', data1.key + '.cson')
      )
      t.is(input3.title, data1.title)
      t.is(input3.title, jsonData1.title)
      t.is(input3.description, data1.description)
      t.is(input3.description, jsonData1.description)
      t.is(input3.tags.length, data1.tags.length)
      t.is(input3.tags.length, jsonData1.tags.length)
      t.is(input3.snippets.length, data1.snippets.length)
      t.is(input3.snippets.length, jsonData1.snippets.length)
      t.is(input3.snippets[0].content, data1.snippets[0].content)
      t.is(input3.snippets[0].content, jsonData1.snippets[0].content)
      t.is(input3.snippets[0].name, data1.snippets[0].name)
      t.is(input3.snippets[0].name, jsonData1.snippets[0].name)
      t.deepEqual(
        input3.snippets[0].linesHighlighted,
        data1.snippets[0].linesHighlighted
      )
      t.deepEqual(
        input3.snippets[0].linesHighlighted,
        jsonData1.snippets[0].linesHighlighted
      )

      const jsonData2 = CSON.readFileSync(
        path.join(storagePath, 'notes', data2.key + '.cson')
      )
      t.is(input4.title, data2.title)
      t.is(input4.title, jsonData2.title)
      t.is(input4.content, data2.content)
      t.is(input4.content, jsonData2.content)
      t.is(input4.tags.length, data2.tags.length)
      t.is(input4.tags.length, jsonData2.tags.length)
      t.deepEqual(input4.linesHighlighted, data2.linesHighlighted)
      t.deepEqual(input4.linesHighlighted, jsonData2.linesHighlighted)
    })
})

test.after(function after() {
  localStorage.clear()
  sander.rimrafSync(storagePath)
})
