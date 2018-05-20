jest.mock('fs')

const path = require('path')
const fs = require('fs')
const constant = require('browser/main/lib/attachmentManagement/constant')
const findStorage = require('browser/lib/findStorage')
const generateMarkdown = require('browser/main/lib/attachmentManagement/generateAttachmentMarkdown')
const methodUnderTest = require('browser/main/lib/attachmentManagement/deleteAttachmentsNotPresentInNote')

it('should test that deleteAttachmentsNotPresentInNote deletes all unreferenced attachments ', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  const noteKey = 'noteKey'
  const storageKey = 'storageKey'
  const markdownContent = ''
  const dummyFilesInFolder = ['file1.txt', 'file2.pdf', 'file3.jpg']
  const attachmentFolderPath = path.join(dummyStorage.path, constant.DESTINATION_FOLDER, noteKey)

  findStorage.findStorage = jest.fn(() => dummyStorage)
  fs.existsSync = jest.fn(() => true)
  fs.readdir = jest.fn((paht, callback) => callback(undefined, dummyFilesInFolder))
  fs.unlink = jest.fn()

  methodUnderTest(markdownContent, storageKey, noteKey)
  expect(fs.existsSync).toHaveBeenLastCalledWith(attachmentFolderPath)
  expect(fs.readdir).toHaveBeenCalledTimes(1)
  expect(fs.readdir.mock.calls[0][0]).toBe(attachmentFolderPath)

  expect(fs.unlink).toHaveBeenCalledTimes(dummyFilesInFolder.length)
  const fsUnlinkCallArguments = []
  for (let i = 0; i < dummyFilesInFolder.length; i++) {
    fsUnlinkCallArguments.push(fs.unlink.mock.calls[i][0])
  }

  dummyFilesInFolder.forEach(function (file) {
    expect(fsUnlinkCallArguments.includes(path.join(attachmentFolderPath, file))).toBe(true)
  })
})

it('should test that deleteAttachmentsNotPresentInNote does not delete referenced attachments', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  const noteKey = 'noteKey'
  const storageKey = 'storageKey'
  const dummyFilesInFolder = ['file1.txt', 'file2.pdf', 'file3.jpg']
  const markdownContent = generateMarkdown('fileLabel', path.join(constant.STORAGE_FOLDER_PLACEHOLDER, noteKey, dummyFilesInFolder[0]), false)
  const attachmentFolderPath = path.join(dummyStorage.path, constant.DESTINATION_FOLDER, noteKey)

  findStorage.findStorage = jest.fn(() => dummyStorage)
  fs.existsSync = jest.fn(() => true)
  fs.readdir = jest.fn((paht, callback) => callback(undefined, dummyFilesInFolder))
  fs.unlink = jest.fn()

  methodUnderTest(markdownContent, storageKey, noteKey)

  expect(fs.unlink).toHaveBeenCalledTimes(dummyFilesInFolder.length - 1)
  const fsUnlinkCallArguments = []
  for (let i = 0; i < dummyFilesInFolder.length - 1; i++) {
    fsUnlinkCallArguments.push(fs.unlink.mock.calls[i][0])
  }
  expect(fsUnlinkCallArguments.includes(path.join(attachmentFolderPath, dummyFilesInFolder[0]))).toBe(false)
})
