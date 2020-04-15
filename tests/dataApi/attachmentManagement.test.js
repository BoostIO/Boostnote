'use strict'

jest.mock('fs')
const fs = require('fs')
const path = require('path')
const findStorage = require('browser/lib/findStorage')
jest.mock('unique-slug')
const uniqueSlug = require('unique-slug')
const mdurl = require('mdurl')
const fse = require('fs-extra')
jest.mock('sander')
const sander = require('sander')

const systemUnderTest = require('browser/main/lib/dataApi/attachmentManagement')

it('should test that copyAttachment should throw an error if sourcePath or storageKey or noteKey are undefined', function() {
  systemUnderTest.copyAttachment(undefined, 'storageKey').then(
    () => {},
    error => {
      expect(error).toBe('sourceFilePath has to be given')
    }
  )
  systemUnderTest.copyAttachment(null, 'storageKey', 'noteKey').then(
    () => {},
    error => {
      expect(error).toBe('sourceFilePath has to be given')
    }
  )
  systemUnderTest.copyAttachment('source', undefined, 'noteKey').then(
    () => {},
    error => {
      expect(error).toBe('storageKey has to be given')
    }
  )
  systemUnderTest.copyAttachment('source', null, 'noteKey').then(
    () => {},
    error => {
      expect(error).toBe('storageKey has to be given')
    }
  )
  systemUnderTest.copyAttachment('source', 'storageKey', null).then(
    () => {},
    error => {
      expect(error).toBe('noteKey has to be given')
    }
  )
  systemUnderTest.copyAttachment('source', 'storageKey', undefined).then(
    () => {},
    error => {
      expect(error).toBe('noteKey has to be given')
    }
  )
})

it("should test that copyAttachment should throw an error if sourcePath dosen't exists", function() {
  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValue(false)

  return systemUnderTest.copyAttachment('path', 'storageKey', 'noteKey').then(
    () => {},
    error => {
      expect(error).toBe('source file does not exist')
      expect(fs.existsSync).toHaveBeenCalledWith('path')
    }
  )
})

it('should test that copyAttachment works correctly assuming correct working of fs', function() {
  const dummyExtension = '.ext'
  const sourcePath = 'path' + dummyExtension
  const storageKey = 'storageKey'
  const noteKey = 'noteKey'
  const dummyUniquePath = 'dummyPath'
  const dummyStorage = { path: 'dummyStoragePath' }
  const dummyReadStream = {}

  dummyReadStream.pipe = jest.fn()
  dummyReadStream.on = jest.fn((event, callback) => {
    callback()
  })
  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValue(true)
  fs.createReadStream = jest.fn(() => dummyReadStream)
  fs.createWriteStream = jest.fn()

  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValue(dummyStorage)
  uniqueSlug.mockReturnValue(dummyUniquePath)

  return systemUnderTest
    .copyAttachment(sourcePath, storageKey, noteKey)
    .then(function(newFileName) {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(fs.createReadStream).toHaveBeenCalledWith(sourcePath)
      expect(fs.existsSync).toHaveBeenCalledWith(sourcePath)
      expect(fs.createReadStream().pipe).toHaveBeenCalled()
      expect(fs.createWriteStream).toHaveBeenCalledWith(
        path.join(
          dummyStorage.path,
          systemUnderTest.DESTINATION_FOLDER,
          noteKey,
          dummyUniquePath + dummyExtension
        )
      )
      expect(newFileName).toBe(dummyUniquePath + dummyExtension)
    })
})

it("should test that copyAttachment creates a new folder if the attachment folder doesn't exist", function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  const noteKey = 'noteKey'
  const attachmentFolderPath = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER
  )
  const attachmentFolderNoteKyPath = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER,
    noteKey
  )
  const dummyReadStream = {}

  dummyReadStream.pipe = jest.fn()
  dummyReadStream.on = jest.fn((event, callback) => {
    callback()
  })
  fs.createReadStream = jest.fn(() => dummyReadStream)
  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValueOnce(true)
  fs.existsSync.mockReturnValueOnce(false)
  fs.existsSync.mockReturnValueOnce(false)
  fs.mkdirSync = jest.fn()

  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValue(dummyStorage)
  uniqueSlug.mockReturnValue('dummyPath')

  return systemUnderTest
    .copyAttachment('path', 'storageKey', 'noteKey')
    .then(function() {
      expect(fs.existsSync).toHaveBeenCalledWith(attachmentFolderPath)
      expect(fs.mkdirSync).toHaveBeenCalledWith(attachmentFolderPath)
      expect(fs.existsSync).toHaveBeenLastCalledWith(attachmentFolderNoteKyPath)
      expect(fs.mkdirSync).toHaveBeenLastCalledWith(attachmentFolderNoteKyPath)
    })
})

it("should test that copyAttachment don't uses a random file name if not intended ", function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  const dummyReadStream = {}

  dummyReadStream.pipe = jest.fn()
  dummyReadStream.on = jest.fn((event, callback) => {
    callback()
  })
  fs.createReadStream = jest.fn(() => dummyReadStream)
  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValueOnce(true)
  fs.existsSync.mockReturnValueOnce(false)
  fs.mkdirSync = jest.fn()

  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValue(dummyStorage)
  uniqueSlug.mockReturnValue('dummyPath')

  return systemUnderTest
    .copyAttachment('path', 'storageKey', 'noteKey', false)
    .then(function(newFileName) {
      expect(newFileName).toBe('path')
    })
})

it('should test that copyAttachment with url (with extension, without query)', function() {
  const dummyStorage = { path: 'dummyStoragePath' }

  const dummyReadStream = {
    pipe: jest.fn(),
    on: jest.fn((event, callback) => {
      callback()
    })
  }
  fs.createReadStream = jest.fn(() => dummyReadStream)

  const dummyWriteStream = {
    write: jest.fn((data, callback) => {
      callback()
    })
  }
  fs.createWriteStream = jest.fn(() => dummyWriteStream)

  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValueOnce(true)
  fs.existsSync.mockReturnValueOnce(false)
  fs.mkdirSync = jest.fn()

  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValue(dummyStorage)
  uniqueSlug.mockReturnValue('dummyPath')

  const sourcePath = {
    sourceFilePath: 'http://www.foo.bar/baz/qux.jpg',
    type: 'base64',
    data: 'data:image/jpeg;base64,Ym9vc3Rub3Rl'
  }

  return systemUnderTest
    .copyAttachment(sourcePath, 'storageKey', 'noteKey')
    .then(function(newFileName) {
      expect(newFileName).toBe('dummyPath.jpg')
    })
})

