'use strict'

module.exports = function(md, renderers, defaultRenderer) {
  const paramsRE = /^[ \t]*([\w+#-]+)?(?:\(((?:\s*\w[-\w]*(?:=(?:'(?:.*?[^\\])?'|"(?:.*?[^\\])?"|(?:[^'"][^\s]*)))?)*)\))?(?::([^:]*)(?::(\d+))?)?\s*$/

  function fence(state, startLine, endLine, silent) {
    let pos = state.bMarks[startLine] + state.tShift[startLine]
    let max = state.eMarks[startLine]

    if (state.sCount[startLine] - state.blkIndent >= 4 || pos + 3 > max) {
      return false
    }

    const marker = state.src.charCodeAt(pos)
    if (marker !== 0x7e /* ~ */ && marker !== 0x60 /* ` */) {
      return false
    }

    let mem = pos
    pos = state.skipChars(pos, marker)

    let len = pos - mem
    if (len < 3) {
      return false
    }

    const markup = state.src.slice(mem, pos)
    const params = state.src.slice(pos, max)

    if (silent) {
      return true
    }

    let nextLine = startLine
    let haveEndMarker = false

    while (true) {
      nextLine++
      if (nextLine >= endLine) {
        break
      }

      pos = mem = state.bMarks[nextLine] + state.tShift[nextLine]
      max = state.eMarks[nextLine]

      if (pos < max && state.sCount[nextLine] < state.blkIndent) {
        break
      }
      if (
        state.src.charCodeAt(pos) !== marker ||
        state.sCount[nextLine] - state.blkIndent >= 4
      ) {
        continue
      }

      pos = state.skipChars(pos, marker)

      if (pos - mem < len) {
        continue
      }

      pos = state.skipSpaces(pos)

      if (pos >= max) {
        haveEndMarker = true
        break
      }
    }

    len = state.sCount[startLine]
    state.line = nextLine + (haveEndMarker ? 1 : 0)

    const parameters = {}
    let langType = ''
    let fileName = ''
    let firstLineNumber = 1

    let match = paramsRE.exec(params)
    if (match) {
      if (match[1]) {
        langType = match[1]
      }
      if (match[3]) {
        fileName = match[3]
      }
      if (match[4]) {
        firstLineNumber = parseInt(match[4], 10)
      }

      if (match[2]) {
        const params = match[2]
        const regex = /(\w[-\w]*)(?:=(?:'(.*?[^\\])?'|"(.*?[^\\])?"|([^'"][^\s]*)))?/g

        let name, value
        while ((match = regex.exec(params))) {
          name = match[1]
          value = match[2] || match[3] || match[4] || null

          const height = /^(\d+)h$/.exec(name)
          if (height && !value) {
            parameters.height = height[1]
          } else {
            parameters[name] = value
          }
        }
      }
    }

    let token
    if (renderers[langType]) {
      token = state.push(`${langType}_fence`, 'div', 0)
    } else {
      token = state.push('_fence', 'code', 0)
    }

    token.langType = langType
    token.fileName = fileName
    token.firstLineNumber = firstLineNumber
    token.parameters = parameters

    token.content = state.getLines(startLine + 1, nextLine, len, true)
    token.markup = markup
    token.map = [startLine, state.line]

    return true
  }

  md.block.ruler.before('fence', '_fence', fence, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  })

  for (const name in renderers) {
    md.renderer.rules[`${name}_fence`] = (tokens, index) =>
      renderers[name](tokens[index])
  }

  if (defaultRenderer) {
    md.renderer.rules['_fence'] = (tokens, index) =>
      defaultRenderer(tokens[index])
  }
}
