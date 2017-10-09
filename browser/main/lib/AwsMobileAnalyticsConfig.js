const AWS = require('aws-sdk')
const AMA = require('aws-sdk-mobile-analytics')
const ConfigManager = require('browser/main/lib/ConfigManager')

AWS.config.region = 'us-east-1'
if (process.env.NODE_ENV === 'production' && ConfigManager.default.get().amaEnabled) {
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:xxxxxxxxxxxxxxxxxxxxxxxxx'
  })
  const mobileAnalyticsClient = new AMA.Manager({
    appId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    appTitle: 'xxxxxxxxxx'
  })
}

function initAwsMobileAnalytics () {
  if (process.env.NODE_ENV !== 'production' || !ConfigManager.default.get().amaEnabled) return
  AWS.config.credentials.get((err) => {
    if (!err) {
      console.log('Cognito Identity ID: ' + AWS.config.credentials.identityId)
      recordDynamicCustomEvent('APP_STARTED')
      recordStaticCustomEvent()
    }
  })
}

function recordDynamicCustomEvent (type) {
  if (process.env.NODE_ENV !== 'production' || !ConfigManager.default.get().amaEnabled) return
  try {
    mobileAnalyticsClient.recordEvent(type)
  } catch (analyticsError) {
    console.error(analyticsError)
  }
}

function recordStaticCustomEvent () {
  if (process.env.NODE_ENV !== 'production' || !ConfigManager.default.get().amaEnabled) return
  try {
    mobileAnalyticsClient.recordEvent('UI_COLOR_THEME', {
      uiColorTheme: ConfigManager.default.get().ui.theme
    })
  } catch (analyticsError) {
    console.error(analyticsError)
  }
}

module.exports = {
  initAwsMobileAnalytics,
  recordDynamicCustomEvent
}
