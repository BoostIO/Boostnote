const mdurl = require('mdurl')
const path = require('path')
const constant = require('./constant')
const escapeStringRegexp = require('escape-string-regexp')

/**
 * @description Returns all attachment paths of the given markdown
 * @param {String} markdownContent content in which the attachment paths should be found
 * @returns {String[]} Array of the relative paths (starting with :storage) of the attachments of the given markdown
 */
function getAttachmentsInContent (markdownContent) {
  const preparedInput = markdownContent.replace(new RegExp(mdurl.encode(path.sep), 'g'), path.sep)
  const regexp = new RegExp(constant.STORAGE_FOLDER_PLACEHOLDER + escapeStringRegexp(path.sep) + '([a-zA-Z0-9]|-)+' + escapeStringRegexp(path.sep) + '[a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)?', 'g')
  return preparedInput.match(regexp)
}

module.exports = getAttachmentsInContent
