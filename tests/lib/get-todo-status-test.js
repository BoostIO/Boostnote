const test = require('ava')
const { getTodoStatus } = require('browser/lib/getTodoStatus')

// Unit test
test('getTodoStatus should return a correct hash object', t => {
  // [input, expected]
  const testCases = [
    ['', { total: 0, completed: 0 }],
    ['* [ ] a\n', { total: 1, completed: 0 }],
    ['* [ ] a\n* [x] a\n', { total: 2, completed: 1 }],
    ['- [ ] a\n', { total: 1, completed: 0 }],
    ['- [ ] a\n- [x] a\n', { total: 2, completed: 1 }],
    ['+ [ ] a\n', { total: 1, completed: 0 }],
    ['+ [ ] a\n+ [x] a\n', { total: 2, completed: 1 }],
    ['+ [ ] a\n+ [X] a\n', { total: 2, completed: 1 }],
    ['+ [ ] a\n+ [testx] a\n', { total: 1, completed: 0 }],
    ['+ [ ] a\n+ [xtest] a\n', { total: 1, completed: 0 }],
    ['+ [ ] a\n+ foo[x]bar a\n', { total: 1, completed: 0 }],
    ['+ [ ] a\n+ foo[x] bar a\n', { total: 1, completed: 0 }],
    ['+ [ ] a\n+ foo [x]bar a\n', { total: 1, completed: 0 }],
    ['* [ ] `- [ ] a`\n', { total: 1, completed: 0 }],
    ['+ [ ] `- [ ] a`\n', { total: 1, completed: 0 }],
    ['- [ ] `- [ ] a`\n', { total: 1, completed: 0 }],
    ['- [ ] `- [x] a`\n', { total: 1, completed: 0 }],
    ['- [ ] `- [X] a`\n', { total: 1, completed: 0 }],
    ['- [x] `- [ ] a`\n', { total: 1, completed: 1 }],
    ['- [X] `- [ ] a`\n', { total: 1, completed: 1 }],
    ['- [x] `- [x] a`\n', { total: 1, completed: 1 }],
    ['- [X] `- [X] a`\n', { total: 1, completed: 1 }],
    [' \t - [X] `- [X] a`\n', { total: 1, completed: 1 }],
    [' \t - [X] `- [X] a`\n \t - [ ] `- [X] a`\n', { total: 2, completed: 1 }],
    ['> - [ ] a\n', { total: 1, completed: 0 }],
    ['> - [ ] a\n- [x] a\n', { total: 2, completed: 1 }],
    ['> + [ ] a\n+ foo [x]bar a\n', { total: 1, completed: 0 }],
    ['> - [X] `- [X] a`\n', { total: 1, completed: 1 }],
    ['> \t - [X] `- [X] a`\n', { total: 1, completed: 1 }],
    ['> > - [ ] a\n', { total: 1, completed: 0 }],
    ['> > > - [ ] a\n- [x] a\n', { total: 2, completed: 1 }]
  ]

  testCases.forEach(testCase => {
    const [input, expected] = testCase
    t.is(
      getTodoStatus(input).total,
      expected.total,
      `Test for getTodoStatus() input: ${input} expected: ${expected.total}`
    )
    t.is(
      getTodoStatus(input).completed,
      expected.completed,
      `Test for getTodoStatus() input: ${input} expected: ${expected.completed}`
    )
  })
})
