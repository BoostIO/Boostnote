import PropTypes from 'prop-types'
import React from 'react'
import markdown from 'browser/lib/markdown'
import _ from 'lodash'
import CodeMirror from 'codemirror'
import 'codemirror-mode-elixir'
import consts from 'browser/lib/consts'
import Raphael from 'raphael'
import flowchart from 'flowchart'
import SequenceDiagram from 'js-sequence-diagrams'
import eventEmitter from 'browser/main/lib/eventEmitter'
import htmlTextHelper from 'browser/lib/htmlTextHelper'
import copy from 'copy-to-clipboard'
import mdurl from 'mdurl'
import exportNote from 'browser/main/lib/dataApi/exportNote'

const { remote } = require('electron')
const { app } = remote
const path = require('path')
const dialog = remote.dialog

const markdownStyle = require('!!css!stylus?sourceMap!./markdown.styl')[0][1]
const appPath = 'file://' + (process.env.NODE_ENV === 'production'
  ? app.getAppPath()
  : path.resolve())
const CSS_FILES = [
  `${appPath}/node_modules/katex/dist/katex.min.css`,
  `${appPath}/node_modules/codemirror/lib/codemirror.css`
]

function buildStyle (fontFamily, fontSize, codeBlockFontFamily, lineNumber, scrollPastEnd) {
  return `
@font-face {
  font-family: 'Lato';
  src: url('${appPath}/resources/fonts/Lato-Regular.woff2') format('woff2'), /* Modern Browsers */
       url('${appPath}/resources/fonts/Lato-Regular.woff') format('woff'), /* Modern Browsers */
       url('${appPath}/resources/fonts/Lato-Regular.ttf') format('truetype');
  font-style: normal;
  font-weight: normal;
  text-rendering: optimizeLegibility;
}
@font-face {
  font-family: 'Lato';
  src: url('${appPath}/resources/fonts/Lato-Black.woff2') format('woff2'), /* Modern Browsers */
       url('${appPath}/resources/fonts/Lato-Black.woff') format('woff'), /* Modern Browsers */
       url('${appPath}/resources/fonts/Lato-Black.ttf') format('truetype');
  font-style: normal;
  font-weight: 700;
  text-rendering: optimizeLegibility;
}
${markdownStyle}
body {
  font-family: '${fontFamily.join("','")}';
  font-size: ${fontSize}px;
  ${scrollPastEnd && 'padding-bottom: 90vh;'}
}
code {
  font-family: '${codeBlockFontFamily.join("','")}';
  background-color: rgba(0,0,0,0.04);
}
.lineNumber {
  ${lineNumber && 'display: block !important;'}
  font-family: '${codeBlockFontFamily.join("','")}';
}

.clipboardButton {
  color: rgba(147,147,149,0.8);;
  fill: rgba(147,147,149,1);;
  border-radius: 50%;
  margin: 0px 10px;
  border: none;
  background-color: transparent;
  outline: none;
  height: 15px;
  width: 15px;
  cursor: pointer;
}

.clipboardButton:hover {
  transition: 0.2s;
  color: #939395;
  fill: #939395;
  background-color: rgba(0,0,0,0.1);
}

h1, h2 {
  border: none;
}

h1 {
  padding-bottom: 4px;
  margin: 1em 0 8px;
}

h2 {
  padding-bottom: 0.2em;
  margin: 1em 0 0.37em;
}

body p {
  white-space: normal;
}
`
}

const { shell } = require('electron')
const OSX = global.process.platform === 'darwin'

const defaultFontFamily = ['helvetica', 'arial', 'sans-serif']
if (!OSX) {
  defaultFontFamily.unshift('Microsoft YaHei')
  defaultFontFamily.unshift('meiryo')
}
const defaultCodeBlockFontFamily = ['Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', 'monospace']

