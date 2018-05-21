const constant = require('./constant')
const fixLocalURLS = require('./fixLocalURLS')
const handleAttachmentDrop = require('./handleAttachmentDrop')
const handlePastImageEvent = require('./handlePastImageEvent')
const getAbsolutePathsOfAttachmentsInContent = require('./getAbsolutePathsOfAttachmentsInContent')
const removeStorageAndNoteReferences = require('./removeStorageAndNoteReferences')
const moveAttachments = require('./moveAttachments')
const deleteAttachmentFolder = require('./deleteAttachmentFolder')
const deleteAttachmentsNotPresentInNote = require('./deleteAttachmentsNotPresentInNote')
const isAttachmentLink = require('./isAttachmentLink')
const handleAttachmentLinkPaste = require('./handleAttachmentLinkPaste')

module.exports = {
  fixLocalURLS,
  handleAttachmentDrop,
  handlePastImageEvent,
  getAbsolutePathsOfAttachmentsInContent,
  removeStorageAndNoteReferences,
  deleteAttachmentFolder,
  deleteAttachmentsNotPresentInNote,
  moveAttachments,
  isAttachmentLink,
  handleAttachmentLinkPaste,
  STORAGE_FOLDER_PLACEHOLDER: constant.STORAGE_FOLDER_PLACEHOLDER,
  DESTINATION_FOLDER: constant.DESTINATION_FOLDER
}
