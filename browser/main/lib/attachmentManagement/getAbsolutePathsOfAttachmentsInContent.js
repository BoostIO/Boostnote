const path = require('path')
const constant = require('./constant')
const getAttachmentsInContent = require('./getAttachmentsInContent')

/**
 * @description Returns an array of the absolute paths of the attachments referenced in the given markdown code
 * @param {String} markdownContent content in which the attachment paths should be found
 * @param {String} storagePath path of the current storage
 * @returns {String[]} Absolute paths of the referenced attachments
 */
function getAbsolutePathsOfAttachmentsInContent (markdownContent, storagePath) {
  const temp = getAttachmentsInContent(markdownContent)
  const result = []
  for (const relativePath of temp) {
    result.push(relativePath.replace(new RegExp(constant.STORAGE_FOLDER_PLACEHOLDER, 'g'), path.join(storagePath, constant.DESTINATION_FOLDER)))
  }
  return result
}

module.exports = getAbsolutePathsOfAttachmentsInContent