it('should test that copyAttachment with url (with extension, with query)', function() {
  const dummyStorage = { path: 'dummyStoragePath' }

  const dummyReadStream = {
    pipe: jest.fn(),
    on: jest.fn((event, callback) => {
      callback()
    })
  }
  fs.createReadStream = jest.fn(() => dummyReadStream)

  const dummyWriteStream = {
    write: jest.fn((data, callback) => {
      callback()
    })
  }
  fs.createWriteStream = jest.fn(() => dummyWriteStream)

  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValueOnce(true)
  fs.existsSync.mockReturnValueOnce(false)
  fs.mkdirSync = jest.fn()

  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValue(dummyStorage)
  uniqueSlug.mockReturnValue('dummyPath')

  const sourcePath = {
    sourceFilePath: 'http://www.foo.bar/baz/qux.jpg?h=1080',
    type: 'base64',
    data: 'data:image/jpeg;base64,Ym9vc3Rub3Rl'
  }

  return systemUnderTest
    .copyAttachment(sourcePath, 'storageKey', 'noteKey')
    .then(function(newFileName) {
      expect(newFileName).toBe('dummyPath.jpg')
    })
})

it('should test that copyAttachment with url (without extension, without query)', function() {
  const dummyStorage = { path: 'dummyStoragePath' }

  const dummyReadStream = {
    pipe: jest.fn(),
    on: jest.fn((event, callback) => {
      callback()
    })
  }
  fs.createReadStream = jest.fn(() => dummyReadStream)

  const dummyWriteStream = {
    write: jest.fn((data, callback) => {
      callback()
    })
  }
  fs.createWriteStream = jest.fn(() => dummyWriteStream)

  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValueOnce(true)
  fs.existsSync.mockReturnValueOnce(false)
  fs.mkdirSync = jest.fn()

  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValue(dummyStorage)
  uniqueSlug.mockReturnValue('dummyPath')

  const sourcePath = {
    sourceFilePath: 'http://www.foo.bar/baz/qux',
    type: 'base64',
    data: 'data:image/jpeg;base64,Ym9vc3Rub3Rl'
  }

  return systemUnderTest
    .copyAttachment(sourcePath, 'storageKey', 'noteKey')
    .then(function(newFileName) {
      expect(newFileName).toBe('dummyPath.png')
    })
})

it('should test that copyAttachment with url (without extension, with query)', function() {
  const dummyStorage = { path: 'dummyStoragePath' }

  const dummyReadStream = {
    pipe: jest.fn(),
    on: jest.fn((event, callback) => {
      callback()
    })
  }
  fs.createReadStream = jest.fn(() => dummyReadStream)

  const dummyWriteStream = {
    write: jest.fn((data, callback) => {
      callback()
    })
  }
  fs.createWriteStream = jest.fn(() => dummyWriteStream)

  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValueOnce(true)
  fs.existsSync.mockReturnValueOnce(false)
  fs.mkdirSync = jest.fn()

  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValue(dummyStorage)
  uniqueSlug.mockReturnValue('dummyPath')

  const sourcePath = {
    sourceFilePath: 'http://www.foo.bar/baz/qux?h=1080',
    type: 'base64',
    data: 'data:image/jpeg;base64,Ym9vc3Rub3Rl'
  }

  return systemUnderTest
    .copyAttachment(sourcePath, 'storageKey', 'noteKey')
    .then(function(newFileName) {
      expect(newFileName).toBe('dummyPath.png')
    })
})

it('should replace the all ":storage" path with the actual storage path', function() {
  const storageFolder = systemUnderTest.DESTINATION_FOLDER
  const noteKey = '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c'
  const testInput =
    '<html>\n' +
    '    <head>\n' +
    '        //header\n' +
    '    </head>\n' +
    '    <body data-theme="default">\n' +
    '        <h2 data-line="0" id="Headline">Headline</h2>\n' +
    '        <p data-line="2">\n' +
    '            <img src=":storage' +
    mdurl.encode(path.sep) +
    noteKey +
    mdurl.encode(path.sep) +
    '0.6r4zdgc22xp.png" alt="dummyImage.png" >\n' +
    '        </p>\n' +
    '        <p data-line="4">\n' +
    '            <a href=":storage' +
    mdurl.encode(path.sep) +
    noteKey +
    mdurl.encode(path.sep) +
    '0.q2i4iw0fyx.pdf">dummyPDF.pdf</a>\n' +
    '        </p>\n' +
    '        <p data-line="6">\n' +
    '            <img src=":storage' +
    mdurl.encode(path.sep) +
    noteKey +
    mdurl.encode(path.sep) +
    'd6c5ee92.jpg" alt="dummyImage2.jpg">\n' +
    '        </p>\n' +
    '        <pre class="fence" data-line="8">\n' +
    '            <span class="filename"></span>\n' +
    '            <div class="gallery" data-autoplay="undefined" data-height="undefined">:storage' +
    mdurl.encode(path.win32.sep) +
    noteKey +
    mdurl.encode(path.win32.sep) +
    'f939b2c3.jpg</div>\n' +
    '        </pre>\n' +
    '        <pre class="fence" data-line="10">\n' +
    '            <span class="filename"></span>\n' +
    '            <div class="gallery" data-autoplay="undefined" data-height="undefined">:storage' +
    mdurl.encode(path.posix.sep) +
    noteKey +
    mdurl.encode(path.posix.sep) +
    'f939b2c3.jpg</div>\n' +
    '        </pre>\n' +
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
    '            <img src="file:///' +
    storagePath +
    '/' +
    storageFolder +
    '/' +
    noteKey +
    '/' +
    '0.6r4zdgc22xp.png" alt="dummyImage.png" >\n' +
    '        </p>\n' +
    '        <p data-line="4">\n' +
    '            <a href="file:///' +
    storagePath +
    '/' +
    storageFolder +
    '/' +
    noteKey +
    '/' +
    '0.q2i4iw0fyx.pdf">dummyPDF.pdf</a>\n' +
    '        </p>\n' +
    '        <p data-line="6">\n' +
    '            <img src="file:///' +
    storagePath +
    '/' +
    storageFolder +
    '/' +
    noteKey +
    '/' +
    'd6c5ee92.jpg" alt="dummyImage2.jpg">\n' +
    '        </p>\n' +
    '        <pre class="fence" data-line="8">\n' +
    '            <span class="filename"></span>\n' +
    '            <div class="gallery" data-autoplay="undefined" data-height="undefined">file:///' +
    storagePath +
    '/' +
    storageFolder +
    '/' +
    noteKey +
    '/' +
    'f939b2c3.jpg</div>\n' +
    '        </pre>\n' +
    '        <pre class="fence" data-line="10">\n' +
    '            <span class="filename"></span>\n' +
    '            <div class="gallery" data-autoplay="undefined" data-height="undefined">file:///' +
    storagePath +
    '/' +
    storageFolder +
    '/' +
    noteKey +
    '/' +
    'f939b2c3.jpg</div>\n' +
    '        </pre>\n' +
    '    </body>\n' +
    '</html>'
  const actual = systemUnderTest.fixLocalURLS(testInput, storagePath)
  expect(actual).toEqual(expectedOutput)
})

