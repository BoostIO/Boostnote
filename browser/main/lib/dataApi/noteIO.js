const _ = require('lodash')
const fs = require('fs-plus')
const CSON = require('@rokt33r/season')

function createMarkdown (input) {
  const content = input.content || ''
  const meta = _.omit(input, ['key', 'storage', 'content'])
  const result = CSON.stringify(meta)

  return `<!--\n${result}\n-->${content ? `\n\n${content}` : ''}`
}

function readNote (path) {
  const note = fs.readFileSync(path, { encoding: 'utf-8' })
  const split = note.split('-->')
  const metaString = (split[0] || '').replace('<!--', '').trim()
  const content = (split[1] || '').trim()
  try {
    const result = CSON.parse(metaString)
    result.content = content

    return result
  } catch (e) {
    console.log(metaString)
    throw e
  }
}

function writeNote (path, input) {
  const markdown = createMarkdown(input)
  fs.writeFileSync(path, markdown, { encoding: 'utf-8' })
}

module.exports.readNote = readNote
module.exports.writeNote = writeNote
