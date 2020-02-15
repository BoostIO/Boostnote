/**
 * @fileoverview Markdown table of contents generator
 */

import { EOL } from 'os'
import toc from 'markdown-toc'
import mdlink from 'markdown-link'
import slugify from './slugify'

const hasProp = Object.prototype.hasOwnProperty

/**
 * From @enyaxu/markdown-it-anchor
 */
function uniqueSlug(slug, slugs, opts) {
  let uniq = slug
  let i = opts.uniqueSlugStartIndex
  while (hasProp.call(slugs, uniq)) uniq = `${slug}-${i++}`
  slugs[uniq] = true
  return uniq
}

function linkify(token) {
  token.content = mdlink(token.content, `#${decodeURI(token.slug)}`)
  return token
}

const TOC_MARKER_START = '<!-- toc -->'
const TOC_MARKER_END = '<!-- tocstop -->'

const tocRegex = new RegExp(`${TOC_MARKER_START}[\\s\\S]*?${TOC_MARKER_END}`)

/**
 * Takes care of proper updating given editor with TOC.
 * If TOC doesn't exit in the editor, it's inserted at current caret position.
 * Otherwise,TOC is updated in place.
 * @param editor CodeMirror editor to be updated with TOC
 */
export function generateInEditor(editor) {
  function updateExistingToc() {
    const toc = generate(editor.getValue())
    const search = editor.getSearchCursor(tocRegex)
    while (search.findNext()) {
      search.replace(toc)
    }
  }

  function addTocAtCursorPosition() {
    const toc = generate(
      editor.getRange(editor.getCursor(), { line: Infinity })
    )
    editor.replaceRange(wrapTocWithEol(toc, editor), editor.getCursor())
  }

  if (tocExistsInEditor(editor)) {
    updateExistingToc()
  } else {
    addTocAtCursorPosition()
  }
}

export function tocExistsInEditor(editor) {
  return tocRegex.test(editor.getValue())
}

/**
 * Generates MD TOC based on MD document passed as string.
 * @param markdownText MD document
 * @returns generatedTOC String containing generated TOC
 */
export function generate(markdownText) {
  const slugs = {}
  const opts = {
    uniqueSlugStartIndex: 1
  }

  const result = toc(markdownText, {
    slugify: title => {
      return uniqueSlug(slugify(title), slugs, opts)
    },
    linkify: false
  })

  const md = toc.bullets(result.json.map(linkify), {
    highest: result.highest
  })

  return TOC_MARKER_START + EOL + EOL + md + EOL + EOL + TOC_MARKER_END
}

function wrapTocWithEol(toc, editor) {
  const leftWrap = editor.getCursor().ch === 0 ? '' : EOL
  const rightWrap =
    editor.getLine(editor.getCursor().line).length === editor.getCursor().ch
      ? ''
      : EOL
  return leftWrap + toc + rightWrap
}

export default {
  generate,
  generateInEditor,
  tocExistsInEditor
}