export default class MarkdownPreview extends React.Component {
  constructor (props) {
    super(props)

    this.contextMenuHandler = (e) => this.handleContextMenu(e)
    this.mouseDownHandler = (e) => this.handleMouseDown(e)
    this.mouseUpHandler = (e) => this.handleMouseUp(e)
    this.DoubleClickHandler = (e) => this.handleDoubleClick(e)
    this.scrollHandler = _.debounce(this.handleScroll.bind(this), 100, {leading: false, trailing: true})
    this.anchorClickHandler = (e) => this.handlePreviewAnchorClick(e)
    this.checkboxClickHandler = (e) => this.handleCheckboxClick(e)
    this.saveAsTextHandler = () => this.handleSaveAsText()
    this.saveAsMdHandler = () => this.handleSaveAsMd()
    this.saveAsHtmlHandler = () => this.handleSaveAsHtml()
    this.printHandler = () => this.handlePrint()

    this.linkClickHandler = this.handlelinkClick.bind(this)
  }

  handlePreviewAnchorClick (e) {
    e.preventDefault()
    e.stopPropagation()

    const anchor = e.target.closest('a')
    const href = anchor.getAttribute('href')
    if (_.isString(href) && href.match(/^#/)) {
      const targetElement = this.refs.root.contentWindow.document.getElementById(href.substring(1, href.length))
      if (targetElement != null) {
        this.getWindow().scrollTo(0, targetElement.offsetTop)
      }
    } else {
      shell.openExternal(href)
    }
  }

  handleCheckboxClick (e) {
    this.props.onCheckboxClick(e)
  }

  handleScroll (e) {
    if (this.props.onScroll) {
      this.props.onScroll(e)
    }
  }

  handleContextMenu (e) {
    this.props.onContextMenu(e)
  }

  handleDoubleClick (e) {
    if (this.props.onDoubleClick != null) this.props.onDoubleClick(e)
  }

  handleMouseDown (e) {
    if (e.target != null) {
      switch (e.target.tagName) {
        case 'A':
        case 'INPUT':
          return null
      }
    }
    if (this.props.onMouseDown != null) this.props.onMouseDown(e)
  }

  handleMouseUp (e) {
    if (!this.props.onMouseUp) return
    if (e.target != null && e.target.tagName === 'A') {
      return null
    }
    if (this.props.onMouseUp != null) this.props.onMouseUp(e)
  }

  handleSaveAsText () {
    this.exportAsDocument('txt')
  }

  handleSaveAsMd () {
    this.exportAsDocument('md')
  }

  handleSaveAsHtml () {
    this.exportAsDocument('html', (noteContent, exportTasks) => {
      const {fontFamily, fontSize, codeBlockFontFamily, lineNumber, codeBlockTheme} = this.getStyleParams()

      const inlineStyles = buildStyle(fontFamily, fontSize, codeBlockFontFamily, lineNumber, codeBlockTheme, lineNumber)
      const body = markdown.render(noteContent)
      const files = [this.GetCodeThemeLink(codeBlockTheme), ...CSS_FILES]

      files.forEach((file) => {
        file = file.replace('file://', '')
        exportTasks.push({
          src: file,
          dst: 'css'
        })
      })

      let styles = ''
      files.forEach((file) => {
        styles += `<link rel="stylesheet" href="css/${path.basename(file)}">`
      })

      return `<html>
                 <head>
                   <style id="style">${inlineStyles}</style>
                   ${styles}
                 </head>
                 <body>${body}</body>
              </html>`
    })
  }

  handlePrint () {
    this.refs.root.contentWindow.print()
  }

  exportAsDocument (fileType, contentFormatter) {
    const options = {
      filters: [
        {name: 'Documents', extensions: [fileType]}
      ],
      properties: ['openFile', 'createDirectory']
    }

    dialog.showSaveDialog(remote.getCurrentWindow(), options,
        (filename) => {
          if (filename) {
            const content = this.props.value
            const storage = this.props.storagePath

            exportNote(storage, content, filename, contentFormatter)
                .then((res) => {
                  dialog.showMessageBox(remote.getCurrentWindow(), {type: 'info', message: `Exported to ${filename}`})
                }).catch((err) => {
                  dialog.showErrorBox('Export error', err ? err.message || err : 'Unexpected error during export')
                  throw err
                })
          }
        })
  }

  fixDecodedURI (node) {
    if (node && node.children.length === 1 && typeof node.children[0] === 'string') {
      const { innerText, href } = node

      node.innerText = mdurl.decode(href) === innerText
        ? href
        : innerText
    }
  }

  componentDidMount () {
    this.refs.root.setAttribute('sandbox', 'allow-scripts')
    this.refs.root.contentWindow.document.body.addEventListener('contextmenu', this.contextMenuHandler)

    let styles = `
      <style id='style'></style>
      <link rel="stylesheet" id="codeTheme">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    `

    CSS_FILES.forEach((file) => {
      styles += `<link rel="stylesheet" href="${file}">`
    })

    this.refs.root.contentWindow.document.head.innerHTML = styles
    this.rewriteIframe()
    this.applyStyle()

    this.refs.root.contentWindow.document.addEventListener('mousedown', this.mouseDownHandler)
    this.refs.root.contentWindow.document.addEventListener('mouseup', this.mouseUpHandler)
    this.refs.root.contentWindow.document.addEventListener('dblclick', this.DoubleClickHandler)
    this.refs.root.contentWindow.document.addEventListener('drop', this.preventImageDroppedHandler)
    this.refs.root.contentWindow.document.addEventListener('dragover', this.preventImageDroppedHandler)
    this.refs.root.contentWindow.document.addEventListener('scroll', this.scrollHandler)
    eventEmitter.on('export:save-text', this.saveAsTextHandler)
    eventEmitter.on('export:save-md', this.saveAsMdHandler)
    eventEmitter.on('export:save-html', this.saveAsHtmlHandler)
    eventEmitter.on('print', this.printHandler)
  }

  componentWillUnmount () {
    this.refs.root.contentWindow.document.body.removeEventListener('contextmenu', this.contextMenuHandler)
    this.refs.root.contentWindow.document.removeEventListener('mousedown', this.mouseDownHandler)
    this.refs.root.contentWindow.document.removeEventListener('mouseup', this.mouseUpHandler)
    this.refs.root.contentWindow.document.removeEventListener('dblclick', this.DoubleClickHandler)
    this.refs.root.contentWindow.document.removeEventListener('drop', this.preventImageDroppedHandler)
    this.refs.root.contentWindow.document.removeEventListener('dragover', this.preventImageDroppedHandler)
    this.refs.root.contentWindow.document.removeEventListener('scroll', this.scrollHandler)
    eventEmitter.off('export:save-text', this.saveAsTextHandler)
    eventEmitter.off('export:save-md', this.saveAsMdHandler)
    eventEmitter.off('export:save-html', this.saveAsHtmlHandler)
    eventEmitter.off('print', this.printHandler)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.value !== this.props.value) this.rewriteIframe()
    if (prevProps.fontFamily !== this.props.fontFamily ||
      prevProps.fontSize !== this.props.fontSize ||
      prevProps.codeBlockFontFamily !== this.props.codeBlockFontFamily ||
      prevProps.codeBlockTheme !== this.props.codeBlockTheme ||
      prevProps.lineNumber !== this.props.lineNumber ||
      prevProps.showCopyNotification !== this.props.showCopyNotification ||
      prevProps.theme !== this.props.theme ||
      prevProps.scrollPastEnd !== this.props.scrollPastEnd) {
      this.applyStyle()
      this.rewriteIframe()
    }
  }

