const Typo = require('typo-js')
const CodeMirror = require('codemirror')
jest.mock('typo-js')

const systemUnderTest = require('browser/lib/spellcheck')

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  Typo.mockClear()
})

it('should test that checkWord does not marks words that do not contain a typo', function() {
  const testWord = 'testWord'
  const editor = jest.fn()
  editor.getRange = jest.fn(() => testWord)
  editor.markText = jest.fn()
  const range = { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 10 } }
  const mockDictionary = jest.fn()
  mockDictionary.check = jest.fn(() => true)
  systemUnderTest.setDictionaryForTestsOnly(mockDictionary)

  systemUnderTest.checkWord(editor, range)

  expect(editor.getRange).toHaveBeenCalledWith(range.anchor, range.head)
  expect(mockDictionary.check).toHaveBeenCalledWith(testWord)
  expect(editor.markText).not.toHaveBeenCalled()
})

it('should test that checkWord should marks words that contain a typo', function() {
  const testWord = 'testWord'
  const editor = jest.fn()
  editor.getRange = jest.fn(() => testWord)
  editor.markText = jest.fn()
  const range = { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 10 } }
  const mockDictionary = jest.fn()
  mockDictionary.check = jest.fn(() => false)
  systemUnderTest.setDictionaryForTestsOnly(mockDictionary)

  systemUnderTest.checkWord(editor, range)

  expect(editor.getRange).toHaveBeenCalledWith(range.anchor, range.head)
  expect(mockDictionary.check).toHaveBeenCalledWith(testWord)
  expect(editor.markText).toHaveBeenCalledWith(range.anchor, range.head, {
    className: systemUnderTest.CSS_ERROR_CLASS
  })
})

it('should test that setLanguage clears all marks', function() {
  const dummyMarks = [
    { clear: jest.fn() },
    { clear: jest.fn() },
    { clear: jest.fn() }
  ]
  const editor = jest.fn()
  editor.getAllMarks = jest.fn(() => dummyMarks)

  systemUnderTest.setLanguage(editor, systemUnderTest.SPELLCHECK_DISABLED)

  expect(editor.getAllMarks).toHaveBeenCalled()
  for (const dummyMark of dummyMarks) {
    expect(dummyMark.clear).toHaveBeenCalled()
  }
})

it('should test that setLanguage with DISABLED as a lang argument should not load any dictionary and not check the whole document', function() {
  const editor = jest.fn()
  editor.getAllMarks = jest.fn(() => [])
  const checkWholeDocumentSpy = jest
    .spyOn(systemUnderTest, 'checkWholeDocument')
    .mockImplementation()

  systemUnderTest.setLanguage(editor, systemUnderTest.SPELLCHECK_DISABLED)

  expect(Typo).not.toHaveBeenCalled()
  expect(checkWholeDocumentSpy).not.toHaveBeenCalled()
  checkWholeDocumentSpy.mockRestore()
})

it('should test that setLanguage loads the correct dictionary', function() {
  const editor = jest.fn()
  editor.getAllMarks = jest.fn(() => [])
  const lang = 'de_DE'
  const checkWholeDocumentSpy = jest
    .spyOn(systemUnderTest, 'checkWholeDocument')
    .mockImplementation()

  expect(Typo).not.toHaveBeenCalled()
  systemUnderTest.setLanguage(editor, lang)

  expect(Typo).toHaveBeenCalledWith(lang, false, false, expect.anything())
  expect(Typo.mock.calls[0][3].dictionaryPath).toEqual(
    systemUnderTest.DICTIONARY_PATH
  )
  expect(Typo.mock.calls[0][3].asyncLoad).toBe(true)
  checkWholeDocumentSpy.mockRestore()
})

