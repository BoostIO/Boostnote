'use strict'

module.exports = function definitionListPlugin(md) {
  var isSpace = md.utils.isSpace

  // Search `[:~][\n ]`, returns next pos after marker on success
  // or -1 on fail.
  function skipMarker(state, line) {
    let start = state.bMarks[line] + state.tShift[line]
    const max = state.eMarks[line]

    if (start >= max) {
      return -1
    }

    // Check bullet
    const marker = state.src.charCodeAt(start++)
    if (marker !== 0x7e /* ~ */ && marker !== 0x3a /* : */) {
      return -1
    }

    const pos = state.skipSpaces(start)

    // require space after ":"
    if (start === pos) {
      return -1
    }

    return start
  }

  function markTightParagraphs(state, idx) {
    const level = state.level + 2

    let i
    let l
    for (i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
      if (
        state.tokens[i].level === level &&
        state.tokens[i].type === 'paragraph_open'
      ) {
        state.tokens[i + 2].hidden = true
        state.tokens[i].hidden = true
        i += 2
      }
    }
  }

  function deflist(state, startLine, endLine, silent) {
    var ch,
      contentStart,
      ddLine,
      dtLine,
      itemLines,
      listLines,
      listTokIdx,
      max,
      newEndLine,
      nextLine,
      offset,
      oldDDIndent,
      oldIndent,
      oldLineMax,
      oldParentType,
      oldSCount,
      oldTShift,
      oldTight,
      pos,
      prevEmptyEnd,
      tight,
      token

    if (silent) {
      // quirk: validation mode validates a dd block only, not a whole deflist
      if (state.ddIndent < 0) {
        return false
      }
      return skipMarker(state, startLine) >= 0
    }

    nextLine = startLine + 1
    if (nextLine >= endLine) {
      return false
    }

    if (state.isEmpty(nextLine)) {
      nextLine++
      if (nextLine >= endLine) {
        return false
      }
    }

    if (state.sCount[nextLine] < state.blkIndent) {
      return false
    }
    contentStart = skipMarker(state, nextLine)
    if (contentStart < 0) {
      return false
    }

    // Start list
    listTokIdx = state.tokens.length
    tight = true

    token = state.push('dl_open', 'dl', 1)
    token.map = listLines = [startLine, 0]

    //
    // Iterate list items
    //

    dtLine = startLine
    ddLine = nextLine

    // One definition list can contain multiple DTs,
    // and one DT can be followed by multiple DDs.
    //
    // Thus, there is two loops here, and label is
    // needed to break out of the second one
    //
    /* eslint no-labels:0,block-scoped-var:0 */
    OUTER: for (;;) {
      prevEmptyEnd = false

      token = state.push('dt_open', 'dt', 1)
      token.map = [dtLine, dtLine]

      token = state.push('inline', '', 0)
      token.map = [dtLine, dtLine]
      token.content = state
        .getLines(dtLine, dtLine + 1, state.blkIndent, false)
        .trim()
      token.children = []

      token = state.push('dt_close', 'dt', -1)

      for (;;) {
        token = state.push('dd_open', 'dd', 1)
        token.map = itemLines = [ddLine, 0]

        pos = contentStart
        max = state.eMarks[ddLine]
        offset =
          state.sCount[ddLine] +
          contentStart -
          (state.bMarks[ddLine] + state.tShift[ddLine])

        while (pos < max) {
          ch = state.src.charCodeAt(pos)

          if (isSpace(ch)) {
            if (ch === 0x09) {
              offset += 4 - (offset % 4)
            } else {
              offset++
            }
          } else {
            break
          }

          pos++
        }

        contentStart = pos

        oldTight = state.tight
        oldDDIndent = state.ddIndent
        oldIndent = state.blkIndent
        oldTShift = state.tShift[ddLine]
        oldSCount = state.sCount[ddLine]
        oldParentType = state.parentType
        state.blkIndent = state.ddIndent = state.sCount[ddLine] + 2
        state.tShift[ddLine] = contentStart - state.bMarks[ddLine]
        state.sCount[ddLine] = offset
        state.tight = true
        state.parentType = 'deflist'

        newEndLine = ddLine
        while (
          ++newEndLine < endLine &&
          (state.sCount[newEndLine] >= state.sCount[ddLine] ||
            state.isEmpty(newEndLine))
        ) {}

        oldLineMax = state.lineMax
        state.lineMax = newEndLine

        state.md.block.tokenize(state, ddLine, newEndLine, true)

        state.lineMax = oldLineMax

        // If any of list item is tight, mark list as tight
        if (!state.tight || prevEmptyEnd) {
          tight = false
        }
        // Item become loose if finish with empty line,
        // but we should filter last element, because it means list finish
        prevEmptyEnd = state.line - ddLine > 1 && state.isEmpty(state.line - 1)

        state.tShift[ddLine] = oldTShift
        state.sCount[ddLine] = oldSCount
        state.tight = oldTight
        state.parentType = oldParentType
        state.blkIndent = oldIndent
        state.ddIndent = oldDDIndent

        token = state.push('dd_close', 'dd', -1)

        itemLines[1] = nextLine = state.line

        if (nextLine >= endLine) {
          break OUTER
        }

        if (state.sCount[nextLine] < state.blkIndent) {
          break OUTER
        }
        contentStart = skipMarker(state, nextLine)
        if (contentStart < 0) {
          break
        }

        ddLine = nextLine

        // go to the next loop iteration:
        // insert DD tag and repeat checking
      }

      if (nextLine >= endLine) {
        break
      }
      dtLine = nextLine

      if (state.isEmpty(dtLine)) {
        break
      }
      if (state.sCount[dtLine] < state.blkIndent) {
        break
      }

      ddLine = dtLine + 1
      if (ddLine >= endLine) {
        break
      }
      if (state.isEmpty(ddLine)) {
        ddLine++
      }
      if (ddLine >= endLine) {
        break
      }

      if (state.sCount[ddLine] < state.blkIndent) {
        break
      }
      contentStart = skipMarker(state, ddLine)
      if (contentStart < 0) {
        break
      }

      // go to the next loop iteration:
      // insert DT and DD tags and repeat checking
    }

    // Finilize list
    token = state.push('dl_close', 'dl', -1)

    listLines[1] = nextLine

    state.line = nextLine

    // mark paragraphs tight if needed
    if (tight) {
      markTightParagraphs(state, listTokIdx)
    }

    return true
  }

  md.block.ruler.before('paragraph', 'deflist', deflist, {
    alt: ['paragraph', 'reference']
  })
}
