'use strict'

jest.mock('fs')
const fs = require('fs')
const path = require('path')
const findStorage = require('browser/lib/findStorage')
jest.mock('unique-slug')
const uniqueSlug = require('unique-slug')
const mdurl = require('mdurl')

const systemUnderTest = require('browser/main/lib/dataApi/attachmentManagement')

it('should test that copyAttachment should throw an error if sourcePath or storageKey or noteKey are undefined', function () {
  systemUnderTest.copyAttachment(undefined, 'storageKey').then(() => {}, error => {
    expect(error).toBe('sourceFilePath has to be given')
  })
  systemUnderTest.copyAttachment(null, 'storageKey', 'noteKey').then(() => {}, error => {
    expect(error).toBe('sourceFilePath has to be given')
  })
  systemUnderTest.copyAttachment('source', undefined, 'noteKey').then(() => {}, error => {
    expect(error).toBe('storageKey has to be given')
  })
  systemUnderTest.copyAttachment('source', null, 'noteKey').then(() => {}, error => {
    expect(error).toBe('storageKey has to be given')
  })
  systemUnderTest.copyAttachment('source', 'storageKey', null).then(() => {}, error => {
    expect(error).toBe('noteKey has to be given')
  })
  systemUnderTest.copyAttachment('source', 'storageKey', undefined).then(() => {}, error => {
    expect(error).toBe('noteKey has to be given')
  })
})

it('should test that copyAttachment should throw an error if sourcePath dosen\'t exists', function () {
  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValue(false)

  systemUnderTest.copyAttachment('path', 'storageKey', 'noteKey').then(() => {}, error => {
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

  systemUnderTest.copyAttachment(sourcePath, storageKey, noteKey).then(
    function (newFileName) {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(fs.createReadStream).toHaveBeenCalledWith(sourcePath)
      expect(fs.existsSync).toHaveBeenCalledWith(sourcePath)
      expect(fs.createReadStream().pipe).toHaveBeenCalled()
      expect(fs.createWriteStream).toHaveBeenCalledWith(path.join(dummyStorage.path, systemUnderTest.DESTINATION_FOLDER, noteKey, dummyUniquePath + dummyExtension))
      expect(newFileName).toBe(dummyUniquePath + dummyExtension)
    })
})

it('should test that copyAttachment creates a new folder if the attachment folder doesn\'t exist', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  const noteKey = 'noteKey'
  const attachmentFolderPath = path.join(dummyStorage.path, systemUnderTest.DESTINATION_FOLDER)
  const attachmentFolderNoteKyPath = path.join(dummyStorage.path, systemUnderTest.DESTINATION_FOLDER, noteKey)

  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValueOnce(true)
  fs.existsSync.mockReturnValueOnce(false)
  fs.existsSync.mockReturnValueOnce(false)
  fs.mkdirSync = jest.fn()

  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValue(dummyStorage)
  uniqueSlug.mockReturnValue('dummyPath')

  systemUnderTest.copyAttachment('path', 'storageKey', 'noteKey').then(
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

  systemUnderTest.copyAttachment('path', 'storageKey', 'noteKey', false).then(
    function (newFileName) {
      expect(newFileName).toBe('path')
    })
})

it('should replace the all ":storage" path with the actual storage path', function () {
  const storageFolder = systemUnderTest.DESTINATION_FOLDER
  const testInput =
    '<html>\n' +
    '    <head>\n' +
    '        //header\n' +
    '    </head>\n' +
    '    <body data-theme="default">\n' +
    '        <h2 data-line="0" id="Headline">Headline</h2>\n' +
    '        <p data-line="2">\n' +
    '            <img src=":storage' + mdurl.encode(path.sep) + '0.6r4zdgc22xp.png" alt="dummyImage.png" >\n' +
    '        </p>\n' +
    '        <p data-line="4">\n' +
    '            <a href=":storage' + mdurl.encode(path.sep) + '0.q2i4iw0fyx.pdf">dummyPDF.pdf</a>\n' +
    '        </p>\n' +
    '        <p data-line="6">\n' +
    '            <img src=":storage' + mdurl.encode(path.sep) + 'd6c5ee92.jpg" alt="dummyImage2.jpg">\n' +
    '        </p>\n' +
    '    </body>\n' +
    '</html>'
  const storagePath = '<<dummyStoragePath>>'
  const expectedOutput =
    '<html>\n' +
    '    <head>\n' +
    '        //header\n' +
    '    </head>\n' +
    '    <body data-theme="default">\n' +
    '        <h2 data-line="0" id="Headline">Headline</h2>\n' +
    '        <p data-line="2">\n' +
    '            <img src="file:///' + storagePath + '\\' + storageFolder + '\\0.6r4zdgc22xp.png" alt="dummyImage.png" >\n' +
    '        </p>\n' +
    '        <p data-line="4">\n' +
    '            <a href="file:///' + storagePath + '\\' + storageFolder + '\\0.q2i4iw0fyx.pdf">dummyPDF.pdf</a>\n' +
    '        </p>\n' +
    '        <p data-line="6">\n' +
    '            <img src="file:///' + storagePath + '\\' + storageFolder + '\\d6c5ee92.jpg" alt="dummyImage2.jpg">\n' +
    '        </p>\n' +
    '    </body>\n' +
    '</html>'
  const actual = systemUnderTest.fixLocalURLS(testInput, storagePath)
  expect(actual).toEqual(expectedOutput)
})

it('should test that generateAttachmentMarkdown works correct both with previews and without', function () {
  const fileName = 'fileName'
  const path = 'path'
  let expected = `![${fileName}](${path})`
  let actual = systemUnderTest.generateAttachmentMarkdown(fileName, path, true)
  expect(actual).toEqual(expected)
  expected = `[${fileName}](${path})`
  actual = systemUnderTest.generateAttachmentMarkdown(fileName, path, false)
  expect(actual).toEqual(expected)
})