it('should test that checkMultiLineRange performs checks for each word in the stated range', function() {
  const dic = jest.fn()
  dic.check = jest.fn()
  systemUnderTest.setDictionaryForTestsOnly(dic)
  document.body.createTextRange = jest.fn(() =>
    document.createElement('textArea')
  )
  const editor = new CodeMirror(jest.fn())
  editor.setValue(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vehicula sem id tempor sollicitudin. Sed eu sagittis ligula. Maecenas sit amet velit enim. Etiam massa urna, elementum et sapien sit amet, vestibulum pharetra lectus. Nulla consequat malesuada nunc in aliquam. Vivamus faucibus orci et faucibus maximus. Pellentesque at dolor ac mi mollis molestie in facilisis nisl.\n' +
      '\n' +
      'Nam id lacus et elit sollicitudin vestibulum. Phasellus blandit laoreet odio \n' +
      'Ut tristique risus et mi tristique, in aliquam odio laoreet. Curabitur nunc felis, mollis ut laoreet quis, finibus in nibh. Proin urna risus, rhoncus at diam interdum, maximus vestibulum nulla. Maecenas ut rutrum nulla, vel finibus est. Etiam placerat mi et libero volutpat, tristique rhoncus felis volutpat. Donec quam erat, congue quis ligula eget, mollis aliquet elit. Vestibulum feugiat odio sit amet ex dignissim, sit amet vulputate lectus iaculis. Sed tempus id enim at eleifend. Nullam bibendum eleifend congue. Pellentesque varius arcu elit, at accumsan dolor ultrices vitae. Etiam condimentum lectus id dolor fringilla tempor. Aliquam nec fringilla sem. Fusce ac quam porta, molestie nunc sed, semper nisl. Curabitur luctus sem in dapibus gravida. Suspendisse scelerisque mollis rutrum. Proin lacinia dolor sit amet ornare condimentum.\n' +
      '\n' +
      'In ex neque, volutpat quis ullamcorper in, vestibulum vel ligula. Quisque lobortis eget neque quis ullamcorper. Nunc purus lorem, scelerisque in malesuada id, congue a magna. Donec rutrum maximus egestas. Nulla ornare libero quis odio ultricies iaculis. Suspendisse consectetur bibendum purus ac blandit. Donec et neque quis dolor eleifend tempus. Fusce fringilla risus id venenatis rutrum. Mauris commodo posuere ipsum, sit amet hendrerit risus lacinia quis. Aenean placerat ultricies ante id dapibus. Donec imperdiet eros quis porttitor accumsan. Vestibulum ut nulla luctus velit feugiat elementum. Nam vel pharetra nisl. Nullam risus tellus, tempor quis ipsum et, pretium rutrum ipsum.\n' +
      '\n' +
      'Fusce molestie leo at facilisis mollis. Vivamus iaculis facilisis fermentum. Vivamus blandit id nisi sit amet porta. Nunc luctus porta blandit. Sed ac consequat eros, eu fringilla lorem. In blandit pharetra sollicitudin. Vivamus placerat risus ut ex faucibus, nec vehicula sapien imperdiet. Praesent luctus, leo eget ultrices cursus, neque ante porttitor mauris, id tempus tellus urna at ex. Curabitur elementum id quam vitae condimentum. Proin sit amet magna vel metus blandit iaculis. Phasellus viverra libero in lacus gravida, id laoreet ligula dapibus. Cras commodo arcu eget mi dignissim, et lobortis elit faucibus. Suspendisse potenti. '
  )
  const rangeFrom = { line: 2, ch: 4 }
  const rangeTo = { line: 3, ch: 36 }

  systemUnderTest.checkMultiLineRange(editor, rangeFrom, rangeTo)

  expect(dic.check).toHaveBeenCalledTimes(11)
  expect(dic.check.mock.calls[0][0]).toEqual('lacus')
  expect(dic.check.mock.calls[1][0]).toEqual('elit')
  expect(dic.check.mock.calls[2][0]).toEqual('sollicitudin')
  expect(dic.check.mock.calls[3][0]).toEqual('vestibulum')
  expect(dic.check.mock.calls[4][0]).toEqual('Phasellus')
  expect(dic.check.mock.calls[5][0]).toEqual('blandit')
  expect(dic.check.mock.calls[6][0]).toEqual('laoreet')
  expect(dic.check.mock.calls[7][0]).toEqual('odio')
  expect(dic.check.mock.calls[8][0]).toEqual('tristique')
  expect(dic.check.mock.calls[9][0]).toEqual('risus')
  expect(dic.check.mock.calls[10][0]).toEqual('tristique')
})

