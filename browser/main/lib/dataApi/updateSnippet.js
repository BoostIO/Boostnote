import fs from 'fs'
import consts from 'browser/lib/consts'

function updateSnippet(snippet, snippetFile) {
  return new Promise((resolve, reject) => {
    const snippets = JSON.parse(
      fs.readFileSync(snippetFile || consts.SNIPPET_FILE, 'utf-8')
    )

    for (let i = 0; i < snippets.length; i++) {
      const currentSnippet = snippets[i]

      if (currentSnippet.id === snippet.id) {
        if (
          currentSnippet.name === snippet.name &&
          currentSnippet.prefix === snippet.prefix &&
          currentSnippet.content === snippet.content &&
          currentSnippet.linesHighlighted === snippet.linesHighlighted
        ) {
          // if everything is the same then don't write to disk
          resolve(snippets)
        } else {
          currentSnippet.name = snippet.name
          currentSnippet.prefix = snippet.prefix
          currentSnippet.content = snippet.content
          currentSnippet.linesHighlighted = snippet.linesHighlighted
          fs.writeFile(
            snippetFile || consts.SNIPPET_FILE,
            JSON.stringify(snippets, null, 4),
            err => {
              if (err) reject(err)
              resolve(snippets)
            }
          )
        }
      }
    }
  })
}

module.exports = updateSnippet
