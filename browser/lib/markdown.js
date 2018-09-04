import markdownit from 'markdown-it'
import sanitize from './markdown-it-sanitize-html'
import emoji from 'markdown-it-emoji'
import math from '@rokt33r/markdown-it-math'
import smartArrows from 'markdown-it-smartarrows'
import _ from 'lodash'
import ConfigManager from 'browser/main/lib/ConfigManager'
import katex from 'katex'
import { lastFindInArray } from './utils'

function createGutter (str, firstLineNumber) {
  if (Number.isNaN(firstLineNumber)) firstLineNumber = 1
  const lastLineNumber = (str.match(/\n/g) || []).length + firstLineNumber - 1
  const lines = []
  for (let i = firstLineNumber; i <= lastLineNumber; i++) {
    lines.push('<span class="CodeMirror-linenumber">' + i + '</span>')
  }
  return '<span class="lineNumber CodeMirror-gutters">' + lines.join('') + '</span>'
}

class Markdown {
  constructor (options = {}) {
    const config = ConfigManager.get()
    const defaultOptions = {
      typographer: config.preview.smartQuotes,
      linkify: true,
      html: true,
      xhtmlOut: true,
      breaks: config.preview.breaks,
      highlight: function (str, lang) {
        const delimiter = ':'
        const langInfo = lang.split(delimiter)
        const langType = langInfo[0]
        const fileName = langInfo[1] || ''
        const firstLineNumber = parseInt(langInfo[2], 10)

        if (langType === 'flowchart') {
          return `<pre class="flowchart">${str}</pre>`
        }
        if (langType === 'sequence') {
          return `<pre class="sequence">${str}</pre>`
        }
        if (langType === 'chart') {
          return `<pre class="chart">${str}</pre>`
        }
        if (langType === 'mermaid') {
          return `<pre class="mermaid" data-height="${fileName}">${str}</pre>`
        }
        return '<pre class="code CodeMirror">' +
          '<span class="filename">' + fileName + '</span>' +
          createGutter(str, firstLineNumber) +
          '<code class="' + langType + '">' +
          str +
          '</code></pre>'
      },
      sanitize: 'STRICT'
    }

    const updatedOptions = Object.assign(defaultOptions, options)
    this.md = markdownit(updatedOptions)

    if (updatedOptions.sanitize !== 'NONE') {
      const allowedTags = ['iframe', 'input', 'b',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'br', 'b', 'i', 'strong', 'em', 'a', 'pre', 'code', 'img', 'tt',
        'div', 'ins', 'del', 'sup', 'sub', 'p', 'ol', 'ul', 'table', 'thead', 'tbody', 'tfoot', 'blockquote',
        'dl', 'dt', 'dd', 'kbd', 'q', 'samp', 'var', 'hr', 'ruby', 'rt', 'rp', 'li', 'tr', 'td', 'th', 's', 'strike', 'summary', 'details'
      ]
      const allowedAttributes = [
        'abbr', 'accept', 'accept-charset',
        'accesskey', 'action', 'align', 'alt', 'axis',
        'border', 'cellpadding', 'cellspacing', 'char',
        'charoff', 'charset', 'checked',
        'clear', 'cols', 'colspan', 'color',
        'compact', 'coords', 'datetime', 'dir',
        'disabled', 'enctype', 'for', 'frame',
        'headers', 'height', 'hreflang',
        'hspace', 'ismap', 'label', 'lang',
        'maxlength', 'media', 'method',
        'multiple', 'name', 'nohref', 'noshade',
        'nowrap', 'open', 'prompt', 'readonly', 'rel', 'rev',
        'rows', 'rowspan', 'rules', 'scope',
        'selected', 'shape', 'size', 'span',
        'start', 'summary', 'tabindex', 'target',
        'title', 'type', 'usemap', 'valign', 'value',
        'vspace', 'width', 'itemprop'
      ]

      if (updatedOptions.sanitize === 'ALLOW_STYLES') {
        allowedTags.push('style')
        allowedAttributes.push('style')
      }

      // Sanitize use rinput before other plugins
      this.md.use(sanitize, {
        allowedTags,
        allowedAttributes: {
          '*': allowedAttributes,
          'a': ['href'],
          'div': ['itemscope', 'itemtype'],
          'blockquote': ['cite'],
          'del': ['cite'],
          'ins': ['cite'],
          'q': ['cite'],
          'img': ['src', 'width', 'height'],
          'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
          'input': ['type', 'id', 'checked']
        },
        allowedIframeHostnames: ['www.youtube.com']
      })
    }

    this.md.use(emoji, {
      shortcuts: {}
    })
    this.md.use(math, {
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
          output = katex.renderToString(str.trim(), { displayMode: true })
        } catch (err) {
          output = `<div class="katex-error">${err.message}</div>`
        }
        return output
      }
    })
    this.md.use(require('markdown-it-imsize'))
    this.md.use(require('markdown-it-footnote'))
    this.md.use(require('markdown-it-multimd-table'))
    this.md.use(require('markdown-it-named-headers'), {
      slugify: (header) => {
        return encodeURI(header.trim()
          .replace(/[\]\[\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~]/g, '')
          .replace(/\s+/g, '-'))
          .replace(/\-+$/, '')
      }
    })
    this.md.use(require('markdown-it-kbd'))
    this.md.use(require('markdown-it-admonition'))

    const deflate = require('markdown-it-plantuml/lib/deflate')
    this.md.use(require('markdown-it-plantuml'), '', {
      generateSource: function (umlCode) {
        const stripTrailingSlash = (url) => url.endsWith('/') ? url.slice(0, -1) : url
        const serverAddress = stripTrailingSlash(config.preview.plantUMLServerAddress) + '/svg'
        const s = unescape(encodeURIComponent(umlCode))
        const zippedCode = deflate.encode64(
          deflate.zip_deflate(`@startuml\n${s}\n@enduml`, 9)
        )
        return `${serverAddress}/${zippedCode}`
      }
    })

    // Ditaa support
    this.md.use(require('markdown-it-plantuml'), {
      openMarker: '@startditaa',
      closeMarker: '@endditaa',
      generateSource: function (umlCode) {
        const stripTrailingSlash = (url) => url.endsWith('/') ? url.slice(0, -1) : url
        // Currently PlantUML server doesn't support Ditaa in SVG, so we set the format as PNG at the moment.
        const serverAddress = stripTrailingSlash(config.preview.plantUMLServerAddress) + '/png'
        const s = unescape(encodeURIComponent(umlCode))
        const zippedCode = deflate.encode64(
          deflate.zip_deflate(`@startditaa\n${s}\n@endditaa`, 9)
        )
        return `${serverAddress}/${zippedCode}`
      }
    })

    // Override task item
    this.md.block.ruler.at('paragraph', function (state, startLine/*, endLine */) {
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
      token.map = [startLine, state.line]

      if (state.parentType === 'list') {
        const match = content.match(/^\[( |x)\] ?(.+)/i)
        if (match) {
          const liToken = lastFindInArray(state.tokens, token => token.type === 'list_item_open')
          if (liToken) {
            if (!liToken.attrs) {
              liToken.attrs = []
            }
            liToken.attrs.push(['class', 'taskListItem'])
          }
          content = `<label class='taskListItem${match[1] !== ' ' ? ' checked' : ''}' for='checkbox-${startLine + 1}'><input type='checkbox'${match[1] !== ' ' ? ' checked' : ''} id='checkbox-${startLine + 1}'/> ${content.substring(4, content.length)}</label>`
        }
      }

      token = state.push('inline', '', 0)
      token.content = content
      token.map = [startLine, state.line]
      token.children = []

      token = state.push('paragraph_close', 'p', -1)

      return true
    })

    if (config.preview.smartArrows) {
      this.md.use(smartArrows)
    }

    // Add line number attribute for scrolling
    const originalRender = this.md.renderer.render
    this.md.renderer.render = (tokens, options, env) => {
      tokens.forEach((token) => {
        switch (token.type) {
          case 'heading_open':
          case 'paragraph_open':
          case 'blockquote_open':
          case 'table_open':
            token.attrPush(['data-line', token.map[0]])
        }
      })
      const result = originalRender.call(this.md.renderer, tokens, options, env)
      return result
    }
    // FIXME We should not depend on global variable.
    window.md = this.md
  }

  render (content) {
    if (!_.isString(content)) content = ''
    return this.md.render(content)
  }
}

export default Markdown