it('should test that checkMultiLineRange works correct even when the range is inverted (from is the later position and to the lower)', function() {
  const dic = jest.fn()
  dic.check = jest.fn()
  systemUnderTest.setDictionaryForTestsOnly(dic)
  document.body.createTextRange = jest.fn(() =>
    document.createElement('textArea')
  )
  const editor = new CodeMirror(jest.fn())
  editor.setValue(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vehicula sem id tempor sollicitudin. Sed eu sagittis ligula. Maecenas sit amet velit enim. Etiam massa urna, elementum et sapien sit amet, vestibulum pharetra lectus. Nulla consequat malesuada nunc in aliquam. Vivamus faucibus orci et faucibus maximus. Pellentesque at dolor ac mi mollis molestie in facilisis nisl.\n' +
      '\n' +
      'Nam id lacus et elit sollicitudin vestibulum. Phasellus blandit laoreet odio \n' +
      'Ut tristique risus et mi tristique, in aliquam odio laoreet. Curabitur nunc felis, mollis ut laoreet quis, finibus in nibh. Proin urna risus, rhoncus at diam interdum, maximus vestibulum nulla. Maecenas ut rutrum nulla, vel finibus est. Etiam placerat mi et libero volutpat, tristique rhoncus felis volutpat. Donec quam erat, congue quis ligula eget, mollis aliquet elit. Vestibulum feugiat odio sit amet ex dignissim, sit amet vulputate lectus iaculis. Sed tempus id enim at eleifend. Nullam bibendum eleifend congue. Pellentesque varius arcu elit, at accumsan dolor ultrices vitae. Etiam condimentum lectus id dolor fringilla tempor. Aliquam nec fringilla sem. Fusce ac quam porta, molestie nunc sed, semper nisl. Curabitur luctus sem in dapibus gravida. Suspendisse scelerisque mollis rutrum. Proin lacinia dolor sit amet ornare condimentum.\n' +
      '\n' +
      'In ex neque, volutpat quis ullamcorper in, vestibulum vel ligula. Quisque lobortis eget neque quis ullamcorper. Nunc purus lorem, scelerisque in malesuada id, congue a magna. Donec rutrum maximus egestas. Nulla ornare libero quis odio ultricies iaculis. Suspendisse consectetur bibendum purus ac blandit. Donec et neque quis dolor eleifend tempus. Fusce fringilla risus id venenatis rutrum. Mauris commodo posuere ipsum, sit amet hendrerit risus lacinia quis. Aenean placerat ultricies ante id dapibus. Donec imperdiet eros quis porttitor accumsan. Vestibulum ut nulla luctus velit feugiat elementum. Nam vel pharetra nisl. Nullam risus tellus, tempor quis ipsum et, pretium rutrum ipsum.\n' +
      '\n' +
      'Fusce molestie leo at facilisis mollis. Vivamus iaculis facilisis fermentum. Vivamus blandit id nisi sit amet porta. Nunc luctus porta blandit. Sed ac consequat eros, eu fringilla lorem. In blandit pharetra sollicitudin. Vivamus placerat risus ut ex faucibus, nec vehicula sapien imperdiet. Praesent luctus, leo eget ultrices cursus, neque ante porttitor mauris, id tempus tellus urna at ex. Curabitur elementum id quam vitae condimentum. Proin sit amet magna vel metus blandit iaculis. Phasellus viverra libero in lacus gravida, id laoreet ligula dapibus. Cras commodo arcu eget mi dignissim, et lobortis elit faucibus. Suspendisse potenti. '
  )
  const rangeFrom = { line: 3, ch: 36 }
  const rangeTo = { line: 2, ch: 4 }

  systemUnderTest.checkMultiLineRange(editor, rangeFrom, rangeTo)

  expect(dic.check).toHaveBeenCalledTimes(11)
  expect(dic.check.mock.calls[0][0]).toEqual('lacus')
  expect(dic.check.mock.calls[1][0]).toEqual('elit')
  expect(dic.check.mock.calls[2][0]).toEqual('sollicitudin')
  expect(dic.check.mock.calls[3][0]).toEqual('vestibulum')
  expect(dic.check.mock.calls[4][0]).toEqual('Phasellus')
  expect(dic.check.mock.calls[5][0]).toEqual('blandit')
  expect(dic.check.mock.calls[6][0]).toEqual('laoreet')
  expect(dic.check.mock.calls[7][0]).toEqual('odio')
  expect(dic.check.mock.calls[8][0]).toEqual('tristique')
  expect(dic.check.mock.calls[9][0]).toEqual('risus')
  expect(dic.check.mock.calls[10][0]).toEqual('tristique')
})

