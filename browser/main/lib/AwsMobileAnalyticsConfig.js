const AWS = require('aws-sdk')
const AMA = require('aws-sdk-mobile-analytics')
const ConfigManager = require('browser/main/lib/ConfigManager')

const remote = require('electron').remote
const os = require('os')
let mobileAnalyticsClient

AWS.config.region = 'us-east-1'
if (!getSendEventCond()) {
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:xxxxxxxxxxxxxxxxxxxxxxxxx'
  })

  const validPlatformName = convertPlatformName(os.platform())

  mobileAnalyticsClient = new AMA.Manager({
    appId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    appTitle: 'xxxxxxxxxx',
    appVersionName: remote.app.getVersion().toString(),
    platform: validPlatformName
  })
}

function convertPlatformName(platformName) {
  if (platformName === 'darwin') {
    return 'MacOS'
  } else if (platformName === 'win32') {
    return 'Windows'
  } else if (platformName === 'linux') {
    return 'Linux'
  } else {
    return ''
  }
}

function getSendEventCond() {
  const isDev = process.env.NODE_ENV !== 'production'
  const isDisable = !ConfigManager.default.get().amaEnabled
  const isOffline = !window.navigator.onLine
  return isDev || isDisable || isOffline
}

function initAwsMobileAnalytics() {
  if (getSendEventCond()) return
  AWS.config.credentials.get(err => {
    if (!err) {
      recordDynamicCustomEvent('APP_STARTED')
      recordStaticCustomEvent()
    }
  })
}

function recordDynamicCustomEvent(type, options = {}) {
  if (getSendEventCond()) return
  try {
    mobileAnalyticsClient.recordEvent(type, options)
  } catch (analyticsError) {
    if (analyticsError instanceof ReferenceError) {
      console.error(analyticsError.name + ': ' + analyticsError.message)
    }
  }
}

function recordStaticCustomEvent() {
  if (getSendEventCond()) return
  try {
    mobileAnalyticsClient.recordEvent('UI_COLOR_THEME', {
      uiColorTheme: ConfigManager.default.get().ui.theme
    })
  } catch (analyticsError) {
    if (analyticsError instanceof ReferenceError) {
      console.error(analyticsError.name + ': ' + analyticsError.message)
    }
  }
}

module.exports = {
  initAwsMobileAnalytics,
  recordDynamicCustomEvent
}
