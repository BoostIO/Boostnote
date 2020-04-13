/**
 * @fileoverview Text trimmer for markdown note.
 */

/**
 * @param {string} input
 * @return {string}
 */
export function strip(input) {
  let output = input
  try {
    output = output
      .replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, '$1')
      .replace(/\n={2,}/g, '\n')
      .replace(/~~/g, '')
      .replace(/`{3}.*\n/g, '')
      .replace(/<(.*?)>/g, '$1')
      .replace(/^[=\-]{2,}\s*$/g, '')
      .replace(/\[\^.+?\](: .*?$)?/g, '')
      .replace(/\s{0,2}\[.*?\]: .*?$/g, '')
      .replace(/!\[.*?\][\[\(].*?[\]\)]/g, '')
      .replace(/\[(.*?)\][\[\(].*?[\]\)]/g, '$1')
      .replace(/>/g, '')
      .replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, '')
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/(`{3,})(.*?)\1/gm, '$2')
      .replace(/^-{3,}\s*$/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\n{2,}/g, '\n\n')
  } catch (e) {
    console.error(e)
    return input
  }
  return output
}

export default {
  strip
}
