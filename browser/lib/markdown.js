import markdownit from 'markdown-it'
import emoji from 'markdown-it-emoji'
import math from '@rokt33r/markdown-it-math'
import _ from 'lodash'
import ConfigManager from 'browser/main/lib/ConfigManager'

// FIXME We should not depend on global variable.
const katex = window.katex
const config = ConfigManager.get()

function createGutter (str) {
  const lc = (str.match(/\n/g) || []).length
  const lines = []
  for (let i = 1; i <= lc; i++) {
    lines.push('<span class="CodeMirror-linenumber">' + i + '</span>')
  }
  return '<span class="lineNumber CodeMirror-gutters">' + lines.join('') + '</span>'
}

var md = markdownit({
  typographer: true,
  linkify: true,
  html: true,
  xhtmlOut: true,
  breaks: true,
  highlight: function (str, lang) {
    if (lang === 'flowchart') {
      return `<pre class="flowchart">${str}</pre>`
    }
    if (lang === 'sequence') {
      return `<pre class="sequence">${str}</pre>`
    }
    return '<pre class="code">' +
    createGutter(str) +
    '<code class="' + lang + '">' +
    str +
    '</code></pre>'
  }
})
md.use(emoji, {
  shortcuts: {}
})
md.use(math, {
  inlineOpen: config.preview.latexInlineOpen,
  inlineClose: config.preview.latexInlineClose,
  blockOpen: config.preview.latexBlockOpen,
  blockClose: config.preview.latexBlockClose,
  inlineRenderer: function (str) {
    let output = ''
    try {
      output = katex.renderToString(str.trim())
    } catch (err) {
      output = `<span class="katex-error">${err.message}</span>`
    }
    return output
  },
  blockRenderer: function (str) {
    let output = ''
    try {
      output = katex.renderToString(str.trim(), {displayMode: true})
    } catch (err) {
      output = `<div class="katex-error">${err.message}</div>`
    }
    return output
  }
})
md.use(require('markdown-it-imsize'))
md.use(require('markdown-it-footnote'))
md.use(require('markdown-it-multimd-table'))
md.use(require('markdown-it-named-headers'), {
  slugify: (header) => {
    return encodeURI(header.trim()
      .replace(/[\]\[\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~]/g, '')
      .replace(/\s+/g, '-'))
      .replace(/\-+$/, '')
  }
})
md.use(require('markdown-it-kbd'))
md.use(require('markdown-it-plantuml'))

// Override task item
md.block.ruler.at('paragraph', function (state, startLine/*, endLine */) {
  let content, terminate, i, l, token
  let nextLine = startLine + 1
  const terminatorRules = state.md.block.ruler.getRules('paragraph')
  const endLine = state.lineMax

  // jump line-by-line until empty one or EOF
  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    // this would be a code block normally, but after paragraph
    // it's considered a lazy continuation regardless of what's there
    if (state.sCount[nextLine] - state.blkIndent > 3) { continue }

    // quirk for blockquotes, this line should already be checked by that rule
    if (state.sCount[nextLine] < 0) { continue }

    // Some tags can terminate paragraph without empty line.
    terminate = false
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true
        break
      }
    }
    if (terminate) { break }
  }

  content = state.getLines(startLine, nextLine, state.blkIndent, false).trim()

  state.line = nextLine

  token = state.push('paragraph_open', 'p', 1)
  token.map = [ startLine, state.line ]

  if (state.parentType === 'list') {
    const match = content.match(/^\[( |x)\] ?(.+)/i)
    if (match) {
      content = `<input type='checkbox'${match[1] !== ' ' ? ' checked' : ''} id='checkbox-${startLine + 1}'/> <label class='taskListItem' for='checkbox-${startLine + 1}'> ${content.substring(4, content.length)} </label>`
    }
  }

  token = state.push('inline', '', 0)
  token.content = content
  token.map = [ startLine, state.line ]
  token.children = []

  token = state.push('paragraph_close', 'p', -1)

  return true
})

// Add line number attribute for scrolling
const originalRender = md.renderer.render
md.renderer.render = function render (tokens, options, env) {
  tokens.forEach((token) => {
    switch (token.type) {
      case 'heading_open':
      case 'paragraph_open':
      case 'blockquote_open':
      case 'table_open':
        token.attrPush(['data-line', token.map[0]])
    }
  })
  const result = originalRender.call(md.renderer, tokens, options, env)
  return result
}
// FIXME We should not depend on global variable.
window.md = md

function normalizeLinkText (linkText) {
  return md.normalizeLinkText(linkText)
}

const markdown = {
  render: function markdown (content) {
    if (!_.isString(content)) content = ''
    const renderedContent = md.render(content)
    return renderedContent
  },
  normalizeLinkText
}

export default markdown