  getStyleParams () {
    const { fontSize, lineNumber, codeBlockTheme, scrollPastEnd } = this.props
    let { fontFamily, codeBlockFontFamily } = this.props
    fontFamily = _.isString(fontFamily) && fontFamily.trim().length > 0
        ? fontFamily.split(',').map(fontName => fontName.trim()).concat(defaultFontFamily)
        : defaultFontFamily
    codeBlockFontFamily = _.isString(codeBlockFontFamily) && codeBlockFontFamily.trim().length > 0
        ? codeBlockFontFamily.split(',').map(fontName => fontName.trim()).concat(defaultCodeBlockFontFamily)
        : defaultCodeBlockFontFamily

    return {fontFamily, fontSize, codeBlockFontFamily, lineNumber, codeBlockTheme, scrollPastEnd}
  }

  applyStyle () {
    const {fontFamily, fontSize, codeBlockFontFamily, lineNumber, codeBlockTheme, scrollPastEnd} = this.getStyleParams()

    this.getWindow().document.getElementById('codeTheme').href = this.GetCodeThemeLink(codeBlockTheme)
    this.getWindow().document.getElementById('style').innerHTML = buildStyle(fontFamily, fontSize, codeBlockFontFamily, lineNumber, scrollPastEnd)
  }

  GetCodeThemeLink (theme) {
    theme = consts.THEMES.some((_theme) => _theme === theme) && theme !== 'default'
      ? theme
      : 'elegant'
    return theme.startsWith('solarized')
      ? `${appPath}/node_modules/codemirror/theme/solarized.css`
      : `${appPath}/node_modules/codemirror/theme/${theme}.css`
  }