it('should test that checkMultiLineRange works for single line', function() {
  const dic = jest.fn()
  dic.check = jest.fn()
  systemUnderTest.setDictionaryForTestsOnly(dic)
  document.body.createTextRange = jest.fn(() =>
    document.createElement('textArea')
  )
  const editor = new CodeMirror(jest.fn())
  editor.setValue(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vehicula sem id tempor sollicitudin. Sed eu sagittis ligula. Maecenas sit amet velit enim. Etiam massa urna, elementum et sapien sit amet, vestibulum pharetra lectus. Nulla consequat malesuada nunc in aliquam. Vivamus faucibus orci et faucibus maximus. Pellentesque at dolor ac mi mollis molestie in facilisis nisl.\n' +
      '\n' +
      'Nam id lacus et elit sollicitudin vestibulum. Phasellus blandit laoreet odio \n' +
      'Ut tristique risus et mi tristique, in aliquam odio laoreet. Curabitur nunc felis, mollis ut laoreet quis, finibus in nibh. Proin urna risus, rhoncus at diam interdum, maximus vestibulum nulla. Maecenas ut rutrum nulla, vel finibus est. Etiam placerat mi et libero volutpat, tristique rhoncus felis volutpat. Donec quam erat, congue quis ligula eget, mollis aliquet elit. Vestibulum feugiat odio sit amet ex dignissim, sit amet vulputate lectus iaculis. Sed tempus id enim at eleifend. Nullam bibendum eleifend congue. Pellentesque varius arcu elit, at accumsan dolor ultrices vitae. Etiam condimentum lectus id dolor fringilla tempor. Aliquam nec fringilla sem. Fusce ac quam porta, molestie nunc sed, semper nisl. Curabitur luctus sem in dapibus gravida. Suspendisse scelerisque mollis rutrum. Proin lacinia dolor sit amet ornare condimentum.\n' +
      '\n' +
      'In ex neque, volutpat quis ullamcorper in, vestibulum vel ligula. Quisque lobortis eget neque quis ullamcorper. Nunc purus lorem, scelerisque in malesuada id, congue a magna. Donec rutrum maximus egestas. Nulla ornare libero quis odio ultricies iaculis. Suspendisse consectetur bibendum purus ac blandit. Donec et neque quis dolor eleifend tempus. Fusce fringilla risus id venenatis rutrum. Mauris commodo posuere ipsum, sit amet hendrerit risus lacinia quis. Aenean placerat ultricies ante id dapibus. Donec imperdiet eros quis porttitor accumsan. Vestibulum ut nulla luctus velit feugiat elementum. Nam vel pharetra nisl. Nullam risus tellus, tempor quis ipsum et, pretium rutrum ipsum.\n' +
      '\n' +
      'Fusce molestie leo at facilisis mollis. Vivamus iaculis facilisis fermentum. Vivamus blandit id nisi sit amet porta. Nunc luctus porta blandit. Sed ac consequat eros, eu fringilla lorem. In blandit pharetra sollicitudin. Vivamus placerat risus ut ex faucibus, nec vehicula sapien imperdiet. Praesent luctus, leo eget ultrices cursus, neque ante porttitor mauris, id tempus tellus urna at ex. Curabitur elementum id quam vitae condimentum. Proin sit amet magna vel metus blandit iaculis. Phasellus viverra libero in lacus gravida, id laoreet ligula dapibus. Cras commodo arcu eget mi dignissim, et lobortis elit faucibus. Suspendisse potenti. '
  )
  const rangeFrom = { line: 5, ch: 14 }
  const rangeTo = { line: 5, ch: 39 }

  systemUnderTest.checkMultiLineRange(editor, rangeFrom, rangeTo)

  expect(dic.check).toHaveBeenCalledTimes(3)
  expect(dic.check.mock.calls[0][0]).toEqual('volutpat')
  expect(dic.check.mock.calls[1][0]).toEqual('quis')
  expect(dic.check.mock.calls[2][0]).toEqual('ullamcorper')
})

