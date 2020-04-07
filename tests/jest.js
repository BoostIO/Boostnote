// Here you can mock the libraries connected through direct insertion <script src="" >
global.Raphael = {
  setWindow: jest.fn(),
  registerFont: jest.fn(),
  fn: function() {
    return {}
  }
}

global._ = {
  extend: jest.genMockFunction()
}
