import PropTypes from 'prop-types'
import React from 'react'
import Markdown from 'browser/lib/markdown'
import _ from 'lodash'
import CodeMirror from 'codemirror'
import 'codemirror-mode-elixir'
import consts from 'browser/lib/consts'
import Raphael from 'raphael'
import flowchart from 'flowchart'
import mermaidRender from './render/MermaidRender'
import SequenceDiagram from 'js-sequence-diagrams'
import Chart from 'chart.js'
import eventEmitter from 'browser/main/lib/eventEmitter'
import htmlTextHelper from 'browser/lib/htmlTextHelper'
import convertModeName from 'browser/lib/convertModeName'
import copy from 'copy-to-clipboard'
import mdurl from 'mdurl'
import exportNote from 'browser/main/lib/dataApi/exportNote'
import { escapeHtmlCharacters } from 'browser/lib/utils'
import yaml from 'js-yaml'
import context from 'browser/lib/context'
import i18n from 'browser/lib/i18n'
import fs from 'fs'
import { render } from 'react-dom'
import Carousel from 'react-image-carousel'
import ConfigManager from '../main/lib/ConfigManager'

const { remote, shell } = require('electron')
const attachmentManagement = require('../main/lib/dataApi/attachmentManagement')

const { app } = remote
const path = require('path')
const fileUrl = require('file-url')

const dialog = remote.dialog

const uri2path = require('file-uri-to-path')

const markdownStyle = require('!!css!stylus?sourceMap!./markdown.styl')[0][1]
const appPath = fileUrl(
  process.env.NODE_ENV === 'production' ? app.getAppPath() : path.resolve()
)
const CSS_FILES = [
  `${appPath}/node_modules/katex/dist/katex.min.css`,
  `${appPath}/node_modules/codemirror/lib/codemirror.css`,
  `${appPath}/node_modules/react-image-carousel/lib/css/main.min.css`
]