it('should replace the ":storage" path with the actual storage path when they have different path separators', function() {
  const storageFolder = systemUnderTest.DESTINATION_FOLDER
  const noteKey = '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c'
  const testInput =
    '<html>\n' +
    '    <head>\n' +
    '        //header\n' +
    '    </head>\n' +
    '    <body data-theme="default">\n' +
    '        <h2 data-line="0" id="Headline">Headline</h2>\n' +
    '        <p data-line="2">\n' +
    '            <img src=":storage' +
    mdurl.encode(path.win32.sep) +
    noteKey +
    mdurl.encode(path.win32.sep) +
    '0.6r4zdgc22xp.png" alt="dummyImage.png" >\n' +
    '        </p>\n' +
    '        <p data-line="4">\n' +
    '            <a href=":storage' +
    mdurl.encode(path.posix.sep) +
    noteKey +
    mdurl.encode(path.posix.sep) +
    '0.q2i4iw0fyx.pdf">dummyPDF.pdf</a>\n' +
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
    '            <img src="file:///' +
    storagePath +
    '/' +
    storageFolder +
    '/' +
    noteKey +
    '/' +
    '0.6r4zdgc22xp.png" alt="dummyImage.png" >\n' +
    '        </p>\n' +
    '        <p data-line="4">\n' +
    '            <a href="file:///' +
    storagePath +
    '/' +
    storageFolder +
    '/' +
    noteKey +
    '/' +
    '0.q2i4iw0fyx.pdf">dummyPDF.pdf</a>\n' +
    '        </p>\n' +
    '    </body>\n' +
    '</html>'
  const actual = systemUnderTest.fixLocalURLS(testInput, storagePath)
  expect(actual).toEqual(expectedOutput)
})

it('should test that generateAttachmentMarkdown works correct both with previews and without', function() {
  const fileName = 'fileName'
  const path = 'path'
  let expected = `![${fileName}](${path})`
  let actual = systemUnderTest.generateAttachmentMarkdown(fileName, path, true)
  expect(actual).toEqual(expected)
  expected = `[${fileName}](${path})`
  actual = systemUnderTest.generateAttachmentMarkdown(fileName, path, false)
  expect(actual).toEqual(expected)
})

it('should test that migrateAttachments work when they have different path separators', function() {
  sander.existsSync = jest.fn(() => true)
  const dummyStoragePath = 'dummyStoragePath'
  const imagesPath = path.join(dummyStoragePath, 'images')
  const attachmentsPath = path.join(dummyStoragePath, 'attachments')
  const noteKey = 'noteKey'
  const testInput =
    '"# Test\n' +
    '\n' +
    '![Screenshot1](:storage' +
    path.win32.sep +
    '0.3b88d0dc.png)\n' +
    '![Screenshot2](:storage' +
    path.posix.sep +
    '0.2cb8875c.pdf)"'

  systemUnderTest.migrateAttachments(testInput, dummyStoragePath, noteKey)

  expect(sander.existsSync.mock.calls[0][0]).toBe(imagesPath)
  expect(sander.existsSync.mock.calls[1][0]).toBe(
    path.join(imagesPath, '0.3b88d0dc.png')
  )
  expect(sander.existsSync.mock.calls[2][0]).toBe(
    path.join(attachmentsPath, '0.3b88d0dc.png')
  )
  expect(sander.existsSync.mock.calls[3][0]).toBe(
    path.join(imagesPath, '0.2cb8875c.pdf')
  )
  expect(sander.existsSync.mock.calls[4][0]).toBe(
    path.join(attachmentsPath, '0.2cb8875c.pdf')
  )
})

it('should test that getAttachmentsInMarkdownContent finds all attachments when they have different path separators', function() {
  const testInput =
    '"# Test\n' +
    '\n' +
    '![Screenshot1](:storage' +
    path.win32.sep +
    '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c' +
    path.win32.sep +
    '0.3b88d0dc.png)\n' +
    '![Screenshot2](:storage' +
    path.posix.sep +
    '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c' +
    path.posix.sep +
    '2cb8875c.pdf)\n' +
    '![Screenshot3](:storage' +
    path.win32.sep +
    '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c' +
    path.posix.sep +
    'bbf49b02.jpg)"'

  const actual = systemUnderTest.getAttachmentsInMarkdownContent(testInput)
  const expected = [
    ':storage' +
      path.sep +
      '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c' +
      path.sep +
      '0.3b88d0dc.png',
    ':storage' +
      path.sep +
      '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c' +
      path.sep +
      '2cb8875c.pdf',
    ':storage' +
      path.sep +
      '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c' +
      path.sep +
      'bbf49b02.jpg'
  ]
  expect(actual).toEqual(expect.arrayContaining(expected))
})

it('should test that getAbsolutePathsOfAttachmentsInContent returns all absolute paths', function() {
  const dummyStoragePath = 'dummyStoragePath'
  const noteKey = '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c'
  const testInput =
    '"# Test\n' +
    '\n' +
    '![Screenshot1](:storage' +
    path.win32.sep +
    noteKey +
    path.win32.sep +
    '0.6r4zdgc22xp.png)\n' +
    '![Screenshot2](:storage' +
    path.posix.sep +
    noteKey +
    path.posix.sep +
    '0.q2i4iw0fyx.pdf)\n' +
    '![Screenshot3](:storage' +
    path.win32.sep +
    noteKey +
    path.posix.sep +
    'd6c5ee92.jpg)"'

  const actual = systemUnderTest.getAbsolutePathsOfAttachmentsInContent(
    testInput,
    dummyStoragePath
  )
  const expected = [
    dummyStoragePath +
      path.sep +
      systemUnderTest.DESTINATION_FOLDER +
      path.sep +
      noteKey +
      path.sep +
      '0.6r4zdgc22xp.png',
    dummyStoragePath +
      path.sep +
      systemUnderTest.DESTINATION_FOLDER +
      path.sep +
      noteKey +
      path.sep +
      '0.q2i4iw0fyx.pdf',
    dummyStoragePath +
      path.sep +
      systemUnderTest.DESTINATION_FOLDER +
      path.sep +
      noteKey +
      path.sep +
      'd6c5ee92.jpg'
  ]
  expect(actual).toEqual(expect.arrayContaining(expected))
})