  rewriteIframe () {
    _.forEach(this.refs.root.contentWindow.document.querySelectorAll('a'), (el) => {
      el.removeEventListener('click', this.anchorClickHandler)
    })
    _.forEach(this.refs.root.contentWindow.document.querySelectorAll('input[type="checkbox"]'), (el) => {
      el.removeEventListener('click', this.checkboxClickHandler)
    })

    _.forEach(this.refs.root.contentWindow.document.querySelectorAll('a'), (el) => {
      el.removeEventListener('click', this.linkClickHandler)
    })

    const { theme, indentSize, showCopyNotification, storagePath } = this.props
    let { value, codeBlockTheme } = this.props

    this.refs.root.contentWindow.document.body.setAttribute('data-theme', theme)

    const codeBlocks = value.match(/(```)(.|[\n])*?(```)/g)
    if (codeBlocks !== null) {
      codeBlocks.forEach((codeBlock) => {
        value = value.replace(codeBlock, htmlTextHelper.encodeEntities(codeBlock))
      })
    }
    this.refs.root.contentWindow.document.body.innerHTML = markdown.render(value)

    _.forEach(this.refs.root.contentWindow.document.querySelectorAll('a'), (el) => {
      this.fixDecodedURI(el)
      el.addEventListener('click', this.anchorClickHandler)
    })

    _.forEach(this.refs.root.contentWindow.document.querySelectorAll('input[type="checkbox"]'), (el) => {
      el.addEventListener('click', this.checkboxClickHandler)
    })

    _.forEach(this.refs.root.contentWindow.document.querySelectorAll('a'), (el) => {
      el.addEventListener('click', this.linkClickHandler)
    })

    _.forEach(this.refs.root.contentWindow.document.querySelectorAll('img'), (el) => {
      el.src = markdown.normalizeLinkText(el.src)
      if (!/\/:storage/.test(el.src)) return
      el.src = `file:///${markdown.normalizeLinkText(path.join(storagePath, 'images', path.basename(el.src)))}`
    })

    codeBlockTheme = consts.THEMES.some((_theme) => _theme === codeBlockTheme)
      ? codeBlockTheme
      : 'default'

    _.forEach(this.refs.root.contentWindow.document.querySelectorAll('.code code'), (el) => {
      let syntax = CodeMirror.findModeByName(el.className)
      if (syntax == null) syntax = CodeMirror.findModeByName('Plain Text')
      CodeMirror.requireMode(syntax.mode, () => {
        const content = htmlTextHelper.decodeEntities(el.innerHTML)
        const copyIcon = document.createElement('i')
        copyIcon.innerHTML = '<button class="clipboardButton"><svg width="13" height="13" viewBox="0 0 1792 1792" ><path d="M768 1664h896v-640h-416q-40 0-68-28t-28-68v-416h-384v1152zm256-1440v-64q0-13-9.5-22.5t-22.5-9.5h-704q-13 0-22.5 9.5t-9.5 22.5v64q0 13 9.5 22.5t22.5 9.5h704q13 0 22.5-9.5t9.5-22.5zm256 672h299l-299-299v299zm512 128v672q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-160h-544q-40 0-68-28t-28-68v-1344q0-40 28-68t68-28h1088q40 0 68 28t28 68v328q21 13 36 28l408 408q28 28 48 76t20 88z"/></svg></button>'
        copyIcon.onclick = (e) => {
          copy(content)
          if (showCopyNotification) {
            this.notify('Saved to Clipboard!', {
              body: 'Paste it wherever you want!',
              silent: true
            })
          }
        }
        el.parentNode.appendChild(copyIcon)
        el.innerHTML = ''
        if (codeBlockTheme.indexOf('solarized') === 0) {
          const [refThema, color] = codeBlockTheme.split(' ')
          el.parentNode.className += ` cm-s-${refThema} cm-s-${color} CodeMirror`
        } else {
          el.parentNode.className += ` cm-s-${codeBlockTheme} CodeMirror`
        }
        CodeMirror.runMode(content, syntax.mime, el, {
          tabSize: indentSize
        })
      })
    })
    const opts = {}
    // if (this.props.theme === 'dark') {
    //   opts['font-color'] = '#DDD'
    //   opts['line-color'] = '#DDD'
    //   opts['element-color'] = '#DDD'
    //   opts['fill'] = '#3A404C'
    // }
    _.forEach(this.refs.root.contentWindow.document.querySelectorAll('.flowchart'), (el) => {
      Raphael.setWindow(this.getWindow())
      try {
        const diagram = flowchart.parse(htmlTextHelper.decodeEntities(el.innerHTML))
        el.innerHTML = ''
        diagram.drawSVG(el, opts)
        _.forEach(el.querySelectorAll('a'), (el) => {
          el.addEventListener('click', this.anchorClickHandler)
        })
      } catch (e) {
        console.error(e)
        el.className = 'flowchart-error'
        el.innerHTML = 'Flowchart parse error: ' + e.message
      }
    })

    _.forEach(this.refs.root.contentWindow.document.querySelectorAll('.sequence'), (el) => {
      Raphael.setWindow(this.getWindow())
      try {
        const diagram = SequenceDiagram.parse(htmlTextHelper.decodeEntities(el.innerHTML))
        el.innerHTML = ''
        diagram.drawSVG(el, {theme: 'simple'})
        _.forEach(el.querySelectorAll('a'), (el) => {
          el.addEventListener('click', this.anchorClickHandler)
        })
      } catch (e) {
        console.error(e)
        el.className = 'sequence-error'
        el.innerHTML = 'Sequence diagram parse error: ' + e.message
      }
    })
  }

