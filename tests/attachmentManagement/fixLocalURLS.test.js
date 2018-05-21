const mdurl = require('mdurl')
const path = require('path')
const constant = require('browser/main/lib/attachmentManagement/constant')
const methodUnderTest = require('browser/main/lib/attachmentManagement/fixLocalURLS')

it('should replace the all ":storage" path with the actual storage path', function () {
  const storageFolder = constant.DESTINATION_FOLDER
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
    '            <img src="file:///' + storagePath + path.sep + storageFolder + path.sep + '0.6r4zdgc22xp.png" alt="dummyImage.png" >\n' +
    '        </p>\n' +
    '        <p data-line="4">\n' +
    '            <a href="file:///' + storagePath + path.sep + storageFolder + path.sep + '0.q2i4iw0fyx.pdf">dummyPDF.pdf</a>\n' +
    '        </p>\n' +
    '        <p data-line="6">\n' +
    '            <img src="file:///' + storagePath + path.sep + storageFolder + path.sep + 'd6c5ee92.jpg" alt="dummyImage2.jpg">\n' +
    '        </p>\n' +
    '    </body>\n' +
    '</html>'
  const actual = methodUnderTest(testInput, storagePath)
  expect(actual).toEqual(expectedOutput)
})
