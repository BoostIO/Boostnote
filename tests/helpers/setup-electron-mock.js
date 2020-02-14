import mock from 'mock-require'

const noop = () => {}

mock('electron', {
  remote: {
    app: {
      getAppPath: noop,
      getPath: noop
    }
  }
})
