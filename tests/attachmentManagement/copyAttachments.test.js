jest.mock('fs')
const fs = require('fs')
const path = require('path')
const findStorage = require('browser/lib/findStorage')
jest.mock('unique-slug')
const uniqueSlug = require('unique-slug')
const consts = require('browser/main/lib/attachmentManagement/constant')
const methodUnderTest = require('browser/main/lib/attachmentManagement/copyAttachments')

it('should test that copyAttachment should throw an error if sourcePath or storageKey or noteKey are undefined', function () {
  methodUnderTest(undefined, 'storageKey').then(() => {}, error => {
    expect(error).toBe('sourceFilePath has to be given')
  })
  methodUnderTest(null, 'storageKey', 'noteKey').then(() => {}, error => {
    expect(error).toBe('sourceFilePath has to be given')
  })
  methodUnderTest('source', undefined, 'noteKey').then(() => {}, error => {
    expect(error).toBe('storageKey has to be given')
  })
  methodUnderTest('source', null, 'noteKey').then(() => {}, error => {
    expect(error).toBe('storageKey has to be given')
  })
  methodUnderTest('source', 'storageKey', null).then(() => {}, error => {
    expect(error).toBe('noteKey has to be given')
  })
  methodUnderTest('source', 'storageKey', undefined).then(() => {}, error => {
    expect(error).toBe('noteKey has to be given')
  })
})

it('should test that copyAttachment should throw an error if sourcePath dosen\'t exists', function () {
  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValue(false)

  return methodUnderTest('path', 'storageKey', 'noteKey').then(() => {}, error => {
    expect(error).toBe('source file does not exist')
    expect(fs.existsSync).toHaveBeenCalledWith('path')
  })
})

it('should test that copyAttachment works correctly assuming correct working of fs', function () {
  const dummyExtension = '.ext'
  const sourcePath = 'path' + dummyExtension
  const storageKey = 'storageKey'
  const noteKey = 'noteKey'
  const dummyUniquePath = 'dummyPath'
  const dummyStorage = {path: 'dummyStoragePath'}

  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValue(true)
  fs.createReadStream = jest.fn()
  fs.createReadStream.mockReturnValue({pipe: jest.fn()})
  fs.createWriteStream = jest.fn()

  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValue(dummyStorage)
  uniqueSlug.mockReturnValue(dummyUniquePath)

  return methodUnderTest(sourcePath, storageKey, noteKey).then(
    function (newFileName) {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(fs.createReadStream).toHaveBeenCalledWith(sourcePath)
      expect(fs.existsSync).toHaveBeenCalledWith(sourcePath)
      expect(fs.createReadStream().pipe).toHaveBeenCalled()
      expect(fs.createWriteStream).toHaveBeenCalledWith(path.join(dummyStorage.path, consts.DESTINATION_FOLDER, noteKey, dummyUniquePath + dummyExtension))
      expect(newFileName).toBe(dummyUniquePath + dummyExtension)
    })
})

it('should test that copyAttachment creates a new folder if the attachment folder doesn\'t exist', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  const noteKey = 'noteKey'
  const attachmentFolderPath = path.join(dummyStorage.path, consts.DESTINATION_FOLDER)
  const attachmentFolderNoteKyPath = path.join(dummyStorage.path, consts.DESTINATION_FOLDER, noteKey)

  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValueOnce(true)
  fs.existsSync.mockReturnValueOnce(false)
  fs.existsSync.mockReturnValueOnce(false)
  fs.mkdirSync = jest.fn()

  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValue(dummyStorage)
  uniqueSlug.mockReturnValue('dummyPath')

  return methodUnderTest('path', 'storageKey', 'noteKey').then(
    function () {
      expect(fs.existsSync).toHaveBeenCalledWith(attachmentFolderPath)
      expect(fs.mkdirSync).toHaveBeenCalledWith(attachmentFolderPath)
      expect(fs.existsSync).toHaveBeenLastCalledWith(attachmentFolderNoteKyPath)
      expect(fs.mkdirSync).toHaveBeenLastCalledWith(attachmentFolderNoteKyPath)
    })
})

it('should test that copyAttachment don\'t uses a random file name if not intended ', function () {
  const dummyStorage = {path: 'dummyStoragePath'}

  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValueOnce(true)
  fs.existsSync.mockReturnValueOnce(false)
  fs.mkdirSync = jest.fn()

  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValue(dummyStorage)
  uniqueSlug.mockReturnValue('dummyPath')

  return methodUnderTest('path', 'storageKey', 'noteKey', false).then(
    function (newFileName) {
      expect(newFileName).toBe('path')
    })
})
