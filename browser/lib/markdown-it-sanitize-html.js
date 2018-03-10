'use strict'

import sanitizeHtml from 'sanitize-html'

module.exports = function sanitizePlugin (md, options) {
  options = options || {}

  md.core.ruler.after('linkify', 'sanitize_inline', state => {
    for (let tokenIdx = 0; tokenIdx < state.tokens.length; tokenIdx++) {
      if (state.tokens[tokenIdx].type === 'html_block') {
        state.tokens[tokenIdx].content = sanitizeHtml(state.tokens[tokenIdx].content, options)
      }
      if (state.tokens[tokenIdx].type === 'inline') {
        const inlineTokens = state.tokens[tokenIdx].children
        for (let childIdx = 0; childIdx < inlineTokens.length; childIdx++) {
          if (inlineTokens[childIdx].type === 'html_inline') {
            inlineTokens[childIdx].content = sanitizeHtml(inlineTokens[childIdx].content, options)
          }
        }
      }
    }
  })
}
