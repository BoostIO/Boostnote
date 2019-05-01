import { isSpace } from 'markdown-it/lib/common/utils'

function getHeading (state, startLine, endLine) {
  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false
  }

  const pos = state.bMarks[startLine] + state.tShift[startLine]
  if (state.src.charCodeAt(pos) === 0x23 && pos < state.eMarks[startLine]) {
    return getATXHeading(state, startLine, endLine)
  } else {
    return getSetextHeading(state, startLine, endLine)
  }
}

function getATXHeading (state, startLine, endLine) {
  let pos = state.bMarks[startLine] + state.tShift[startLine]
  let max = state.eMarks[startLine]
  let level = 1

  let ch = state.src.charCodeAt(++pos)
  while (ch === 0x23 && pos < max && level <= 6) {
    level++
    ch = state.src.charCodeAt(++pos)
  }

  if (level > 6 || (pos < max && !isSpace(ch))) {
    return false
  }

  max = state.skipSpacesBack(max, pos)
  const tmp = state.skipCharsBack(max, 0x23, pos)
  if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) {
    max = tmp
  }

  return {
    level,
    content: state.src.slice(pos, max).trim(),
    endLine: startLine,
    markup: '########'.slice(0, level)
  }
}

function getSetextHeading (state, startLine, endLine) {
  const terminatorRules = state.md.block.ruler.getRules('paragraph')
  let nextLine = startLine + 1
  let level
  let marker
  let terminate

  // jump line-by-line until empty one or EOF
  while (nextLine < endLine && !state.isEmpty(nextLine)) {
    // this would be a code block normally, but after paragraph
    // it's considered a lazy continuation regardless of what's there
    if (state.sCount[nextLine] - state.blkIndent > 3) {
      ++nextLine
      continue
    }

    //
    // Check for underline in setext header
    //
    if (state.sCount[nextLine] >= state.blkIndent) {
      let pos = state.bMarks[nextLine] + state.tShift[nextLine]
      const max = state.eMarks[nextLine]

      if (pos < max) {
        marker = state.src.charCodeAt(pos)

        if (marker === 0x2D/* - */ || marker === 0x3D/* = */) {
          pos = state.skipChars(pos, marker)
          pos = state.skipSpaces(pos)

          if (pos >= max) {
            level = (marker === 0x3D/* = */ ? 1 : 2)
            break
          }
        }
      }
    }

    // quirk for blockquotes, this line should already be checked by that rule
    if (state.sCount[nextLine] < 0) {
      ++nextLine
      continue
    }

    // Some tags can terminate paragraph without empty line.
    terminate = false
    for (let i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true
        break
      }
    }
    if (terminate) {
      break
    }

    ++nextLine
  }

  if (!level) {
    // Didn't find valid underline
    return false
  }

  return {
    level,
    content: state.getLines(startLine, nextLine, state.blkIndent, false).trim(),
    endLine: nextLine,
    markup: String.fromCharCode(marker)
  }
}

module.exports = function (levels) {
  return function automaticCollapsibleHeadingPlugin (md) {
    function parse (state, startLine, endLine, silent) {
      if (silent) {
        return false
      }

      const oldParentType = state.parentType
      state.parentType = 'paragraph'

      const heading = getHeading(state, startLine, endLine)

      if (!heading || levels.indexOf(heading.level) === -1) {
        state.parentType = oldParentType

        return false
      }

      let nextHeading = false
      let line = heading.endLine
      while (++line <= endLine) {
        if ((nextHeading = getHeading(state, line, endLine))) {
          if (nextHeading.level === heading.level) {
            break
          } else {
            line = nextHeading.endLine
          }
        }
      }

      state.line = line

      let token

      token = state.push('collapsible_block_open', 'details', 1)
      token.map = [startLine, line - 1]

      token = state.push('collapsible_block_summary_open', 'summary', 1)
      token.map = [startLine, heading.endLine]

      token = state.push('heading_open', 'h' + String(heading.level), 1)
      token.markup = heading.markup
      token.map = [ startLine, heading.endLine ]

      token = state.push('inline', '', 0)
      token.content = heading.content
      token.map = [ startLine, heading.endLine + 1 ]
      token.children = []

      token = state.push('heading_close', 'h' + String(heading.level), -1)
      token.markup = heading.markup

      token = state.push('collapsible_block_summary_close', 'summary', -1)

      state.parentType = oldParentType

      state.md.block.tokenize(state, heading.endLine + 1, line)

      token = state.push('collapsible_block_close', 'details', -1)

      return true
    }

    md.block.ruler.before('heading', 'automatic_collapsible_heading', parse, {
      alt: [ 'paragraph', 'reference', 'blockquote' ]
    })
  }
}
