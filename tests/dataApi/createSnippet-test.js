const test = require('ava')
const createSnippet = require('browser/main/lib/dataApi/createSnippet')
const sander = require('sander')
const os = require('os')
const path = require('path')

const snippetFilePath = path.join(os.tmpdir(), 'test', 'create-snippet')
const snippetFile = path.join(snippetFilePath, 'snippets.json')

test.beforeEach((t) => {
  sander.writeFileSync(snippetFile, '[]')
})

test.serial('Create a snippet', (t) => {
  return Promise.resolve()
    .then(function doTest () {
      return Promise.all([
        createSnippet(snippetFile)
      ])
    })
    .then(function assert (data) {
      data = data[0]
      const snippets = JSON.parse(sander.readFileSync(snippetFile))
      const snippet = snippets.find(currentSnippet => currentSnippet.id === data.id)
      t.not(snippet, undefined)
      t.is(snippet.name, data.name)
      t.deepEqual(snippet.prefix, data.prefix)
      t.is(snippet.content, data.content)
    })
})

test.after.always(() => {
  sander.rimrafSync(snippetFilePath)
})
