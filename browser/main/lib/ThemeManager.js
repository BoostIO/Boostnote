import ConfigManager from 'browser/main/lib/ConfigManager'

const saveChanges = newConfig => {
  ConfigManager.set(newConfig)
}

const chooseTheme = config => {
  const { ui } = config
  if (!ui.enableScheduleTheme) {
    return
  }

  const start = parseInt(ui.scheduleStart)
  const end = parseInt(ui.scheduleEnd)

  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()

  const isEndAfterStart = end > start
  const isBetweenStartAndEnd = minutes >= start && minutes < end
  const isBetweenEndAndStart = minutes >= start || minutes < end

  if (
    (isEndAfterStart && isBetweenStartAndEnd) ||
    (!isEndAfterStart && isBetweenEndAndStart)
  ) {
    if (ui.theme !== ui.scheduledTheme) {
      ui.defaultTheme = ui.theme
      ui.theme = ui.scheduledTheme
      applyTheme(ui.theme)
      saveChanges(config)
    }
  } else {
    if (ui.theme !== ui.defaultTheme) {
      ui.theme = ui.defaultTheme
      applyTheme(ui.theme)
      saveChanges(config)
    }
  }
}

const applyTheme = theme => {
  const supportedThemes = [
    'dark',
    'white',
    'solarized-dark',
    'monokai',
    'dracula'
  ]
  if (supportedThemes.indexOf(theme) !== -1) {
    document.body.setAttribute('data-theme', theme)
    if (document.body.querySelector('.MarkdownPreview')) {
      document.body
        .querySelector('.MarkdownPreview')
        .contentDocument.body.setAttribute('data-theme', theme)
    }
  } else {
    document.body.setAttribute('data-theme', 'default')
  }
}

module.exports = {
  chooseTheme,
  applyTheme
}
