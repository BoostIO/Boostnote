const path = require('path')
const sander = require('sander')
const constant = require('browser/main/lib/attachmentManagement/constant')
const findStorage = require('browser/lib/findStorage')

jest.mock('../../browser/main/lib/attachmentManagement/copyAttachments')
const copyAttachment = require('browser/main/lib/attachmentManagement/copyAttachments')
jest.mock('../../browser/main/lib/attachmentManagement/generateFileNotFoundMarkdown')
const generateFileNotFoundMarkdown = require('browser/main/lib/attachmentManagement/generateFileNotFoundMarkdown')
const methodUnderTest = require('browser/main/lib/attachmentManagement/handleAttachmentLinkPaste')

afterEach(() => {
  copyAttachment.mockClear()
  sander.exists.mockClear()
})

it('should test that handleAttachmentLinkPaste copies the attachments to the new location', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText = 'text ![alt](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'pdf.pdf)'
  const storageKey = 'storageKey'
  const expectedSourceFilePath = path.join(dummyStorage.path, constant.DESTINATION_FOLDER, pastedNoteKey, 'pdf.pdf')

  sander.exists = jest.fn(() => Promise.resolve(true))
  copyAttachment.mockReturnValue(Promise.resolve('dummyNewFileName'))

  return methodUnderTest(storageKey, newNoteKey, pasteText)
    .then(() => {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePath)
      expect(copyAttachment).toHaveBeenCalledWith(expectedSourceFilePath, storageKey, newNoteKey)
    })
})

it('should test that handleAttachmentLinkPaste don\'t try to copy the file if it does not exist', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText = 'text ![alt](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'pdf.pdf)'
  const storageKey = 'storageKey'
  const expectedSourceFilePath = path.join(dummyStorage.path, constant.DESTINATION_FOLDER, pastedNoteKey, 'pdf.pdf')

  sander.exists = jest.fn(() => Promise.resolve(false))

  return methodUnderTest(storageKey, newNoteKey, pasteText)
    .then(() => {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePath)
      expect(copyAttachment).not.toHaveBeenCalled()
    })
})

it('should test that handleAttachmentLinkPaste copies multiple attachments if multiple were pasted', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText = 'text ![alt](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'pdf.pdf) ..' +
    '![secondAttachment](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'img.jpg)'
  const storageKey = 'storageKey'
  const expectedSourceFilePathOne = path.join(dummyStorage.path, constant.DESTINATION_FOLDER, pastedNoteKey, 'pdf.pdf')
  const expectedSourceFilePathTwo = path.join(dummyStorage.path, constant.DESTINATION_FOLDER, pastedNoteKey, 'img.jpg')

  sander.exists = jest.fn(() => Promise.resolve(true))
  copyAttachment.mockReturnValue(Promise.resolve('dummyNewFileName'))

  return methodUnderTest(storageKey, newNoteKey, pasteText)
    .then(() => {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePathOne)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePathTwo)
      expect(copyAttachment).toHaveBeenCalledWith(expectedSourceFilePathOne, storageKey, newNoteKey)
      expect(copyAttachment).toHaveBeenCalledWith(expectedSourceFilePathTwo, storageKey, newNoteKey)
    })
})

it('should test that handleAttachmentLinkPaste returns the correct modified paste text', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const dummyNewFileName = 'dummyNewFileName'
  const pasteText = 'text ![alt](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'pdf.pdf)'
  const expectedText = 'text ![alt](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + newNoteKey + path.sep + dummyNewFileName + ')'
  const storageKey = 'storageKey'

  sander.exists = jest.fn(() => Promise.resolve(true))
  copyAttachment.mockReturnValue(Promise.resolve(dummyNewFileName))

  return methodUnderTest(storageKey, newNoteKey, pasteText)
    .then((returnedPastedText) => {
      expect(returnedPastedText).toBe(expectedText)
    })
})

it('should test that handleAttachmentLinkPaste returns the correct modified paste text if multiple links are posted', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const dummyNewFileNameOne = 'dummyNewFileName'
  const dummyNewFileNameTwo = 'dummyNewFileNameTwo'
  const pasteText = 'text ![alt](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'pdf.pdf) ' +
    '![secondImage](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'img.jpg)'
  const expectedText = 'text ![alt](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + newNoteKey + path.sep + dummyNewFileNameOne + ') ' +
    '![secondImage](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + newNoteKey + path.sep + dummyNewFileNameTwo + ')'
  const storageKey = 'storageKey'

  sander.exists = jest.fn(() => Promise.resolve(true))
  copyAttachment.mockReturnValueOnce(Promise.resolve(dummyNewFileNameOne))
  copyAttachment.mockReturnValue(Promise.resolve(dummyNewFileNameTwo))

  return methodUnderTest(storageKey, newNoteKey, pasteText)
    .then((returnedPastedText) => {
      expect(returnedPastedText).toBe(expectedText)
    })
})