it('should remove the all ":storage" and noteKey references', function() {
  const storageFolder = systemUnderTest.DESTINATION_FOLDER
  const noteKey = 'noteKey'
  const testInput =
    '<html>\n' +
    '    <head>\n' +
    '        //header\n' +
    '    </head>\n' +
    '    <body data-theme="default">\n' +
    '        <h2 data-line="0" id="Headline">Headline</h2>\n' +
    '        <p data-line="2">\n' +
    '            <img src=":storage' +
    mdurl.encode(path.win32.sep) +
    noteKey +
    mdurl.encode(path.win32.sep) +
    '0.6r4zdgc22xp.png" alt="dummyImage.png" >\n' +
    '        </p>\n' +
    '        <p data-line="4">\n' +
    '            <a href=":storage' +
    mdurl.encode(path.posix.sep) +
    noteKey +
    mdurl.encode(path.posix.sep) +
    '0.q2i4iw0fyx.pdf">dummyPDF.pdf</a>\n' +
    '        </p>\n' +
    '        <p data-line="6">\n' +
    '            <img src=":storage' +
    mdurl.encode(path.win32.sep) +
    noteKey +
    mdurl.encode(path.posix.sep) +
    'd6c5ee92.jpg" alt="dummyImage2.jpg">\n' +
    '        </p>\n' +
    '    </body>\n' +
    '</html>'
  const expectedOutput =
    '<html>\n' +
    '    <head>\n' +
    '        //header\n' +
    '    </head>\n' +
    '    <body data-theme="default">\n' +
    '        <h2 data-line="0" id="Headline">Headline</h2>\n' +
    '        <p data-line="2">\n' +
    '            <img src="' +
    storageFolder +
    path.posix.sep +
    '0.6r4zdgc22xp.png" alt="dummyImage.png" >\n' +
    '        </p>\n' +
    '        <p data-line="4">\n' +
    '            <a href="' +
    storageFolder +
    path.posix.sep +
    '0.q2i4iw0fyx.pdf">dummyPDF.pdf</a>\n' +
    '        </p>\n' +
    '        <p data-line="6">\n' +
    '            <img src="' +
    storageFolder +
    path.posix.sep +
    'd6c5ee92.jpg" alt="dummyImage2.jpg">\n' +
    '        </p>\n' +
    '    </body>\n' +
    '</html>'
  const actual = systemUnderTest.removeStorageAndNoteReferences(
    testInput,
    noteKey
  )
  expect(actual).toEqual(expectedOutput)
})

it('should make sure that "removeStorageAndNoteReferences" works with markdown content as well', function() {
  const noteKey = 'noteKey'
  const testInput =
    'Test input' +
    '![imageName](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    noteKey +
    path.win32.sep +
    'image.jpg) \n' +
    '[pdf](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    noteKey +
    path.posix.sep +
    'pdf.pdf)'

  const expectedOutput =
    'Test input' +
    '![imageName](' +
    systemUnderTest.DESTINATION_FOLDER +
    path.posix.sep +
    'image.jpg) \n' +
    '[pdf](' +
    systemUnderTest.DESTINATION_FOLDER +
    path.posix.sep +
    'pdf.pdf)'
  const actual = systemUnderTest.removeStorageAndNoteReferences(
    testInput,
    noteKey
  )
  expect(actual).toEqual(expectedOutput)
})

it('should delete the correct attachment folder if a note is deleted', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  const storageKey = 'storageKey'
  const noteKey = 'noteKey'
  findStorage.findStorage = jest.fn(() => dummyStorage)
  sander.rimrafSync = jest.fn()

  const expectedPathToBeDeleted = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER,
    noteKey
  )
  systemUnderTest.deleteAttachmentFolder(storageKey, noteKey)
  expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
  expect(sander.rimrafSync).toHaveBeenCalledWith(expectedPathToBeDeleted)
})

it('should test that deleteAttachmentsNotPresentInNote deletes all unreferenced attachments ', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  const noteKey = 'noteKey'
  const storageKey = 'storageKey'
  const markdownContent = ''
  const dummyFilesInFolder = ['file1.txt', 'file2.pdf', 'file3.jpg']
  const attachmentFolderPath = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER,
    noteKey
  )

  findStorage.findStorage = jest.fn(() => dummyStorage)
  fs.existsSync = jest.fn(() => true)
  fs.readdir = jest.fn((paht, callback) =>
    callback(undefined, dummyFilesInFolder)
  )
  fs.unlink = jest.fn()

  systemUnderTest.deleteAttachmentsNotPresentInNote(
    markdownContent,
    storageKey,
    noteKey
  )
  expect(fs.existsSync).toHaveBeenLastCalledWith(attachmentFolderPath)
  expect(fs.readdir).toHaveBeenCalledTimes(1)
  expect(fs.readdir.mock.calls[0][0]).toBe(attachmentFolderPath)

  expect(fs.unlink).toHaveBeenCalledTimes(dummyFilesInFolder.length)
  const fsUnlinkCallArguments = []
  for (let i = 0; i < dummyFilesInFolder.length; i++) {
    fsUnlinkCallArguments.push(fs.unlink.mock.calls[i][0])
  }

  dummyFilesInFolder.forEach(function(file) {
    expect(
      fsUnlinkCallArguments.includes(path.join(attachmentFolderPath, file))
    ).toBe(true)
  })
})

it('should test that deleteAttachmentsNotPresentInNote does not delete referenced attachments', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  const noteKey = 'noteKey'
  const storageKey = 'storageKey'
  const dummyFilesInFolder = ['file1.txt', 'file2.pdf', 'file3.jpg']
  const markdownContent = systemUnderTest.generateAttachmentMarkdown(
    'fileLabel',
    path.join(
      systemUnderTest.STORAGE_FOLDER_PLACEHOLDER,
      noteKey,
      dummyFilesInFolder[0]
    ),
    false
  )
  const attachmentFolderPath = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER,
    noteKey
  )

  findStorage.findStorage = jest.fn(() => dummyStorage)
  fs.existsSync = jest.fn(() => true)
  fs.readdir = jest.fn((paht, callback) =>
    callback(undefined, dummyFilesInFolder)
  )
  fs.unlink = jest.fn()

  systemUnderTest.deleteAttachmentsNotPresentInNote(
    markdownContent,
    storageKey,
    noteKey
  )

  expect(fs.unlink).toHaveBeenCalledTimes(dummyFilesInFolder.length - 1)
  const fsUnlinkCallArguments = []
  for (let i = 0; i < dummyFilesInFolder.length - 1; i++) {
    fsUnlinkCallArguments.push(fs.unlink.mock.calls[i][0])
  }
  expect(
    fsUnlinkCallArguments.includes(
      path.join(attachmentFolderPath, dummyFilesInFolder[0])
    )
  ).toBe(false)
})

