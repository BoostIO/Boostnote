import searchFromNotes from 'browser/lib/search'
import { dummyNote } from '../fixtures/TestDummy'
import _ from 'lodash'

const pickContents = notes =>
  notes.map(note => {
    return note.content
  })

let notes = []
let note1, note2, note3

beforeAll(() => {
  const data1 = { type: 'MARKDOWN_NOTE', content: 'content1', tags: ['tag1'] }
  const data2 = {
    type: 'MARKDOWN_NOTE',
    content: 'content1\ncontent2',
    tags: ['tag1', 'tag2']
  }
  const data3 = { type: 'MARKDOWN_NOTE', content: '#content4', tags: ['tag1'] }

  note1 = dummyNote(data1)
  note2 = dummyNote(data2)
  note3 = dummyNote(data3)

  notes = [note1, note2, note3]
})

test('it can find notes by tags and words', () => {
  // [input, expected content (Array)]
  const testWithTags = [
    ['#tag1', [note1.content, note2.content, note3.content]],
    ['#tag1 #tag2', [note2.content]],
    ['#tag2 #tag1', [note2.content]],
    ['#tag1 #tag2 #tag3', []],
    ['content1', [note1.content, note2.content]],
    ['content1 content2', [note2.content]],
    ['content1 content2 content3', []],
    ['#content4', [note3.content]],
    ['#tag2 content1', [note2.content]],
    ['content1 #tag2', [note2.content]]
  ]
  const testWithTagsWithoutHash = testWithTags.map(function(testCase) {
    return [testCase[0].replace(/#/g, ''), testCase[1]]
  })

  const testCases = testWithTags.concat(testWithTagsWithoutHash)
  testCases.forEach(testCase => {
    const [input, expectedContents] = testCase
    const results = searchFromNotes(notes, input)
    expect(
      _.isEqual(pickContents(results).sort(), expectedContents.sort())
    ).toBe(true)
  })
})
