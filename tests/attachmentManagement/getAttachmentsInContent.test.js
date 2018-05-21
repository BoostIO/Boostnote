const mdurl = require('mdurl')
const path = require('path')
const methodUnderTest = require('browser/main/lib/attachmentManagement/getAttachmentsInContent')

it('should test that getAttachmentsInContent finds all attachments', function () {
  const testInput =
    '<html>\n' +
    '    <head>\n' +
    '        //header\n' +
    '    </head>\n' +
    '    <body data-theme="default">\n' +
    '        <h2 data-line="0" id="Headline">Headline</h2>\n' +
    '        <p data-line="2">\n' +
    '            <img src=":storage' + mdurl.encode(path.sep) + '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c' + mdurl.encode(path.sep) + '0.6r4zdgc22xp.png" alt="dummyImage.png" >\n' +
    '        </p>\n' +
    '        <p data-line="4">\n' +
    '            <a href=":storage' + mdurl.encode(path.sep) + '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c' + mdurl.encode(path.sep) + '0.q2i4iw0fyx.pdf">dummyPDF.pdf</a>\n' +
    '        </p>\n' +
    '        <p data-line="6">\n' +
    '            <img src=":storage' + mdurl.encode(path.sep) + '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c' + mdurl.encode(path.sep) + 'd6c5ee92.jpg" alt="dummyImage2.jpg">\n' +
    '        </p>\n' +
    '    </body>\n' +
    '</html>'
  const actual = methodUnderTest(testInput)
  const expected = [':storage' + path.sep + '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c' + path.sep + '0.6r4zdgc22xp', ':storage' + path.sep + '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c' + path.sep + '0.q2i4iw0fyx', ':storage' + path.sep + '9c9c4ba3-bc1e-441f-9866-c1e9a806e31c' + path.sep + 'd6c5ee92.jpg']
  expect(actual).toEqual(expect.arrayContaining(expected))
})