it('should test that deleteAttachmentsNotPresentInNote does nothing if noteKey, storageKey or noteContent was null', function() {
  const noteKey = null
  const storageKey = null
  const markdownContent = ''

  findStorage.findStorage = jest.fn()
  fs.existsSync = jest.fn()
  fs.readdir = jest.fn()
  fs.unlink = jest.fn()

  systemUnderTest.deleteAttachmentsNotPresentInNote(
    markdownContent,
    storageKey,
    noteKey
  )
  expect(fs.existsSync).not.toHaveBeenCalled()
  expect(fs.readdir).not.toHaveBeenCalled()
  expect(fs.unlink).not.toHaveBeenCalled()
})

it('should test that deleteAttachmentsNotPresentInNote does nothing if noteKey, storageKey or noteContent was undefined', function() {
  const noteKey = undefined
  const storageKey = undefined
  const markdownContent = ''

  findStorage.findStorage = jest.fn()
  fs.existsSync = jest.fn()
  fs.readdir = jest.fn()
  fs.unlink = jest.fn()

  systemUnderTest.deleteAttachmentsNotPresentInNote(
    markdownContent,
    storageKey,
    noteKey
  )
  expect(fs.existsSync).not.toHaveBeenCalled()
  expect(fs.readdir).not.toHaveBeenCalled()
  expect(fs.unlink).not.toHaveBeenCalled()
})

it('should test that getAttachmentsPathAndStatus return null if noteKey, storageKey or noteContent was undefined', function() {
  const noteKey = undefined
  const storageKey = undefined
  const markdownContent = ''

  const result = systemUnderTest.getAttachmentsPathAndStatus(
    markdownContent,
    storageKey,
    noteKey
  )
  expect(result).toBeNull()
})

it('should test that getAttachmentsPathAndStatus return null if noteKey, storageKey or noteContent was null', function() {
  const noteKey = null
  const storageKey = null
  const markdownContent = ''

  const result = systemUnderTest.getAttachmentsPathAndStatus(
    markdownContent,
    storageKey,
    noteKey
  )
  expect(result).toBeNull()
})

it('should test that getAttachmentsPathAndStatus return null if no storage found', function() {
  const noteKey = 'test'
  const storageKey = 'not_exist'
  const markdownContent = ''

  const result = systemUnderTest.getAttachmentsPathAndStatus(
    markdownContent,
    storageKey,
    noteKey
  )
  expect(result).toBeNull()
})

it('should test that getAttachmentsPathAndStatus return the correct path and status for attachments', async function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  const noteKey = 'noteKey'
  const storageKey = 'storageKey'
  const markdownContent =
    'Test input' +
    '![' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    noteKey +
    path.win32.sep +
    'file2.pdf](file2.pdf) \n'
  const dummyFilesInFolder = ['file1.txt', 'file2.pdf', 'file3.jpg']

  findStorage.findStorage = jest.fn(() => dummyStorage)
  fs.existsSync = jest.fn(() => true)
  fs.readdir = jest.fn((paht, callback) =>
    callback(undefined, dummyFilesInFolder)
  )
  fs.unlink = jest.fn()

  const targetStorage = findStorage.findStorage(storageKey)

  const attachments = await systemUnderTest.getAttachmentsPathAndStatus(
    markdownContent,
    storageKey,
    noteKey
  )
  expect(attachments.length).toBe(3)
  expect(attachments[0].isInUse).toBe(false)
  expect(attachments[1].isInUse).toBe(true)
  expect(attachments[2].isInUse).toBe(false)

  expect(attachments[0].path).toBe(
    path.join(
      targetStorage.path,
      systemUnderTest.DESTINATION_FOLDER,
      noteKey,
      dummyFilesInFolder[0]
    )
  )
  expect(attachments[1].path).toBe(
    path.join(
      targetStorage.path,
      systemUnderTest.DESTINATION_FOLDER,
      noteKey,
      dummyFilesInFolder[1]
    )
  )
  expect(attachments[2].path).toBe(
    path.join(
      targetStorage.path,
      systemUnderTest.DESTINATION_FOLDER,
      noteKey,
      dummyFilesInFolder[2]
    )
  )
})

it('should test that moveAttachments moves attachments only if the source folder existed', function() {
  fse.existsSync = jest.fn(() => false)
  fse.moveSync = jest.fn()

  const oldPath = 'oldPath'
  const newPath = 'newPath'
  const oldNoteKey = 'oldNoteKey'
  const newNoteKey = 'newNoteKey'
  const content = ''

  const expectedSource = path.join(
    oldPath,
    systemUnderTest.DESTINATION_FOLDER,
    oldNoteKey
  )

  systemUnderTest.moveAttachments(
    oldPath,
    newPath,
    oldNoteKey,
    newNoteKey,
    content
  )
  expect(fse.existsSync).toHaveBeenCalledWith(expectedSource)
  expect(fse.moveSync).not.toHaveBeenCalled()
})

it('should test that moveAttachments moves attachments to the right destination', function() {
  fse.existsSync = jest.fn(() => true)
  fse.moveSync = jest.fn()

  const oldPath = 'oldPath'
  const newPath = 'newPath'
  const oldNoteKey = 'oldNoteKey'
  const newNoteKey = 'newNoteKey'
  const content = ''

  const expectedSource = path.join(
    oldPath,
    systemUnderTest.DESTINATION_FOLDER,
    oldNoteKey
  )
  const expectedDestination = path.join(
    newPath,
    systemUnderTest.DESTINATION_FOLDER,
    newNoteKey
  )

  systemUnderTest.moveAttachments(
    oldPath,
    newPath,
    oldNoteKey,
    newNoteKey,
    content
  )
  expect(fse.existsSync).toHaveBeenCalledWith(expectedSource)
  expect(fse.moveSync).toHaveBeenCalledWith(expectedSource, expectedDestination)
})

it('should test that moveAttachments returns a correct modified content version', function() {
  fse.existsSync = jest.fn()
  fse.moveSync = jest.fn()

  const oldPath = 'oldPath'
  const newPath = 'newPath'
  const oldNoteKey = 'oldNoteKey'
  const newNoteKey = 'newNoteKey'
  const testInput =
    'Test input' +
    '![' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    oldNoteKey +
    path.win32.sep +
    'image.jpg](imageName}) \n' +
    '[' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    oldNoteKey +
    path.posix.sep +
    'pdf.pdf](pdf})'
  const expectedOutput =
    'Test input' +
    '![' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.sep +
    newNoteKey +
    path.sep +
    'image.jpg](imageName}) \n' +
    '[' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.sep +
    newNoteKey +
    path.sep +
    'pdf.pdf](pdf})'

  const actualContent = systemUnderTest.moveAttachments(
    oldPath,
    newPath,
    oldNoteKey,
    newNoteKey,
    testInput
  )
  expect(actualContent).toBe(expectedOutput)
})