function buildStyle (
  fontFamily,
  fontSize,
  codeBlockFontFamily,
  lineNumber,
  scrollPastEnd,
  theme,
  allowCustomCSS,
  customCSS
) {
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
@font-face {
  font-family: 'Material Icons';
  font-style: normal;
  font-weight: 400;
  src: local('Material Icons'),
       local('MaterialIcons-Regular'),
       url('${appPath}/resources/fonts/MaterialIcons-Regular.woff2') format('woff2'),
       url('${appPath}/resources/fonts/MaterialIcons-Regular.woff') format('woff'),
       url('${appPath}/resources/fonts/MaterialIcons-Regular.ttf') format('truetype');
}
${markdownStyle}

body {
  font-family: '${fontFamily.join("','")}';
  font-size: ${fontSize}px;
  ${scrollPastEnd && 'padding-bottom: 90vh;'}
}
@media print {
  body {
    padding-bottom: initial;
  }
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

@media print {
  body[data-theme="${theme}"] {
    color: #000;
    background-color: #fff;
  }
  .clipboardButton {
    display: none
  }
}

${allowCustomCSS ? customCSS : ''}
`
}

const scrollBarStyle = `
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.15);
}
`
const scrollBarDarkStyle = `
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
}
`

const OSX = global.process.platform === 'darwin'

const defaultFontFamily = ['helvetica', 'arial', 'sans-serif']
if (!OSX) {
  defaultFontFamily.unshift('Microsoft YaHei')
  defaultFontFamily.unshift('meiryo')
}
const defaultCodeBlockFontFamily = [
  'Monaco',
  'Menlo',
  'Ubuntu Mono',
  'Consolas',
  'source-code-pro',
  'monospace'
]
export default class MarkdownPreview extends React.Component {
  constructor (props) {
    super(props)

    this.contextMenuHandler = e => this.handleContextMenu(e)
    this.mouseDownHandler = e => this.handleMouseDown(e)
    this.mouseUpHandler = e => this.handleMouseUp(e)
    this.DoubleClickHandler = e => this.handleDoubleClick(e)
    this.scrollHandler = _.debounce(this.handleScroll.bind(this), 100, {
      leading: false,
      trailing: true
    })
    this.checkboxClickHandler = e => this.handleCheckboxClick(e)
    this.saveAsTextHandler = () => this.handleSaveAsText()
    this.saveAsMdHandler = () => this.handleSaveAsMd()
    this.saveAsHtmlHandler = () => this.handleSaveAsHtml()
    this.printHandler = () => this.handlePrint()

    this.linkClickHandler = this.handleLinkClick.bind(this)
    this.initMarkdown = this.initMarkdown.bind(this)
    this.initMarkdown()
  }

  initMarkdown () {
    const { smartQuotes, sanitize, breaks } = this.props
    this.markdown = new Markdown({
      typographer: smartQuotes,
      sanitize,
      breaks
    })
  }

  handleCheckboxClick (e) {
    this.props.onCheckboxClick(e)
  }

  handleScroll (e) {
    if (this.props.onScroll) {
      this.props.onScroll(e)
    }
  }

  handleContextMenu (event) {
    // If a contextMenu handler was passed to us, use it instead of the self-defined one -> return
    if (_.isFunction(this.props.onContextMenu)) {
      this.props.onContextMenu(event)
      return
    }
    // No contextMenu was passed to us -> execute our own link-opener
    if (event.target.tagName.toLowerCase() === 'a') {
      const href = event.target.href
      const isLocalFile = href.startsWith('file:')
      if (isLocalFile) {
        const absPath = uri2path(href)
        try {
          if (fs.lstatSync(absPath).isFile()) {
            context.popup([
              {
                label: i18n.__('Show in explorer'),
                click: (e) => shell.showItemInFolder(absPath)
              }
            ])
          }
        } catch (e) {
          console.log('Error while evaluating if the file is locally available', e)
        }
      }
    }
  }

  handleDoubleClick (e) {
    if (this.props.onDoubleClick != null) this.props.onDoubleClick(e)
  }

  handleMouseDown (e) {
    const config = ConfigManager.get()
    if (config.editor.switchPreview === 'RIGHTCLICK' && e.buttons === 2 && config.editor.type === 'SPLIT') {
      eventEmitter.emit('topbar:togglemodebutton', 'CODE')
    }
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
      const {
        fontFamily,
        fontSize,
        codeBlockFontFamily,
        lineNumber,
        codeBlockTheme,
        scrollPastEnd,
        theme,
        allowCustomCSS,
        customCSS
      } = this.getStyleParams()

      const inlineStyles = buildStyle(
        fontFamily,
        fontSize,
        codeBlockFontFamily,
        lineNumber,
        scrollPastEnd,
        theme,
        allowCustomCSS,
        customCSS
      )
      const body = this.markdown.render(noteContent)
      const files = [this.GetCodeThemeLink(codeBlockTheme), ...CSS_FILES]
      files.forEach(file => {
        if (global.process.platform === 'win32') {
          file = file.replace('file:///', '')
        } else {
          file = file.replace('file://', '')
        }
        exportTasks.push({
          src: file,
          dst: 'css'
        })
      })

      let styles = ''
      files.forEach(file => {
        styles += `<link rel="stylesheet" href="css/${path.basename(file)}">`
      })

      return `<html>
                 <head>
                   <meta charset="UTF-8">
                   <meta name = "viewport" content = "width = device-width, initial-scale = 1, maximum-scale = 1">
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
      filters: [{ name: 'Documents', extensions: [fileType] }],
      properties: ['openFile', 'createDirectory']
    }

    dialog.showSaveDialog(remote.getCurrentWindow(), options, filename => {
      if (filename) {
        const content = this.props.value
        const storage = this.props.storagePath
        const nodeKey = this.props.noteKey

        exportNote(nodeKey, storage, content, filename, contentFormatter)
          .then(res => {
            dialog.showMessageBox(remote.getCurrentWindow(), {
              type: 'info',
              message: `Exported to ${filename}`
            })
          })
          .catch(err => {
            dialog.showErrorBox(
              'Export error',
              err ? err.message || err : 'Unexpected error during export'
            )
            throw err
          })
      }
    })
  }

  fixDecodedURI (node) {
    if (
      node &&
      node.children.length === 1 &&
      typeof node.children[0] === 'string'
    ) {
      const { innerText, href } = node

      node.innerText = mdurl.decode(href) === innerText ? href : innerText
    }
  }

  /**
   * @description Convert special characters between three ```
   * @param {string[]} splitWithCodeTag Array of HTML strings separated by three ```
   * @returns {string} HTML in which special characters between three ``` have been converted
   */
  escapeHtmlCharactersInCodeTag (splitWithCodeTag) {
    for (let index = 0; index < splitWithCodeTag.length; index++) {
      const codeTagRequired = (splitWithCodeTag[index] !== '\`\`\`' && index < splitWithCodeTag.length - 1)
      if (codeTagRequired) {
        splitWithCodeTag.splice((index + 1), 0, '\`\`\`')
      }
    }
    let inCodeTag = false
    let result = ''
    for (let content of splitWithCodeTag) {
      if (content === '\`\`\`') {
        inCodeTag = !inCodeTag
      } else if (inCodeTag) {
        content = escapeHtmlCharacters(content)
      }
      result += content
    }
    return result
  }

  getScrollBarStyle () {
    const { theme } = this.props

    switch (theme) {
      case 'dark':
      case 'solarized-dark':
      case 'monokai':
      case 'dracula':
        return scrollBarDarkStyle
      default:
        return scrollBarStyle
    }
  }

  componentDidMount () {
    const { onDrop } = this.props

    this.refs.root.setAttribute('sandbox', 'allow-scripts')
    this.refs.root.contentWindow.document.body.addEventListener(
      'contextmenu',
      this.contextMenuHandler
    )

    let styles = `
      <style id='style'></style>
      <link rel="stylesheet" id="codeTheme">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>
        ${this.getScrollBarStyle()}
      </style>
    `

    CSS_FILES.forEach(file => {
      styles += `<link rel="stylesheet" href="${file}">`
    })

    this.refs.root.contentWindow.document.head.innerHTML = styles
    this.rewriteIframe()
    this.applyStyle()

    this.refs.root.contentWindow.document.addEventListener(
      'mousedown',
      this.mouseDownHandler
    )
    this.refs.root.contentWindow.document.addEventListener(
      'mouseup',
      this.mouseUpHandler
    )
    this.refs.root.contentWindow.document.addEventListener(
      'dblclick',
      this.DoubleClickHandler
    )
    this.refs.root.contentWindow.document.addEventListener(
      'drop',
      onDrop || this.preventImageDroppedHandler
    )
    this.refs.root.contentWindow.document.addEventListener(
      'dragover',
      this.preventImageDroppedHandler
    )
    this.refs.root.contentWindow.document.addEventListener(
      'scroll',
      this.scrollHandler
    )
    eventEmitter.on('export:save-text', this.saveAsTextHandler)
    eventEmitter.on('export:save-md', this.saveAsMdHandler)
    eventEmitter.on('export:save-html', this.saveAsHtmlHandler)
    eventEmitter.on('print', this.printHandler)
  }

  componentWillUnmount () {
    const { onDrop } = this.props

    this.refs.root.contentWindow.document.body.removeEventListener(
      'contextmenu',
      this.contextMenuHandler
    )
    this.refs.root.contentWindow.document.removeEventListener(
      'mousedown',
      this.mouseDownHandler
    )
    this.refs.root.contentWindow.document.removeEventListener(
      'mouseup',
      this.mouseUpHandler
    )
    this.refs.root.contentWindow.document.removeEventListener(
      'dblclick',
      this.DoubleClickHandler
    )
    this.refs.root.contentWindow.document.removeEventListener(
      'drop',
      onDrop || this.preventImageDroppedHandler
    )
    this.refs.root.contentWindow.document.removeEventListener(
      'dragover',
      this.preventImageDroppedHandler
    )
    this.refs.root.contentWindow.document.removeEventListener(
      'scroll',
      this.scrollHandler
    )
    eventEmitter.off('export:save-text', this.saveAsTextHandler)
    eventEmitter.off('export:save-md', this.saveAsMdHandler)
    eventEmitter.off('export:save-html', this.saveAsHtmlHandler)
    eventEmitter.off('print', this.printHandler)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.value !== this.props.value) this.rewriteIframe()
    if (
      prevProps.smartQuotes !== this.props.smartQuotes ||
      prevProps.sanitize !== this.props.sanitize ||
      prevProps.smartArrows !== this.props.smartArrows ||
      prevProps.breaks !== this.props.breaks ||
      prevProps.lineThroughCheckbox !== this.props.lineThroughCheckbox
    ) {
      this.initMarkdown()
      this.rewriteIframe()
    }
    if (
      prevProps.fontFamily !== this.props.fontFamily ||
      prevProps.fontSize !== this.props.fontSize ||
      prevProps.codeBlockFontFamily !== this.props.codeBlockFontFamily ||
      prevProps.codeBlockTheme !== this.props.codeBlockTheme ||
      prevProps.lineNumber !== this.props.lineNumber ||
      prevProps.showCopyNotification !== this.props.showCopyNotification ||
      prevProps.theme !== this.props.theme ||
      prevProps.scrollPastEnd !== this.props.scrollPastEnd ||
      prevProps.allowCustomCSS !== this.props.allowCustomCSS ||
      prevProps.customCSS !== this.props.customCSS
    ) {
      this.applyStyle()
      this.rewriteIframe()
    }
  }

  getStyleParams () {
    const {
      fontSize,
      lineNumber,
      codeBlockTheme,
      scrollPastEnd,
      theme,
      allowCustomCSS,
      customCSS
    } = this.props
    let { fontFamily, codeBlockFontFamily } = this.props
    fontFamily = _.isString(fontFamily) && fontFamily.trim().length > 0
      ? fontFamily
          .split(',')
          .map(fontName => fontName.trim())
          .concat(defaultFontFamily)
      : defaultFontFamily
    codeBlockFontFamily = _.isString(codeBlockFontFamily) &&
      codeBlockFontFamily.trim().length > 0
      ? codeBlockFontFamily
          .split(',')
          .map(fontName => fontName.trim())
          .concat(defaultCodeBlockFontFamily)
      : defaultCodeBlockFontFamily

    return {
      fontFamily,
      fontSize,
      codeBlockFontFamily,
      lineNumber,
      codeBlockTheme,
      scrollPastEnd,
      theme,
      allowCustomCSS,
      customCSS
    }
  }

  applyStyle () {
    const {
      fontFamily,
      fontSize,
      codeBlockFontFamily,
      lineNumber,
      codeBlockTheme,
      scrollPastEnd,
      theme,
      allowCustomCSS,
      customCSS
    } = this.getStyleParams()

    this.getWindow().document.getElementById(
      'codeTheme'
    ).href = this.GetCodeThemeLink(codeBlockTheme)
    this.getWindow().document.getElementById('style').innerHTML = buildStyle(
      fontFamily,
      fontSize,
      codeBlockFontFamily,
      lineNumber,
      scrollPastEnd,
      theme,
      allowCustomCSS,
      customCSS
    )
  }

  GetCodeThemeLink (theme) {
    theme = consts.THEMES.some(_theme => _theme === theme) &&
      theme !== 'default'
      ? theme
      : 'elegant'
    return theme.startsWith('solarized')
      ? `${appPath}/node_modules/codemirror/theme/solarized.css`
      : `${appPath}/node_modules/codemirror/theme/${theme}.css`
  }

  rewriteIframe () {
    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll(
        'input[type="checkbox"]'
      ),
      el => {
        el.removeEventListener('click', this.checkboxClickHandler)
      }
    )

    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('a'),
      el => {
        el.removeEventListener('click', this.linkClickHandler)
      }
    )

    const {
      theme,
      indentSize,
      showCopyNotification,
      storagePath,
      noteKey,
      sanitize
    } = this.props
    let { value, codeBlockTheme } = this.props

    this.refs.root.contentWindow.document.body.setAttribute('data-theme', theme)
    if (sanitize === 'NONE') {
      const splitWithCodeTag = value.split('```')
      value = this.escapeHtmlCharactersInCodeTag(splitWithCodeTag)
    }
    const renderedHTML = this.markdown.render(value)
    attachmentManagement.migrateAttachments(value, storagePath, noteKey)
    this.refs.root.contentWindow.document.body.innerHTML = attachmentManagement.fixLocalURLS(
      renderedHTML,
      storagePath
    )
    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll(
        'input[type="checkbox"]'
      ),
      el => {
        el.addEventListener('click', this.checkboxClickHandler)
      }
    )

    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('a'),
      el => {
        this.fixDecodedURI(el)
        el.addEventListener('click', this.linkClickHandler)
      }
    )

    codeBlockTheme = consts.THEMES.some(_theme => _theme === codeBlockTheme)
      ? codeBlockTheme
      : 'default'

    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('.code code'),
      el => {
        let syntax = CodeMirror.findModeByName(convertModeName(el.className))
        if (syntax == null) syntax = CodeMirror.findModeByName('Plain Text')
        CodeMirror.requireMode(syntax.mode, () => {
          const content = htmlTextHelper.decodeEntities(el.innerHTML)
          const copyIcon = document.createElement('i')
          copyIcon.innerHTML =
            '<button class="clipboardButton"><svg width="13" height="13" viewBox="0 0 1792 1792" ><path d="M768 1664h896v-640h-416q-40 0-68-28t-28-68v-416h-384v1152zm256-1440v-64q0-13-9.5-22.5t-22.5-9.5h-704q-13 0-22.5 9.5t-9.5 22.5v64q0 13 9.5 22.5t22.5 9.5h704q13 0 22.5-9.5t9.5-22.5zm256 672h299l-299-299v299zm512 128v672q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-160h-544q-40 0-68-28t-28-68v-1344q0-40 28-68t68-28h1088q40 0 68 28t28 68v328q21 13 36 28l408 408q28 28 48 76t20 88z"/></svg></button>'
          copyIcon.onclick = e => {
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
            el.parentNode.className += ` cm-s-${refThema} cm-s-${color}`
          } else {
            el.parentNode.className += ` cm-s-${codeBlockTheme}`
          }
          CodeMirror.runMode(content, syntax.mime, el, {
            tabSize: indentSize
          })
        })
      }
    )
    const opts = {}
    // if (this.props.theme === 'dark') {
    //   opts['font-color'] = '#DDD'
    //   opts['line-color'] = '#DDD'
    //   opts['element-color'] = '#DDD'
    //   opts['fill'] = '#3A404C'
    // }
    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('.flowchart'),
      el => {
        Raphael.setWindow(this.getWindow())
        try {
          const diagram = flowchart.parse(
            htmlTextHelper.decodeEntities(el.innerHTML)
          )
          el.innerHTML = ''
          diagram.drawSVG(el, opts)
          _.forEach(el.querySelectorAll('a'), el => {
            el.addEventListener('click', this.linkClickHandler)
          })
        } catch (e) {
          el.className = 'flowchart-error'
          el.innerHTML = 'Flowchart parse error: ' + e.message
        }
      }
    )

    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('.sequence'),
      el => {
        Raphael.setWindow(this.getWindow())
        try {
          const diagram = SequenceDiagram.parse(
            htmlTextHelper.decodeEntities(el.innerHTML)
          )
          el.innerHTML = ''
          diagram.drawSVG(el, { theme: 'simple' })
          _.forEach(el.querySelectorAll('a'), el => {
            el.addEventListener('click', this.linkClickHandler)
          })
        } catch (e) {
          el.className = 'sequence-error'
          el.innerHTML = 'Sequence diagram parse error: ' + e.message
        }
      }
    )

    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('.chart'),
      el => {
        try {
          const format = el.attributes.getNamedItem('data-format').value
          const chartConfig = format === 'yaml' ? yaml.load(el.innerHTML) : JSON.parse(el.innerHTML)
          el.innerHTML = ''

          const canvas = document.createElement('canvas')
          el.appendChild(canvas)

          const height = el.attributes.getNamedItem('data-height')
          if (height && height.value !== 'undefined') {
            el.style.height = height.value + 'vh'
            canvas.height = height.value + 'vh'
          }

          const chart = new Chart(canvas, chartConfig)
        } catch (e) {
          el.className = 'chart-error'
          el.innerHTML = 'chartjs diagram parse error: ' + e.message
        }
      }
    )
    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('.mermaid'),
      el => {
        mermaidRender(el, htmlTextHelper.decodeEntities(el.innerHTML), theme)
      }
    )

    _.forEach(
      this.refs.root.contentWindow.document.querySelectorAll('.gallery'),
      el => {
        const images = el.innerHTML.split(/\n/g).filter(i => i.length > 0)
        el.innerHTML = ''

        const height = el.attributes.getNamedItem('data-height')
        if (height && height.value !== 'undefined') {
          el.style.height = height.value + 'vh'
        }

        let autoplay = el.attributes.getNamedItem('data-autoplay')
        if (autoplay && autoplay.value !== 'undefined') {
          autoplay = parseInt(autoplay.value, 10) || 0
        } else {
          autoplay = 0
        }

        render(
          <Carousel
            images={images}
            autoplay={autoplay}
          />,
          el
        )
      }
    )

    const markdownPreviewIframe = document.querySelector('.MarkdownPreview')
    const rect = markdownPreviewIframe.getBoundingClientRect()
    const imgList = markdownPreviewIframe.contentWindow.document.body.querySelectorAll('img')
    for (const img of imgList) {
      img.onclick = () => {
        const widthMagnification = document.body.clientWidth / img.width
        const heightMagnification = document.body.clientHeight / img.height
        const baseOnWidth = widthMagnification < heightMagnification
        const magnification = baseOnWidth ? widthMagnification : heightMagnification

        const zoomImgWidth = img.width * magnification
        const zoomImgHeight = img.height * magnification
        const zoomImgTop = (document.body.clientHeight - zoomImgHeight) / 2
        const zoomImgLeft = (document.body.clientWidth - zoomImgWidth) / 2
        const originalImgTop = img.y + rect.top
        const originalImgLeft = img.x + rect.left
        const originalImgRect = {
          top: `${originalImgTop}px`,
          left: `${originalImgLeft}px`,
          width: `${img.width}px`,
          height: `${img.height}px`
        }
        const zoomInImgRect = {
          top: `${baseOnWidth ? zoomImgTop : 0}px`,
          left: `${baseOnWidth ? 0 : zoomImgLeft}px`,
          width: `${zoomImgWidth}px`,
          height: `${zoomImgHeight}px`
        }
        const animationSpeed = 300

        const zoomImg = document.createElement('img')
        zoomImg.src = img.src
        zoomImg.style = `
          position: absolute;
          top: ${baseOnWidth ? zoomImgTop : 0}px;
          left: ${baseOnWidth ? 0 : zoomImgLeft}px;
          width: ${zoomImgWidth};
          height: ${zoomImgHeight}px;
          `
        zoomImg.animate([
          originalImgRect,
          zoomInImgRect
        ], animationSpeed)

        const overlay = document.createElement('div')
        overlay.style = `
          background-color: rgba(0,0,0,0.5);
          cursor: zoom-out;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: ${document.body.clientHeight}px;
          z-index: 100;
        `
        overlay.onclick = () => {
          zoomImg.style = `
            position: absolute;
            top: ${originalImgTop}px;
            left: ${originalImgLeft}px;
            width: ${img.width}px;
            height: ${img.height}px;
            `
          const zoomOutImgAnimation = zoomImg.animate([
            zoomInImgRect,
            originalImgRect
          ], animationSpeed)
          zoomOutImgAnimation.onfinish = () => overlay.remove()
        }

        overlay.appendChild(zoomImg)
        document.body.appendChild(overlay)
      }
    }
  }

  focus () {
    this.refs.root.focus()
  }

  getWindow () {
    return this.refs.root.contentWindow
  }

  scrollTo (targetRow) {
    const blocks = this.getWindow().document.querySelectorAll(
      'body>[data-line]'
    )

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
      options.icon = path.join(
        'file://',
        global.__dirname,
        '../../resources/app.png'
      )
    }
    return new window.Notification(title, options)
  }

  handleLinkClick (e) {
    e.preventDefault()
    e.stopPropagation()

    const href = e.target.href
    const linkHash = href.split('/').pop()

    const regexNoteInternalLink = /main.html#(.+)/
    if (regexNoteInternalLink.test(linkHash)) {
      const targetId = mdurl.encode(linkHash.match(regexNoteInternalLink)[1])
      const targetElement = this.refs.root.contentWindow.document.getElementById(
        targetId
      )

      if (targetElement != null) {
        this.getWindow().scrollTo(0, targetElement.offsetTop)
      }
      return
    }

    // this will match the new uuid v4 hash and the old hash
    // e.g.
    // :note:1c211eb7dcb463de6490 and
    // :note:7dd23275-f2b4-49cb-9e93-3454daf1af9c
    const regexIsNoteLink = /^:note:([a-zA-Z0-9-]{20,36})$/
    if (regexIsNoteLink.test(linkHash)) {
      eventEmitter.emit('list:jump', linkHash.replace(':note:', ''))
      return
    }

    const regexIsLine = /^:line:[0-9]/
    if (regexIsLine.test(linkHash)) {
      const numberPattern = /\d+/g

      const lineNumber = parseInt(linkHash.match(numberPattern)[0])
      eventEmitter.emit('line:jump', lineNumber)
      return
    }

    // this will match the old link format storage.key-note.key
    // e.g.
    // 877f99c3268608328037-1c211eb7dcb463de6490
    const regexIsLegacyNoteLink = /^(.{20})-(.{20})$/
    if (regexIsLegacyNoteLink.test(linkHash)) {
      eventEmitter.emit('list:jump', linkHash.split('-')[1])
      return
    }

    // other case
    shell.openExternal(href)
  }

  render () {
    const { className, style, tabIndex } = this.props
    return (
      <iframe
        className={
          className != null ? 'MarkdownPreview ' + className : 'MarkdownPreview'
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
  onContextMenu: PropTypes.func,
  className: PropTypes.string,
  value: PropTypes.string,
  showCopyNotification: PropTypes.bool,
  storagePath: PropTypes.string,
  smartQuotes: PropTypes.bool,
  smartArrows: PropTypes.bool,
  breaks: PropTypes.bool
}
