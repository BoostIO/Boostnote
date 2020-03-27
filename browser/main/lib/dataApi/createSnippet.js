import fs from 'fs'
import crypto from 'crypto'
import consts from 'browser/lib/consts'
import fetchSnippet from 'browser/main/lib/dataApi/fetchSnippet'

function createSnippet(snippetFile) {
  return new Promise((resolve, reject) => {
    const newSnippet = {
      id: crypto.randomBytes(16).toString('hex'),
      name: 'Unnamed snippet',
      prefix: [],
      content: '',
      linesHighlighted: []
    }
    fetchSnippet(null, snippetFile)
      .then(snippets => {
        snippets.push(newSnippet)
        fs.writeFile(
          snippetFile || consts.SNIPPET_FILE,
          JSON.stringify(snippets, null, 4),
          err => {
            if (err) reject(err)
            resolve(newSnippet)
          }
        )
      })
      .catch(err => {
        reject(err)
      })
  })
}

module.exports = createSnippet