it('should test that cloneAttachments modifies the content of the new note correctly', function() {
  const oldNote = {
    key: 'oldNoteKey',
    content: 'oldNoteContent',
    storage: 'storageKey',
    type: 'MARKDOWN_NOTE'
  }
  const newNote = {
    key: 'newNoteKey',
    content: 'oldNoteContent',
    storage: 'storageKey',
    type: 'MARKDOWN_NOTE'
  }
  const testInput =
    'Test input' +
    '![' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    oldNote.key +
    path.win32.sep +
    'image.jpg](imageName}) \n' +
    '[' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    oldNote.key +
    path.posix.sep +
    'pdf.pdf](pdf})'
  newNote.content = testInput
  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValue({ path: 'dummyStoragePath' })

  const expectedOutput =
    'Test input' +
    '![' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.sep +
    newNote.key +
    path.sep +
    'image.jpg](imageName}) \n' +
    '[' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.sep +
    newNote.key +
    path.sep +
    'pdf.pdf](pdf})'
  systemUnderTest.cloneAttachments(oldNote, newNote)

  expect(newNote.content).toBe(expectedOutput)
})

it('should test that cloneAttachments finds all attachments and copies them to the new location', function() {
  const storagePathOld = 'storagePathOld'
  const storagePathNew = 'storagePathNew'
  const dummyStorageOld = { path: storagePathOld }
  const dummyStorageNew = { path: storagePathNew }
  const oldNote = {
    key: 'oldNoteKey',
    content: 'oldNoteContent',
    storage: 'storageKeyOldNote',
    type: 'MARKDOWN_NOTE'
  }
  const newNote = {
    key: 'newNoteKey',
    content: 'oldNoteContent',
    storage: 'storageKeyNewNote',
    type: 'MARKDOWN_NOTE'
  }
  const testInput =
    'Test input' +
    '![' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    oldNote.key +
    path.win32.sep +
    'image.jpg](imageName}) \n' +
    '[' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    oldNote.key +
    path.posix.sep +
    'pdf.pdf](pdf})'
  oldNote.content = testInput
  newNote.content = testInput

  const copyFileSyncResp = { to: jest.fn() }
  sander.copyFileSync = jest.fn()
  sander.copyFileSync.mockReturnValue(copyFileSyncResp)
  findStorage.findStorage = jest.fn()
  findStorage.findStorage.mockReturnValueOnce(dummyStorageOld)
  findStorage.findStorage.mockReturnValue(dummyStorageNew)

  const pathAttachmentOneFrom = path.join(
    storagePathOld,
    systemUnderTest.DESTINATION_FOLDER,
    oldNote.key,
    'image.jpg'
  )
  const pathAttachmentOneTo = path.join(
    storagePathNew,
    systemUnderTest.DESTINATION_FOLDER,
    newNote.key,
    'image.jpg'
  )

  const pathAttachmentTwoFrom = path.join(
    storagePathOld,
    systemUnderTest.DESTINATION_FOLDER,
    oldNote.key,
    'pdf.pdf'
  )
  const pathAttachmentTwoTo = path.join(
    storagePathNew,
    systemUnderTest.DESTINATION_FOLDER,
    newNote.key,
    'pdf.pdf'
  )

  systemUnderTest.cloneAttachments(oldNote, newNote)

  expect(findStorage.findStorage).toHaveBeenCalledWith(oldNote.storage)
  expect(findStorage.findStorage).toHaveBeenCalledWith(newNote.storage)
  expect(sander.copyFileSync).toHaveBeenCalledTimes(2)
  expect(copyFileSyncResp.to).toHaveBeenCalledTimes(2)
  expect(sander.copyFileSync.mock.calls[0][0]).toBe(pathAttachmentOneFrom)
  expect(copyFileSyncResp.to.mock.calls[0][0]).toBe(pathAttachmentOneTo)
  expect(sander.copyFileSync.mock.calls[1][0]).toBe(pathAttachmentTwoFrom)
  expect(copyFileSyncResp.to.mock.calls[1][0]).toBe(pathAttachmentTwoTo)
})

it('should test that cloneAttachments finds all attachments and copies them to the new location', function() {
  const oldNote = {
    key: 'oldNoteKey',
    content: 'oldNoteContent',
    storage: 'storageKeyOldNote',
    type: 'SOMETHING_ELSE'
  }
  const newNote = {
    key: 'newNoteKey',
    content: 'oldNoteContent',
    storage: 'storageKeyNewNote',
    type: 'SOMETHING_ELSE'
  }
  const testInput = 'Test input'
  oldNote.content = testInput
  newNote.content = testInput

  sander.copyFileSync = jest.fn()
  findStorage.findStorage = jest.fn()

  systemUnderTest.cloneAttachments(oldNote, newNote)

  expect(findStorage.findStorage).not.toHaveBeenCalled()
  expect(sander.copyFileSync).not.toHaveBeenCalled()
})

it('should test that isAttachmentLink works correctly', function() {
  expect(systemUnderTest.isAttachmentLink('text')).toBe(false)
  expect(systemUnderTest.isAttachmentLink('text [linkText](link)')).toBe(false)
  expect(systemUnderTest.isAttachmentLink('text ![linkText](link)')).toBe(false)
  expect(
    systemUnderTest.isAttachmentLink(
      '[linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.win32.sep +
        'noteKey' +
        path.win32.sep +
        'pdf.pdf)'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      '![linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.win32.sep +
        'noteKey' +
        path.win32.sep +
        'pdf.pdf )'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      'text [ linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.win32.sep +
        'noteKey' +
        path.win32.sep +
        'pdf.pdf)'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      'text ![linkText ](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.win32.sep +
        'noteKey' +
        path.win32.sep +
        'pdf.pdf)'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      '[linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.win32.sep +
        'noteKey' +
        path.win32.sep +
        'pdf.pdf) test'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      '![linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.win32.sep +
        'noteKey' +
        path.win32.sep +
        'pdf.pdf) test'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      'text [linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.win32.sep +
        'noteKey' +
        path.win32.sep +
        'pdf.pdf) test'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      'text ![linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.win32.sep +
        'noteKey' +
        path.win32.sep +
        'pdf.pdf) test'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      '[linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.posix.sep +
        'noteKey' +
        path.posix.sep +
        'pdf.pdf)'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      '![linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.posix.sep +
        'noteKey' +
        path.posix.sep +
        'pdf.pdf )'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      'text [ linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.posix.sep +
        'noteKey' +
        path.posix.sep +
        'pdf.pdf)'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      'text ![linkText ](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.posix.sep +
        'noteKey' +
        path.posix.sep +
        'pdf.pdf)'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      '[linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.posix.sep +
        'noteKey' +
        path.posix.sep +
        'pdf.pdf) test'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      '![linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.posix.sep +
        'noteKey' +
        path.posix.sep +
        'pdf.pdf) test'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      'text [linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.posix.sep +
        'noteKey' +
        path.posix.sep +
        'pdf.pdf) test'
    )
  ).toBe(true)
  expect(
    systemUnderTest.isAttachmentLink(
      'text ![linkText](' +
        systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
        path.posix.sep +
        'noteKey' +
        path.posix.sep +
        'pdf.pdf) test'
    )
  ).toBe(true)
})

