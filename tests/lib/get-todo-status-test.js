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
    ['+ [ ] a\n+ [x] a\n', { total: 2, completed: 1 }]
  ]

  testCases.forEach(testCase => {
    const [input, expected] = testCase
    t.is(getTodoStatus(input).total, expected.total, `Test for getTodoStatus() input: ${input} expected: ${expected.total}`)
    t.is(getTodoStatus(input).completed, expected.completed, `Test for getTodoStatus() input: ${input} expected: ${expected.completed}`)
  })
})