it('should test that checkMultiLineRange works for single word', function() {
  const dic = jest.fn()
  dic.check = jest.fn()
  systemUnderTest.setDictionaryForTestsOnly(dic)
  document.body.createTextRange = jest.fn(() =>
    document.createElement('textArea')
  )
  const editor = new CodeMirror(jest.fn())
  editor.setValue(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vehicula sem id tempor sollicitudin. Sed eu sagittis ligula. Maecenas sit amet velit enim. Etiam massa urna, elementum et sapien sit amet, vestibulum pharetra lectus. Nulla consequat malesuada nunc in aliquam. Vivamus faucibus orci et faucibus maximus. Pellentesque at dolor ac mi mollis molestie in facilisis nisl.\n' +
      '\n' +
      'Nam id lacus et elit sollicitudin vestibulum. Phasellus blandit laoreet odio \n' +
      'Ut tristique risus et mi tristique, in aliquam odio laoreet. Curabitur nunc felis, mollis ut laoreet quis, finibus in nibh. Proin urna risus, rhoncus at diam interdum, maximus vestibulum nulla. Maecenas ut rutrum nulla, vel finibus est. Etiam placerat mi et libero volutpat, tristique rhoncus felis volutpat. Donec quam erat, congue quis ligula eget, mollis aliquet elit. Vestibulum feugiat odio sit amet ex dignissim, sit amet vulputate lectus iaculis. Sed tempus id enim at eleifend. Nullam bibendum eleifend congue. Pellentesque varius arcu elit, at accumsan dolor ultrices vitae. Etiam condimentum lectus id dolor fringilla tempor. Aliquam nec fringilla sem. Fusce ac quam porta, molestie nunc sed, semper nisl. Curabitur luctus sem in dapibus gravida. Suspendisse scelerisque mollis rutrum. Proin lacinia dolor sit amet ornare condimentum.\n' +
      '\n' +
      'In ex neque, volutpat quis ullamcorper in, vestibulum vel ligula. Quisque lobortis eget neque quis ullamcorper. Nunc purus lorem, scelerisque in malesuada id, congue a magna. Donec rutrum maximus egestas. Nulla ornare libero quis odio ultricies iaculis. Suspendisse consectetur bibendum purus ac blandit. Donec et neque quis dolor eleifend tempus. Fusce fringilla risus id venenatis rutrum. Mauris commodo posuere ipsum, sit amet hendrerit risus lacinia quis. Aenean placerat ultricies ante id dapibus. Donec imperdiet eros quis porttitor accumsan. Vestibulum ut nulla luctus velit feugiat elementum. Nam vel pharetra nisl. Nullam risus tellus, tempor quis ipsum et, pretium rutrum ipsum.\n' +
      '\n' +
      'Fusce molestie leo at facilisis mollis. Vivamus iaculis facilisis fermentum. Vivamus blandit id nisi sit amet porta. Nunc luctus porta blandit. Sed ac consequat eros, eu fringilla lorem. In blandit pharetra sollicitudin. Vivamus placerat risus ut ex faucibus, nec vehicula sapien imperdiet. Praesent luctus, leo eget ultrices cursus, neque ante porttitor mauris, id tempus tellus urna at ex. Curabitur elementum id quam vitae condimentum. Proin sit amet magna vel metus blandit iaculis. Phasellus viverra libero in lacus gravida, id laoreet ligula dapibus. Cras commodo arcu eget mi dignissim, et lobortis elit faucibus. Suspendisse potenti. '
  )
  const rangeFrom = { line: 7, ch: 6 }
  const rangeTo = { line: 7, ch: 6 }

  systemUnderTest.checkMultiLineRange(editor, rangeFrom, rangeTo)

  expect(dic.check).toHaveBeenCalledTimes(1)
  expect(dic.check.mock.calls[0][0]).toEqual('molestie')
})

it("should make sure that liveSpellcheck don't work if the spellcheck is not enabled", function() {
  const checkMultiLineRangeSpy = jest
    .spyOn(systemUnderTest, 'checkMultiLineRange')
    .mockImplementation()
  const editor = jest.fn()
  editor.findMarks = jest.fn()

  systemUnderTest.setDictionaryForTestsOnly(null)
  systemUnderTest.checkChangeRange(editor, {}, {})

  expect(checkMultiLineRangeSpy).not.toHaveBeenCalled()
  expect(editor.findMarks).not.toHaveBeenCalled()

  checkMultiLineRangeSpy.mockRestore()
})

it('should make sure that liveSpellcheck works for a range of changes', function() {
  const editor = jest.fn()
  const marks = [{ clear: jest.fn() }, { clear: jest.fn() }]
  editor.findMarks = jest.fn(() => marks)
  const checkMultiLineRangeSpy = jest
    .spyOn(systemUnderTest, 'checkMultiLineRange')
    .mockImplementation()

  const inputChangeRange = { from: { line: 0, ch: 2 }, to: { line: 1, ch: 1 } }
  const inputChangeRangeTo = {
    from: { line: 0, ch: 2 },
    to: { line: 1, ch: 2 }
  }

  systemUnderTest.setDictionaryForTestsOnly({})
  systemUnderTest.checkChangeRange(editor, inputChangeRange, inputChangeRangeTo)

  expect(checkMultiLineRangeSpy).toHaveBeenCalledWith(
    editor,
    { line: 0, ch: 1 },
    { line: 1, ch: 3 }
  )
  expect(editor.findMarks).toHaveBeenCalledWith(
    { line: 0, ch: 1 },
    { line: 1, ch: 3 }
  )
  expect(marks[0].clear).toHaveBeenCalled()
  expect(marks[1].clear).toHaveBeenCalled()
  checkMultiLineRangeSpy.mockRestore()
})

