const mdurl = require('mdurl')
const path = require('path')
const constant = require('./constant')

/**
 * @description Fixes the URLs embedded in the generated HTML so that they again refer actual local files.
 * @param {String} renderedHTML HTML in that the links should be fixed
 * @param {String} storagePath Path of the current storage
 * @returns {String} postprocessed HTML in which all :storage references are mapped to the actual paths.
 */
function fixLocalURLS (renderedHTML, storagePath) {
  return renderedHTML.replace(new RegExp(mdurl.encode(path.sep), 'g'), path.sep).replace(new RegExp(constant.STORAGE_FOLDER_PLACEHOLDER, 'g'), 'file:///' + path.join(storagePath, constant.DESTINATION_FOLDER))
}

module.exports = fixLocalURLS
