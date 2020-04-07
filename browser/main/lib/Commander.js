let callees = []

function bind(name, el) {
  callees.push({
    name: name,
    element: el
  })
}

function release(el) {
  callees = callees.filter(callee => callee.element !== el)
}

function fire(command) {
  console.info('COMMAND >>', command)
  const splitted = command.split(':')
  const target = splitted[0]
  const targetCommand = splitted[1]
  const targetCallees = callees.filter(callee => callee.name === target)

  targetCallees.forEach(callee => {
    callee.element.fire(targetCommand)
  })
}

export default {
  bind,
  release,
  fire
}