it('should test that handleAttachmentLinkPaste copies the attachments to the new location', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    pastedNoteKey +
    path.posix.sep +
    'pdf.pdf)'
  const storageKey = 'storageKey'
  const expectedSourceFilePath = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER,
    pastedNoteKey,
    'pdf.pdf'
  )

  sander.exists = jest.fn(() => Promise.resolve(true))
  systemUnderTest.copyAttachment = jest.fn(() =>
    Promise.resolve('dummyNewFileName')
  )

  return systemUnderTest
    .handleAttachmentLinkPaste(storageKey, newNoteKey, pasteText)
    .then(() => {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePath)
      expect(systemUnderTest.copyAttachment).toHaveBeenCalledWith(
        expectedSourceFilePath,
        storageKey,
        newNoteKey
      )
    })
})

it('should test that handleAttachmentLinkPaste copies the attachments to the new location - win32 path', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    pastedNoteKey +
    path.win32.sep +
    'pdf.pdf)'
  const storageKey = 'storageKey'
  const expectedSourceFilePath = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER,
    pastedNoteKey,
    'pdf.pdf'
  )

  sander.exists = jest.fn(() => Promise.resolve(true))
  systemUnderTest.copyAttachment = jest.fn(() =>
    Promise.resolve('dummyNewFileName')
  )

  return systemUnderTest
    .handleAttachmentLinkPaste(storageKey, newNoteKey, pasteText)
    .then(() => {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePath)
      expect(systemUnderTest.copyAttachment).toHaveBeenCalledWith(
        expectedSourceFilePath,
        storageKey,
        newNoteKey
      )
    })
})

it("should test that handleAttachmentLinkPaste don't try to copy the file if it does not exist - win32 path", function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    pastedNoteKey +
    path.win32.sep +
    'pdf.pdf)'
  const storageKey = 'storageKey'
  const expectedSourceFilePath = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER,
    pastedNoteKey,
    'pdf.pdf'
  )

  sander.exists = jest.fn(() => Promise.resolve(false))
  systemUnderTest.copyAttachment = jest.fn()
  systemUnderTest.generateFileNotFoundMarkdown = jest.fn()

  return systemUnderTest
    .handleAttachmentLinkPaste(storageKey, newNoteKey, pasteText)
    .then(() => {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePath)
      expect(systemUnderTest.copyAttachment).not.toHaveBeenCalled()
    })
})

it("should test that handleAttachmentLinkPaste don't try to copy the file if it does not exist -- posix", function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    pastedNoteKey +
    path.posix.sep +
    'pdf.pdf)'
  const storageKey = 'storageKey'
  const expectedSourceFilePath = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER,
    pastedNoteKey,
    'pdf.pdf'
  )

  sander.exists = jest.fn(() => Promise.resolve(false))
  systemUnderTest.copyAttachment = jest.fn()
  systemUnderTest.generateFileNotFoundMarkdown = jest.fn()

  return systemUnderTest
    .handleAttachmentLinkPaste(storageKey, newNoteKey, pasteText)
    .then(() => {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePath)
      expect(systemUnderTest.copyAttachment).not.toHaveBeenCalled()
    })
})

it('should test that handleAttachmentLinkPaste copies multiple attachments if multiple were pasted', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    pastedNoteKey +
    path.posix.sep +
    'pdf.pdf) ..' +
    '![secondAttachment](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    pastedNoteKey +
    path.win32.sep +
    'img.jpg)'
  const storageKey = 'storageKey'
  const expectedSourceFilePathOne = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER,
    pastedNoteKey,
    'pdf.pdf'
  )
  const expectedSourceFilePathTwo = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER,
    pastedNoteKey,
    'img.jpg'
  )

  sander.exists = jest.fn(() => Promise.resolve(true))
  systemUnderTest.copyAttachment = jest.fn(() =>
    Promise.resolve('dummyNewFileName')
  )

  return systemUnderTest
    .handleAttachmentLinkPaste(storageKey, newNoteKey, pasteText)
    .then(() => {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePathOne)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePathTwo)
      expect(systemUnderTest.copyAttachment).toHaveBeenCalledWith(
        expectedSourceFilePathOne,
        storageKey,
        newNoteKey
      )
      expect(systemUnderTest.copyAttachment).toHaveBeenCalledWith(
        expectedSourceFilePathTwo,
        storageKey,
        newNoteKey
      )
    })
})

it('should test that handleAttachmentLinkPaste returns the correct modified paste text', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const dummyNewFileName = 'dummyNewFileName'
  const pasteText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    pastedNoteKey +
    path.win32.sep +
    'pdf.pdf)'
  const expectedText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.sep +
    newNoteKey +
    path.sep +
    dummyNewFileName +
    ')'
  const storageKey = 'storageKey'

  sander.exists = jest.fn(() => Promise.resolve(true))
  systemUnderTest.copyAttachment = jest.fn(() =>
    Promise.resolve(dummyNewFileName)
  )

  return systemUnderTest
    .handleAttachmentLinkPaste(storageKey, newNoteKey, pasteText)
    .then(returnedPastedText => {
      expect(returnedPastedText).toBe(expectedText)
    })
})

it('should test that handleAttachmentLinkPaste returns the correct modified paste text if multiple links are posted', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const dummyNewFileNameOne = 'dummyNewFileName'
  const dummyNewFileNameTwo = 'dummyNewFileNameTwo'
  const pasteText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    pastedNoteKey +
    path.win32.sep +
    'pdf.pdf) ' +
    '![secondImage](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    pastedNoteKey +
    path.posix.sep +
    'img.jpg)'
  const expectedText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.sep +
    newNoteKey +
    path.sep +
    dummyNewFileNameOne +
    ') ' +
    '![secondImage](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.sep +
    newNoteKey +
    path.sep +
    dummyNewFileNameTwo +
    ')'
  const storageKey = 'storageKey'

  sander.exists = jest.fn(() => Promise.resolve(true))
  systemUnderTest.copyAttachment = jest.fn()
  systemUnderTest.copyAttachment.mockReturnValueOnce(
    Promise.resolve(dummyNewFileNameOne)
  )
  systemUnderTest.copyAttachment.mockReturnValue(
    Promise.resolve(dummyNewFileNameTwo)
  )

  return systemUnderTest
    .handleAttachmentLinkPaste(storageKey, newNoteKey, pasteText)
    .then(returnedPastedText => {
      expect(returnedPastedText).toBe(expectedText)
    })
})

