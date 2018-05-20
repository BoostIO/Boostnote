const sander = require('sander')
const path = require('path')
const findStorage = require('browser/lib/findStorage')
const constant = require('browser/main/lib/attachmentManagement/constant')
const methodUnderTest = require('browser/main/lib/attachmentManagement/deleteAttachmentFolder')

it('should delete the correct attachment folder if a note is deleted', function () {
  const dummyStorage = {path: 'dummyStoragePath'}
  const storageKey = 'storageKey'
  const noteKey = 'noteKey'
  findStorage.findStorage = jest.fn(() => dummyStorage)
  sander.rimrafSync = jest.fn()

  const expectedPathToBeDeleted = path.join(dummyStorage.path, constant.DESTINATION_FOLDER, noteKey)
  methodUnderTest(storageKey, noteKey)
  expect(findStorage.findStorage).toHaveBeenCalledWith(storageKey)
  expect(sander.rimrafSync).toHaveBeenCalledWith(expectedPathToBeDeleted)
})
