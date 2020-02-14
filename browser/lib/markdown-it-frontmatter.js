'use strict'

module.exports = function frontMatterPlugin(md) {
  function frontmatter(state, startLine, endLine, silent) {
    if (
      startLine !== 0 ||
      state.src.substr(startLine, state.eMarks[0]) !== '---'
    ) {
      return false
    }

    let line = 0
    while (++line < state.lineMax) {
      if (
        state.src.substring(state.bMarks[line], state.eMarks[line]) === '---'
      ) {
        state.line = line + 1

        return true
      }
    }

    return false
  }

  md.block.ruler.before('table', 'frontmatter', frontmatter, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  })
}
