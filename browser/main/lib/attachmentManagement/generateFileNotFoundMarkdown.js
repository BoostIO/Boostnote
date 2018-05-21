import i18n from 'browser/lib/i18n'

function generateFileNotFoundMarkdown () {
  return '*' + i18n.__('Attachment_link_pasted_file_not_found') + '*'
}

module.exports = generateFileNotFoundMarkdown
