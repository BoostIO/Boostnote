/**
 * @description Generates the markdown code for a given attachment
 * @param {String} fileName Name of the attachment
 * @param {String} path Path of the attachment
 * @param {Boolean} showPreview Indicator whether the generated markdown should show a preview of the image. Note that at the moment only previews for images are supported
 * @returns {String} Generated markdown code
 */
function generateAttachmentMarkdown (fileName, path, showPreview) {
  return `${showPreview ? '!' : ''}[${fileName}](${path})`
}

module.exports = generateAttachmentMarkdown