it('should test that handleAttachmentLinkPaste calls the copy method correct if multiple links are posted where one file was found and one was not', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    pastedNoteKey +
    path.posix.sep +
    'pdf.pdf) ..' +
    '![secondAttachment](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    pastedNoteKey +
    path.win32.sep +
    'img.jpg)'
  const storageKey = 'storageKey'
  const expectedSourceFilePathOne = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER,
    pastedNoteKey,
    'pdf.pdf'
  )
  const expectedSourceFilePathTwo = path.join(
    dummyStorage.path,
    systemUnderTest.DESTINATION_FOLDER,
    pastedNoteKey,
    'img.jpg'
  )

  sander.exists = jest.fn()
  sander.exists.mockReturnValueOnce(Promise.resolve(false))
  sander.exists.mockReturnValue(Promise.resolve(true))
  systemUnderTest.copyAttachment = jest.fn(() =>
    Promise.resolve('dummyNewFileName')
  )
  systemUnderTest.generateFileNotFoundMarkdown = jest.fn()

  return systemUnderTest
    .handleAttachmentLinkPaste(storageKey, newNoteKey, pasteText)
    .then(() => {
      expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePathOne)
      expect(sander.exists).toHaveBeenCalledWith(expectedSourceFilePathTwo)
      expect(systemUnderTest.copyAttachment).toHaveBeenCalledTimes(1)
      expect(systemUnderTest.copyAttachment).toHaveBeenCalledWith(
        expectedSourceFilePathTwo,
        storageKey,
        newNoteKey
      )
    })
})

it('should test that handleAttachmentLinkPaste returns the correct modified paste text if the file was not found', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText =
    'text ![alt.png](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    pastedNoteKey +
    path.posix.sep +
    'pdf.pdf)'
  const storageKey = 'storageKey'
  const fileNotFoundMD = 'file not found'
  const expectedPastText = 'text ' + fileNotFoundMD

  systemUnderTest.generateFileNotFoundMarkdown = jest.fn(() => fileNotFoundMD)
  sander.exists = jest.fn(() => Promise.resolve(false))

  return systemUnderTest
    .handleAttachmentLinkPaste(storageKey, newNoteKey, pasteText)
    .then(returnedPastedText => {
      expect(returnedPastedText).toBe(expectedPastText)
    })
})

it('should test that handleAttachmentLinkPaste returns the correct modified paste text if multiple files were not found', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const pasteText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    pastedNoteKey +
    path.win32.sep +
    'pdf.pdf) ' +
    '![secondImage](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    pastedNoteKey +
    path.posix.sep +
    'img.jpg)'
  const storageKey = 'storageKey'
  const fileNotFoundMD = 'file not found'
  const expectedPastText = 'text ' + fileNotFoundMD + ' ' + fileNotFoundMD
  systemUnderTest.generateFileNotFoundMarkdown = jest.fn(() => fileNotFoundMD)

  sander.exists = jest.fn(() => Promise.resolve(false))

  return systemUnderTest
    .handleAttachmentLinkPaste(storageKey, newNoteKey, pasteText)
    .then(returnedPastedText => {
      expect(returnedPastedText).toBe(expectedPastText)
    })
})

it('should test that handleAttachmentLinkPaste returns the correct modified paste text if one file was found and one was not found', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const dummyFoundFileName = 'dummyFileName'
  const fileNotFoundMD = 'file not found'
  const pasteText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    pastedNoteKey +
    path.win32.sep +
    'pdf.pdf) .. ' +
    '![secondAttachment](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    pastedNoteKey +
    path.posix.sep +
    'img.jpg)'
  const storageKey = 'storageKey'
  const expectedPastText =
    'text ' +
    fileNotFoundMD +
    ' .. ![secondAttachment](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.sep +
    newNoteKey +
    path.sep +
    dummyFoundFileName +
    ')'

  sander.exists = jest.fn()
  sander.exists.mockReturnValueOnce(Promise.resolve(false))
  sander.exists.mockReturnValue(Promise.resolve(true))
  systemUnderTest.copyAttachment = jest.fn(() =>
    Promise.resolve(dummyFoundFileName)
  )
  systemUnderTest.generateFileNotFoundMarkdown = jest.fn(() => fileNotFoundMD)

  return systemUnderTest
    .handleAttachmentLinkPaste(storageKey, newNoteKey, pasteText)
    .then(returnedPastedText => {
      expect(returnedPastedText).toBe(expectedPastText)
    })
})

it('should test that handleAttachmentLinkPaste returns the correct modified paste text if one file was found and one was not found', function() {
  const dummyStorage = { path: 'dummyStoragePath' }
  findStorage.findStorage = jest.fn(() => dummyStorage)
  const pastedNoteKey = 'b1e06f81-8266-49b9-b438-084003c2e723'
  const newNoteKey = 'abc234-8266-49b9-b438-084003c2e723'
  const dummyFoundFileName = 'dummyFileName'
  const fileNotFoundMD = 'file not found'
  const pasteText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.posix.sep +
    pastedNoteKey +
    path.posix.sep +
    'pdf.pdf) .. ' +
    '![secondAttachment](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.win32.sep +
    pastedNoteKey +
    path.win32.sep +
    'img.jpg)'
  const storageKey = 'storageKey'
  const expectedPastText =
    'text ![alt](' +
    systemUnderTest.STORAGE_FOLDER_PLACEHOLDER +
    path.sep +
    newNoteKey +
    path.sep +
    dummyFoundFileName +
    ') .. ' +
    fileNotFoundMD

  sander.exists = jest.fn()
  sander.exists.mockReturnValueOnce(Promise.resolve(true))
  sander.exists.mockReturnValue(Promise.resolve(false))
  systemUnderTest.copyAttachment = jest.fn(() =>
    Promise.resolve(dummyFoundFileName)
  )
  systemUnderTest.generateFileNotFoundMarkdown = jest.fn(() => fileNotFoundMD)

  return systemUnderTest
    .handleAttachmentLinkPaste(storageKey, newNoteKey, pasteText)
    .then(returnedPastedText => {
      expect(returnedPastedText).toBe(expectedPastText)
    })
})
