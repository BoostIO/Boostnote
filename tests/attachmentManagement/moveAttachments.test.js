const path = require('path')
const fse = require('fs-extra')
const constant = require('browser/main/lib/attachmentManagement/constant')
const methodUnderTest = require('browser/main/lib/attachmentManagement/moveAttachments')

it('should test that moveAttachments moves attachments only if the source folder existed', function () {
  fse.existsSync = jest.fn(() => false)
  fse.moveSync = jest.fn()

  const oldPath = 'oldPath'
  const newPath = 'newPath'
  const oldNoteKey = 'oldNoteKey'
  const newNoteKey = 'newNoteKey'
  const content = ''

  const expectedSource = path.join(oldPath, constant.DESTINATION_FOLDER, oldNoteKey)

  methodUnderTest(oldPath, newPath, oldNoteKey, newNoteKey, content)
  expect(fse.existsSync).toHaveBeenCalledWith(expectedSource)
  expect(fse.moveSync).not.toHaveBeenCalled()
})

it('should test that moveAttachments moves attachments to the right destination', function () {
  fse.existsSync = jest.fn(() => true)
  fse.moveSync = jest.fn()

  const oldPath = 'oldPath'
  const newPath = 'newPath'
  const oldNoteKey = 'oldNoteKey'
  const newNoteKey = 'newNoteKey'
  const content = ''

  const expectedSource = path.join(oldPath, constant.DESTINATION_FOLDER, oldNoteKey)
  const expectedDestination = path.join(newPath, constant.DESTINATION_FOLDER, newNoteKey)

  methodUnderTest(oldPath, newPath, oldNoteKey, newNoteKey, content)
  expect(fse.existsSync).toHaveBeenCalledWith(expectedSource)
  expect(fse.moveSync).toHaveBeenCalledWith(expectedSource, expectedDestination)
})

it('should test that moveAttachments returns a correct modified content version', function () {
  fse.existsSync = jest.fn()
  fse.moveSync = jest.fn()

  const oldPath = 'oldPath'
  const newPath = 'newPath'
  const oldNoteKey = 'oldNoteKey'
  const newNoteKey = 'newNoteKey'
  const testInput =
    'Test input' +
    '![' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + oldNoteKey + path.sep + 'image.jpg](imageName}) \n' +
    '[' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + oldNoteKey + path.sep + 'pdf.pdf](pdf})'
  const expectedOutput =
    'Test input' +
    '![' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + newNoteKey + path.sep + 'image.jpg](imageName}) \n' +
    '[' + constant.STORAGE_FOLDER_PLACEHOLDER + path.sep + newNoteKey + path.sep + 'pdf.pdf](pdf})'

  const actualContent = methodUnderTest(oldPath, newPath, oldNoteKey, newNoteKey, testInput)
  expect(actualContent).toBe(expectedOutput)
})
