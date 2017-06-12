const AWS = require('aws-sdk')
const AMA = require('aws-sdk-mobile-analytics')
const ConfigManager = require('browser/main/lib/ConfigManager')

AWS.config.region = 'us-east-1'
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'us-east-1:xxxxxxxxxxxxxxxxxxxxxxxxx'
})
const mobileAnalyticsClient = new AMA.Manager({
  appId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  appTitle: 'xxxxxxxxxx'
})

function initAwsMobileAnalytics () {
  AWS.config.credentials.get(function (err) {
    if (!err) {
      console.log('Cognito Identity ID: ' + AWS.config.credentials.identityId)
    }
  })
  recordStaticCustomEvent()
}

function recordDynamitCustomEvent (type) {
  mobileAnalyticsClient.recordEvent(type)
}

function recordStaticCustomEvent () {
  mobileAnalyticsClient.recordEvent('UI_COLOR_THEME', {
    uiColorTheme: ConfigManager.default.get().ui.theme
  })
}

module.exports = {
  initAwsMobileAnalytics,
  recordDynamitCustomEvent
}