it('should make sure that liveSpellcheck works if ranges are inverted', function() {
  const editor = jest.fn()
  const marks = [{ clear: jest.fn() }, { clear: jest.fn() }]
  editor.findMarks = jest.fn(() => marks)
  const checkMultiLineRangeSpy = jest
    .spyOn(systemUnderTest, 'checkMultiLineRange')
    .mockImplementation()

  const inputChangeRange = { from: { line: 0, ch: 2 }, to: { line: 1, ch: 2 } }
  const inputChangeRangeTo = {
    from: { line: 0, ch: 2 },
    to: { line: 1, ch: 1 }
  }

  systemUnderTest.setDictionaryForTestsOnly({})
  systemUnderTest.checkChangeRange(editor, inputChangeRange, inputChangeRangeTo)

  expect(checkMultiLineRangeSpy).toHaveBeenCalledWith(
    editor,
    { line: 0, ch: 1 },
    { line: 1, ch: 3 }
  )
  expect(editor.findMarks).toHaveBeenCalledWith(
    { line: 0, ch: 1 },
    { line: 1, ch: 3 }
  )
  expect(marks[0].clear).toHaveBeenCalled()
  expect(marks[1].clear).toHaveBeenCalled()
  checkMultiLineRangeSpy.mockRestore()
})

it('should make sure that liveSpellcheck works for a single word with change at the beginning', function() {
  const dic = jest.fn()
  dic.check = jest.fn()
  systemUnderTest.setDictionaryForTestsOnly(dic)
  document.body.createTextRange = jest.fn(() =>
    document.createElement('textArea')
  )
  const editor = new CodeMirror(jest.fn())
  editor.setValue(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vehicula sem id tempor sollicitudin. Sed eu sagittis ligula. Maecenas sit amet velit enim. Etiam massa urna, elementum et sapien sit amet, vestibulum pharetra lectus. Nulla consequat malesuada nunc in aliquam. Vivamus faucibus orci et faucibus maximus. Pellentesque at dolor ac mi mollis molestie in facilisis nisl.\n' +
      '\n' +
      'Nam id lacus et elit sollicitudin vestibulum. Phasellus blandit laoreet odio \n' +
      'Ut tristique risus et mi tristique, in aliquam odio laoreet. Curabitur nunc felis, mollis ut laoreet quis, finibus in nibh. Proin urna risus, rhoncus at diam interdum, maximus vestibulum nulla. Maecenas ut rutrum nulla, vel finibus est. Etiam placerat mi et libero volutpat, tristique rhoncus felis volutpat. Donec quam erat, congue quis ligula eget, mollis aliquet elit. Vestibulum feugiat odio sit amet ex dignissim, sit amet vulputate lectus iaculis. Sed tempus id enim at eleifend. Nullam bibendum eleifend congue. Pellentesque varius arcu elit, at accumsan dolor ultrices vitae. Etiam condimentum lectus id dolor fringilla tempor. Aliquam nec fringilla sem. Fusce ac quam porta, molestie nunc sed, semper nisl. Curabitur luctus sem in dapibus gravida. Suspendisse scelerisque mollis rutrum. Proin lacinia dolor sit amet ornare condimentum.\n' +
      '\n' +
      'In ex neque, volutpat quis ullamcorper in, vestibulum vel ligula. Quisque lobortis eget neque quis ullamcorper. Nunc purus lorem, scelerisque in malesuada id, congue a magna. Donec rutrum maximus egestas. Nulla ornare libero quis odio ultricies iaculis. Suspendisse consectetur bibendum purus ac blandit. Donec et neque quis dolor eleifend tempus. Fusce fringilla risus id venenatis rutrum. Mauris commodo posuere ipsum, sit amet hendrerit risus lacinia quis. Aenean placerat ultricies ante id dapibus. Donec imperdiet eros quis porttitor accumsan. Vestibulum ut nulla luctus velit feugiat elementum. Nam vel pharetra nisl. Nullam risus tellus, tempor quis ipsum et, pretium rutrum ipsum.\n' +
      '\n' +
      'Fusce molestie leo at facilisis mollis. Vivamus iaculis facilisis fermentum. Vivamus blandit id nisi sit amet porta. Nunc luctus porta blandit. Sed ac consequat eros, eu fringilla lorem. In blandit pharetra sollicitudin. Vivamus placerat risus ut ex faucibus, nec vehicula sapien imperdiet. Praesent luctus, leo eget ultrices cursus, neque ante porttitor mauris, id tempus tellus urna at ex. Curabitur elementum id quam vitae condimentum. Proin sit amet magna vel metus blandit iaculis. Phasellus viverra libero in lacus gravida, id laoreet ligula dapibus. Cras commodo arcu eget mi dignissim, et lobortis elit faucibus. Suspendisse potenti. '
  )
  const rangeFrom = { from: { line: 7, ch: 6 }, to: { line: 7, ch: 6 } }
  const rangeTo = { from: { line: 7, ch: 6 }, to: { line: 7, ch: 6 } }

  systemUnderTest.checkChangeRange(editor, rangeFrom, rangeTo)

  expect(dic.check).toHaveBeenCalledTimes(1)
  expect(dic.check.mock.calls[0][0]).toEqual('molestie')
})

