const test = require('ava')
const deleteSnippet = require('browser/main/lib/dataApi/deleteSnippet')
const sander = require('sander')
const os = require('os')
const path = require('path')
const crypto = require('crypto')

const snippetFilePath = path.join(os.tmpdir(), 'test', 'delete-snippet')
const snippetFile = path.join(snippetFilePath, 'snippets.json')
const newSnippet = {
  id: crypto.randomBytes(16).toString('hex'),
  name: 'Unnamed snippet',
  prefix: [],
  content: ''
}

test.beforeEach(t => {
  sander.writeFileSync(snippetFile, JSON.stringify([newSnippet]))
})

test.serial('Delete a snippet', t => {
  return Promise.resolve()
    .then(function doTest() {
      return Promise.all([deleteSnippet(newSnippet, snippetFile)])
    })
    .then(function assert(data) {
      data = data[0]
      const snippets = JSON.parse(sander.readFileSync(snippetFile))
      t.is(snippets.length, 0)
    })
})

test.after.always(() => {
  sander.rimrafSync(snippetFilePath)
})
