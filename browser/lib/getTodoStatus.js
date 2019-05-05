export function getTodoStatus (content) {
  const splitted = content.split('\n')
  let numberOfTodo = 0
  let numberOfCompletedTodo = 0

  splitted.forEach((line) => {
    const trimmedLine = line.trim()
    if (trimmedLine.match(/^[\+\-\*] \[(\s|x)\] ./i)) {  // eslint-disable-line
      numberOfTodo++
    }
    if (trimmedLine.match(/^[\+\-\*] \[x\] ./i)) { // eslint-disable-line
      numberOfCompletedTodo++
    }
  })

  return {
    total: numberOfTodo,
    completed: numberOfCompletedTodo
  }
}

export function getTodoPercentageOfCompleted (content) {
  const state = getTodoStatus(content)
  return Math.floor(state.completed / state.total * 100)
}
