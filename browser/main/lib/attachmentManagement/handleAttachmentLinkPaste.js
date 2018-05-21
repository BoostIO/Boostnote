const path = require('path')
const sander = require('sander')
const findStorage = require('browser/lib/findStorage')
const escapeStringRegexp = require('escape-string-regexp')
const getAttachmentsInContent = require('./getAttachmentsInContent')
const constant = require('./constant')
const copyAttachment = require('./copyAttachments')
const generateFileNotFoundMarkdown = require('./generateFileNotFoundMarkdown')

/**
 * @description Handles the paste of an attachment link. Copies the referenced attachment to the location belonging to the new note.
 *  Returns a modified version of the pasted text so that it matches the copied attachment (resp. the new location)
 * @param storageKey StorageKey of the current note
 * @param noteKey NoteKey of the currentNote
 * @param linkText Text that was pasted
 * @return {Promise<String>} Promise returning the modified text
 */
function handleAttachmentLinkPaste (storageKey, noteKey, linkText) {
  const storagePath = findStorage.findStorage(storageKey).path
  const attachments = getAttachmentsInContent(linkText) || []
  const replaceInstructions = []
  const copies = []
  for (const attachment of attachments) {
    const absPathOfAttachment = attachment.replace(new RegExp(constant.STORAGE_FOLDER_PLACEHOLDER, 'g'), path.join(storagePath, constant.DESTINATION_FOLDER))
    copies.push(
      sander.exists(absPathOfAttachment)
        .then((fileExists) => {
          if (!fileExists) {
            const fileNotFoundRegexp = new RegExp('!?' + escapeStringRegexp('[') + '[\\w|\\d|\\s|\\.]*\\]\\(\\s*' + constant.STORAGE_FOLDER_PLACEHOLDER + '[\\w|\\d|\\-|' + escapeStringRegexp(path.sep) + ']*' + escapeStringRegexp(path.basename(absPathOfAttachment)) + escapeStringRegexp(')'))
            replaceInstructions.push({regexp: fileNotFoundRegexp, replacenment: generateFileNotFoundMarkdown()})
            return Promise.resolve()
          }
          copyAttachment(absPathOfAttachment, storageKey, noteKey)
            .then((fileName) => {
              const replaceLinkRegExp = new RegExp(escapeStringRegexp('(') + ' *' + constant.STORAGE_FOLDER_PLACEHOLDER + '[\\w|\\d|\\-|' + escapeStringRegexp(path.sep) + ']*' + escapeStringRegexp(path.basename(absPathOfAttachment)) + ' *' + escapeStringRegexp(')'))
              replaceInstructions.push({regexp: replaceLinkRegExp, replacenment: '(' + path.join(constant.STORAGE_FOLDER_PLACEHOLDER, noteKey, fileName) + ')'})
              return Promise.resolve()
            })
        })
    )
  }
  return Promise.all(copies).then(() => {
    let modifiedLinkText = linkText
    for (const replaceInstruction of replaceInstructions) {
      modifiedLinkText = modifiedLinkText.replace(replaceInstruction.regexp, replaceInstruction.replacenment)
    }
    return modifiedLinkText
  })
}

module.exports = handleAttachmentLinkPaste