it('should make sure that liveSpellcheck works for a single word with change in the middle', function() {
  const dic = jest.fn()
  dic.check = jest.fn()
  systemUnderTest.setDictionaryForTestsOnly(dic)
  document.body.createTextRange = jest.fn(() =>
    document.createElement('textArea')
  )
  const editor = new CodeMirror(jest.fn())
  editor.setValue(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vehicula sem id tempor sollicitudin. Sed eu sagittis ligula. Maecenas sit amet velit enim. Etiam massa urna, elementum et sapien sit amet, vestibulum pharetra lectus. Nulla consequat malesuada nunc in aliquam. Vivamus faucibus orci et faucibus maximus. Pellentesque at dolor ac mi mollis molestie in facilisis nisl.\n' +
      '\n' +
      'Nam id lacus et elit sollicitudin vestibulum. Phasellus blandit laoreet odio \n' +
      'Ut tristique risus et mi tristique, in aliquam odio laoreet. Curabitur nunc felis, mollis ut laoreet quis, finibus in nibh. Proin urna risus, rhoncus at diam interdum, maximus vestibulum nulla. Maecenas ut rutrum nulla, vel finibus est. Etiam placerat mi et libero volutpat, tristique rhoncus felis volutpat. Donec quam erat, congue quis ligula eget, mollis aliquet elit. Vestibulum feugiat odio sit amet ex dignissim, sit amet vulputate lectus iaculis. Sed tempus id enim at eleifend. Nullam bibendum eleifend congue. Pellentesque varius arcu elit, at accumsan dolor ultrices vitae. Etiam condimentum lectus id dolor fringilla tempor. Aliquam nec fringilla sem. Fusce ac quam porta, molestie nunc sed, semper nisl. Curabitur luctus sem in dapibus gravida. Suspendisse scelerisque mollis rutrum. Proin lacinia dolor sit amet ornare condimentum.\n' +
      '\n' +
      'In ex neque, volutpat quis ullamcorper in, vestibulum vel ligula. Quisque lobortis eget neque quis ullamcorper. Nunc purus lorem, scelerisque in malesuada id, congue a magna. Donec rutrum maximus egestas. Nulla ornare libero quis odio ultricies iaculis. Suspendisse consectetur bibendum purus ac blandit. Donec et neque quis dolor eleifend tempus. Fusce fringilla risus id venenatis rutrum. Mauris commodo posuere ipsum, sit amet hendrerit risus lacinia quis. Aenean placerat ultricies ante id dapibus. Donec imperdiet eros quis porttitor accumsan. Vestibulum ut nulla luctus velit feugiat elementum. Nam vel pharetra nisl. Nullam risus tellus, tempor quis ipsum et, pretium rutrum ipsum.\n' +
      '\n' +
      'Fusce molestie leo at facilisis mollis. Vivamus iaculis facilisis fermentum. Vivamus blandit id nisi sit amet porta. Nunc luctus porta blandit. Sed ac consequat eros, eu fringilla lorem. In blandit pharetra sollicitudin. Vivamus placerat risus ut ex faucibus, nec vehicula sapien imperdiet. Praesent luctus, leo eget ultrices cursus, neque ante porttitor mauris, id tempus tellus urna at ex. Curabitur elementum id quam vitae condimentum. Proin sit amet magna vel metus blandit iaculis. Phasellus viverra libero in lacus gravida, id laoreet ligula dapibus. Cras commodo arcu eget mi dignissim, et lobortis elit faucibus. Suspendisse potenti. '
  )
  const rangeFrom = { from: { line: 7, ch: 9 }, to: { line: 7, ch: 9 } }
  const rangeTo = { from: { line: 7, ch: 9 }, to: { line: 7, ch: 9 } }

  systemUnderTest.checkChangeRange(editor, rangeFrom, rangeTo)

  expect(dic.check).toHaveBeenCalledTimes(1)
  expect(dic.check.mock.calls[0][0]).toEqual('molestie')
})

