const escapeStringRegexp = require('escape-string-regexp')
const path = require('path')
const constant = require('./constant')
/**
 * Determines whether a given text is a link to an boostnote attachment
 * @param text Text that might contain a attachment link
 * @return {Boolean} Result of the test
 */
function isAttachmentLink (text) {
  if (text) {
    return text.match(new RegExp('.*\\[.*\\]\\( *' + escapeStringRegexp(constant.STORAGE_FOLDER_PLACEHOLDER) + escapeStringRegexp(path.sep) + '.*\\).*', 'gi')) != null
  }
  return false
}
module.exports = isAttachmentLink
