/**
 * @fileoverview Unit test for browser/main/lib/ThemeManager.js
 */
const { chooseTheme, applyTheme } = require('browser/main/lib/ThemeManager')
jest.mock('../../browser/main/lib/ConfigManager', () => {
  return {
    set: () => {}
  }
})

const originalDate = Date
let context = {}

beforeAll(() => {
  const constantDate = new Date('2017-11-27T14:33:42')
  global.Date = class extends Date {
    constructor() {
      super()
      return constantDate
    }
  }
})

beforeEach(() => {
  context = {
    ui: {
      theme: 'white',
      scheduledTheme: 'dark',
      enableScheduleTheme: true,
      defaultTheme: 'monokai'
    }
  }
})

afterAll(() => {
  global.Date = originalDate
})

test("enableScheduleTheme is false, theme shouldn't change", () => {
  context.ui.enableScheduleTheme = false

  const beforeTheme = context.ui.theme
  chooseTheme(context)
  const afterTheme = context.ui.theme

  expect(afterTheme).toBe(beforeTheme)
})

// NOT IN SCHEDULE
test("scheduleEnd is bigger than scheduleStart and not in schedule, theme shouldn't change", () => {
  const beforeTheme = context.ui.defaultTheme
  context.ui.scheduleStart = 720 // 12:00
  context.ui.scheduleEnd = 870 // 14:30
  chooseTheme(context)
  const afterTheme = context.ui.theme

  expect(afterTheme).toBe(beforeTheme)
})

test("scheduleStart is bigger than scheduleEnd and not in schedule, theme shouldn't change", () => {
  const beforeTheme = context.ui.defaultTheme
  context.ui.scheduleStart = 960 // 16:00
  context.ui.scheduleEnd = 600 // 10:00
  chooseTheme(context)
  const afterTheme = context.ui.theme

  expect(afterTheme).toBe(beforeTheme)
})

// IN SCHEDULE
test('scheduleEnd is bigger than scheduleStart and in schedule, theme should change', () => {
  const beforeTheme = context.ui.scheduledTheme
  context.ui.scheduleStart = 720 // 12:00
  context.ui.scheduleEnd = 900 // 15:00
  chooseTheme(context)
  const afterTheme = context.ui.theme

  expect(afterTheme).toBe(beforeTheme)
})

test('scheduleStart is bigger than scheduleEnd and in schedule, theme should change', () => {
  const beforeTheme = context.ui.scheduledTheme
  context.ui.scheduleStart = 1200 // 20:00
  context.ui.scheduleEnd = 900 // 15:00
  chooseTheme(context)
  const afterTheme = context.ui.theme

  expect(afterTheme).toBe(beforeTheme)
})

test("theme to apply is not a supported theme, theme shouldn't change", () => {
  applyTheme('notATheme')
  const afterTheme = document.body.dataset.theme

  expect(afterTheme).toBe('default')
})

test('theme to apply is a supported theme, theme should change', () => {
  applyTheme(context.ui.defaultTheme)
  const afterTheme = document.body.dataset.theme

  expect(afterTheme).toBe(context.ui.defaultTheme)
})