it('should make sure that liveSpellcheck works for a single word with change at the end', function() {
  const dic = jest.fn()
  dic.check = jest.fn()
  systemUnderTest.setDictionaryForTestsOnly(dic)
  document.body.createTextRange = jest.fn(() =>
    document.createElement('textArea')
  )
  const editor = new CodeMirror(jest.fn())
  editor.setValue(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vehicula sem id tempor sollicitudin. Sed eu sagittis ligula. Maecenas sit amet velit enim. Etiam massa urna, elementum et sapien sit amet, vestibulum pharetra lectus. Nulla consequat malesuada nunc in aliquam. Vivamus faucibus orci et faucibus maximus. Pellentesque at dolor ac mi mollis molestie in facilisis nisl.\n' +
      '\n' +
      'Nam id lacus et elit sollicitudin vestibulum. Phasellus blandit laoreet odio \n' +
      'Ut tristique risus et mi tristique, in aliquam odio laoreet. Curabitur nunc felis, mollis ut laoreet quis, finibus in nibh. Proin urna risus, rhoncus at diam interdum, maximus vestibulum nulla. Maecenas ut rutrum nulla, vel finibus est. Etiam placerat mi et libero volutpat, tristique rhoncus felis volutpat. Donec quam erat, congue quis ligula eget, mollis aliquet elit. Vestibulum feugiat odio sit amet ex dignissim, sit amet vulputate lectus iaculis. Sed tempus id enim at eleifend. Nullam bibendum eleifend congue. Pellentesque varius arcu elit, at accumsan dolor ultrices vitae. Etiam condimentum lectus id dolor fringilla tempor. Aliquam nec fringilla sem. Fusce ac quam porta, molestie nunc sed, semper nisl. Curabitur luctus sem in dapibus gravida. Suspendisse scelerisque mollis rutrum. Proin lacinia dolor sit amet ornare condimentum.\n' +
      '\n' +
      'In ex neque, volutpat quis ullamcorper in, vestibulum vel ligula. Quisque lobortis eget neque quis ullamcorper. Nunc purus lorem, scelerisque in malesuada id, congue a magna. Donec rutrum maximus egestas. Nulla ornare libero quis odio ultricies iaculis. Suspendisse consectetur bibendum purus ac blandit. Donec et neque quis dolor eleifend tempus. Fusce fringilla risus id venenatis rutrum. Mauris commodo posuere ipsum, sit amet hendrerit risus lacinia quis. Aenean placerat ultricies ante id dapibus. Donec imperdiet eros quis porttitor accumsan. Vestibulum ut nulla luctus velit feugiat elementum. Nam vel pharetra nisl. Nullam risus tellus, tempor quis ipsum et, pretium rutrum ipsum.\n' +
      '\n' +
      'Fusce molestie leo at facilisis mollis. Vivamus iaculis facilisis fermentum. Vivamus blandit id nisi sit amet porta. Nunc luctus porta blandit. Sed ac consequat eros, eu fringilla lorem. In blandit pharetra sollicitudin. Vivamus placerat risus ut ex faucibus, nec vehicula sapien imperdiet. Praesent luctus, leo eget ultrices cursus, neque ante porttitor mauris, id tempus tellus urna at ex. Curabitur elementum id quam vitae condimentum. Proin sit amet magna vel metus blandit iaculis. Phasellus viverra libero in lacus gravida, id laoreet ligula dapibus. Cras commodo arcu eget mi dignissim, et lobortis elit faucibus. Suspendisse potenti. '
  )
  const rangeFrom = { from: { line: 7, ch: 14 }, to: { line: 7, ch: 14 } }
  const rangeTo = { from: { line: 7, ch: 14 }, to: { line: 7, ch: 14 } }

  systemUnderTest.checkChangeRange(editor, rangeFrom, rangeTo)

  expect(dic.check).toHaveBeenCalledTimes(1)
  expect(dic.check.mock.calls[0][0]).toEqual('molestie')
})
