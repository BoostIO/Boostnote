'use strict'
import { normalizeReference } from 'markdown-it/lib/common/utils'
module.exports = function audioPlugin (md) {
  function audio (state, startLine) {
    // match @[](src.mp3) or @[refsrc]
    const audioSouceRegex = /^@\[.*\]\((.*?)\)/
    const audioReferenceSourceRegex = /^@\[(.*?)\]/
    const start = state.bMarks[startLine]
    const end = state.eMarks[startLine]
    let token = null

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4) { return false }

    // Audio must be at start of input or the previous line must be blank.
    if (startLine !== 0) {
      const prevLineStartPos = state.bMarks[startLine - 1] + state.tShift[startLine - 1]
      const prevLineMaxPos = state.eMarks[startLine - 1]
      if (prevLineMaxPos > prevLineStartPos) return false
    }

    let match = audioSouceRegex.exec(state.src.slice(start, end))
    if (!match || match.length < 2) {
      match = audioReferenceSourceRegex.exec(state.src.slice(start, end))
    }
    if (!match || match.length < 2) {
      return false
    }
    let src = match[1]
    // this is a reference link
    if (!src.endsWith('.mp3') && !src.endsWith('.wav') && !src.endsWith('.ogg')) {
      if (typeof state.env.references === 'undefined') {
        return false
      }
      src = state.env.references[normalizeReference(src)].href
    }
    token = state.push('audio')
    state.line = startLine + 1
    token.src = src
    return true
  }

  function audioRender (tokens, idx) {
    const token = tokens[idx]
    return `<audio class='audio-player' src='${token.src}' controls></audio>`
  }

  md.block.ruler.before('fence', 'audio', audio, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  })

  md.renderer.rules['audio'] = audioRender
}
