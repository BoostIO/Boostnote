const methodUnderTest = require('browser/main/lib/attachmentManagement/generateAttachmentMarkdown')

it('should test that generateAttachmentMarkdown works correct both with previews and without', function () {
  const fileName = 'fileName'
  const path = 'path'
  let expected = `![${fileName}](${path})`
  let actual = methodUnderTest(fileName, path, true)
  expect(actual).toEqual(expected)
  expected = `[${fileName}](${path})`
  actual = methodUnderTest(fileName, path, false)
  expect(actual).toEqual(expected)
})
