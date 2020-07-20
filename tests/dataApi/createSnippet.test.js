const createSnippet = require('browser/main/lib/dataApi/createSnippet')
const sander = require('sander')
const os = require('os')
const path = require('path')

const snippetFilePath = path.join(os.tmpdir(), 'test', 'create-snippet')
const snippetFile = path.join(snippetFilePath, 'snippets.json')

beforeEach(() => {
  sander.writeFileSync(snippetFile, '[]')
})

it('Create a snippet', () => {
  return Promise.resolve()
    .then(() => Promise.all([createSnippet(snippetFile)]))
    .then(function assert(data) {
      data = data[0]
      const snippets = JSON.parse(sander.readFileSync(snippetFile))
      const snippet = snippets.find(
        currentSnippet => currentSnippet.id === data.id
      )
      expect(snippet).not.toBeUndefined()
      expect(snippet.name).toEqual(data.name)
      expect(snippet.prefix).toEqual(data.prefix)
      expect(snippet.content).toEqual(data.content)
      expect(snippet.linesHighlighted).toEqual(data.linesHighlighted)
    })
})

afterAll(() => {
  sander.rimrafSync(snippetFilePath)
})