it('should test that handleAttachmentLinkPaste calls the copy method correct if multiple links are posted where one file was found and one was not', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText = 'text ![alt](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'pdf.pdf) ..' +
    '![secondAttachment](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'img.jpg)'
  const storageKey = 'storageKey'
  const expectedSourceFilePathOne = path.join(dummyStorage.path, constant.DESTINATION_FOLDER, pastedNoteKey, 'pdf.pdf')
  const expectedSourceFilePathTwo = path.join(dummyStorage.path, constant.DESTINATION_FOLDER, pastedNoteKey, 'img.jpg')

  sander.exists = jest.fn()
  sander.exists.mockReturnValueOnce(Promise.resolve(false))
  sander.exists.mockReturnValue(Promise.resolve(true))
  copyAttachment.mockReturnValue(Promise.resolve('dummyNewFileName'))

  return methodUnderTest(storageKey, newNoteKey, pasteText)
    .then(() => {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePathOne)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePathTwo)
      expect(copyAttachment).toHaveBeenCalledTimes(1)
      expect(copyAttachment).toHaveBeenCalledWith(expectedSourceFilePathTwo, storageKey, newNoteKey)
    })
})

it('should test that handleAttachmentLinkPaste returns the correct modified paste text if the file was not found', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText = 'text ![alt.png](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'pdf.pdf)'
  const storageKey = 'storageKey'
  const fileNotFoundMD = 'file not found'
  const expectedPastText = 'text ' + fileNotFoundMD

  generateFileNotFoundMarkdown.mockReturnValue(fileNotFoundMD)
  sander.exists = jest.fn(() => Promise.resolve(false))

  return methodUnderTest(storageKey, newNoteKey, pasteText)
    .then((returnedPastedText) => {
      expect(returnedPastedText).toBe(expectedPastText)
    })
})

it('should test that handleAttachmentLinkPaste returns the correct modified paste text if multiple files were not found', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText = 'text ![alt](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'pdf.pdf) ' +
    '![secondImage](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'img.jpg)'
  const storageKey = 'storageKey'
  const fileNotFoundMD = 'file not found'
  const expectedPastText = 'text ' + fileNotFoundMD + ' ' + fileNotFoundMD
  generateFileNotFoundMarkdown.mockReturnValue(fileNotFoundMD)

  sander.exists = jest.fn(() => Promise.resolve(false))

  return methodUnderTest(storageKey, newNoteKey, pasteText)
    .then((returnedPastedText) => {
      expect(returnedPastedText).toBe(expectedPastText)
    })
})

it('should test that handleAttachmentLinkPaste returns the correct modified paste text if one file was found and one was not found', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const dummyFoundFileName = 'dummyFileName'
  const fileNotFoundMD = 'file not found'
  const pasteText = 'text ![alt](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'pdf.pdf) .. ' +
    '![secondAttachment](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'img.jpg)'
  const storageKey = 'storageKey'
  const expectedPastText = 'text ' + fileNotFoundMD + ' .. ![secondAttachment](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + newNoteKey + path.sep + dummyFoundFileName + ')'

  sander.exists = jest.fn()
  sander.exists.mockReturnValueOnce(Promise.resolve(false))
  sander.exists.mockReturnValue(Promise.resolve(true))
  copyAttachment.mockReturnValue(Promise.resolve(dummyFoundFileName))
  generateFileNotFoundMarkdown.mockReturnValue(fileNotFoundMD)

  return methodUnderTest(storageKey, newNoteKey, pasteText)
    .then((returnedPastedText) => {
      expect(returnedPastedText).toBe(expectedPastText)
    })
})

it('should test that handleAttachmentLinkPaste returns the correct modified paste text if one file was found and one was not found', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const dummyFoundFileName = 'dummyFileName'
  const fileNotFoundMD = 'file not found'
  const pasteText = 'text ![alt](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'pdf.pdf) .. ' +
    '![secondAttachment](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + pastedNoteKey + path.sep + 'img.jpg)'
  const storageKey = 'storageKey'
  const expectedPastText = 'text ![alt](' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + newNoteKey + path.sep + dummyFoundFileName + ') .. ' + fileNotFoundMD

  sander.exists = jest.fn()
  sander.exists.mockReturnValueOnce(Promise.resolve(true))
  sander.exists.mockReturnValue(Promise.resolve(false))
  copyAttachment.mockReturnValue(Promise.resolve(dummyFoundFileName))
  generateFileNotFoundMarkdown.mockReturnValue(fileNotFoundMD)

  return methodUnderTest(storageKey, newNoteKey, pasteText)
    .then((returnedPastedText) => {
      expect(returnedPastedText).toBe(expectedPastText)
    })
})