  focus () {
    this.refs.root.focus()
  }

  getWindow () {
    return this.refs.root.contentWindow
  }

  scrollTo (targetRow) {
    const blocks = this.getWindow().document.querySelectorAll('body>[data-line]')

    for (let index = 0; index < blocks.length; index++) {
      let block = blocks[index]
      const row = parseInt(block.getAttribute('data-line'))
      if (row > targetRow || index === blocks.length - 1) {
        block = blocks[index - 1]
        block != null && this.getWindow().scrollTo(0, block.offsetTop)
        break
      }
    }
  }

  preventImageDroppedHandler (e) {
    e.preventDefault()
    e.stopPropagation()
  }

  notify (title, options) {
    if (global.process.platform === 'win32') {
      options.icon = path.join('file://', global.__dirname, '../../resources/app.png')
    }
    return new window.Notification(title, options)
  }

  handlelinkClick (e) {
    const noteHash = e.target.href.split('/').pop()
    const regexIsNoteLink = /^(.{20})-(.{20})$/
    if (regexIsNoteLink.test(noteHash)) {
      eventEmitter.emit('list:jump', noteHash)
    }
  }

  render () {
    const { className, style, tabIndex } = this.props
    return (
      <iframe className={className != null
          ? 'MarkdownPreview ' + className
          : 'MarkdownPreview'
        }
        style={style}
        tabIndex={tabIndex}
        ref='root'
      />
    )
  }
}

MarkdownPreview.propTypes = {
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onMouseUp: PropTypes.func,
  onMouseDown: PropTypes.func,
  className: PropTypes.string,
  value: PropTypes.string,
  showCopyNotification: PropTypes.bool,
  storagePath: PropTypes.string
}
