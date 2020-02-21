import { Provider } from 'react-redux'
import Main from './Main'
import { store, history } from './store'
import React, { Fragment } from 'react'
import ReactDOM from 'react-dom'
require('!!style!css!stylus?sourceMap!./global.styl')
import config from 'browser/main/lib/ConfigManager'
import { Route, Switch, Redirect } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router'
import DevTools from './DevTools'

require('./lib/ipcClient')
require('../lib/customMeta')
import i18n from 'browser/lib/i18n'

const electron = require('electron')

const { remote, ipcRenderer } = electron
const { dialog } = remote

document.addEventListener('drop', function(e) {
  e.preventDefault()
  e.stopPropagation()
})
document.addEventListener('dragover', function(e) {
  e.preventDefault()
  e.stopPropagation()
})

// prevent menu from popup when alt pressed
// but still able to toggle menu when only alt is pressed
let isAltPressing = false
let isAltWithMouse = false
let isAltWithOtherKey = false
let isOtherKey = false

document.addEventListener('keydown', function(e) {
  if (e.key === 'Alt') {
    isAltPressing = true
    if (isOtherKey) {
      isAltWithOtherKey = true
    }
  } else {
    if (isAltPressing) {
      isAltWithOtherKey = true
    }
    isOtherKey = true
  }
})

document.addEventListener('mousedown', function(e) {
  if (isAltPressing) {
    isAltWithMouse = true
  }
})

document.addEventListener('keyup', function(e) {
  if (e.key === 'Alt') {
    if (isAltWithMouse || isAltWithOtherKey) {
      e.preventDefault()
    }
    isAltWithMouse = false
    isAltWithOtherKey = false
    isAltPressing = false
    isOtherKey = false
  }
})

document.addEventListener('click', function(e) {
  const className = e.target.className
  if (!className && typeof className !== 'string') return
  const isInfoButton = className.includes('infoButton')
  const offsetParent = e.target.offsetParent
  const isInfoPanel =
    offsetParent !== null ? offsetParent.className.includes('infoPanel') : false
  if (isInfoButton || isInfoPanel) return
  const infoPanel = document.querySelector('.infoPanel')
  if (infoPanel) infoPanel.style.display = 'none'
})

if (!config.get().ui.showScrollBar) {
  document.styleSheets[54].insertRule('::-webkit-scrollbar {display: none}')
  document.styleSheets[54].insertRule(
    '::-webkit-scrollbar-corner {display: none}'
  )
  document.styleSheets[54].insertRule(
    '::-webkit-scrollbar-thumb {display: none}'
  )
}

const el = document.getElementById('content')

function notify(...args) {
  return new window.Notification(...args)
}

function updateApp() {
  const index = dialog.showMessageBox(remote.getCurrentWindow(), {
    type: 'warning',
    message: i18n.__('Update Boostnote'),
    detail: i18n.__('New Boostnote is ready to be installed.'),
    buttons: [i18n.__('Restart & Install'), i18n.__('Not Now')]
  })

  if (index === 0) {
    ipcRenderer.send('update-app-confirm')
  }
}

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Fragment>
        <Switch>
          <Redirect path='/' to='/home' exact />
          <Route path='/(home|alltags|starred|trashed)' component={Main} />
          <Route path='/searched' component={Main} exact />
          <Route path='/searched/:searchword' component={Main} />
          <Redirect path='/tags' to='/alltags' exact />
          <Route path='/tags/:tagname' component={Main} />

          {/* storages */}
          <Redirect path='/storages' to='/home' exact />
          <Route path='/storages/:storageKey' component={Main} exact />
          <Route
            path='/storages/:storageKey/folders/:folderKey'
            component={Main}
          />
        </Switch>
        <DevTools />
      </Fragment>
    </ConnectedRouter>
  </Provider>,
  el,
  function() {
    const loadingCover = document.getElementById('loadingCover')
    loadingCover.parentNode.removeChild(loadingCover)

    ipcRenderer.on('update-ready', function() {
      store.dispatch({
        type: 'UPDATE_AVAILABLE'
      })
      notify('Update ready!', {
        body: 'New Boostnote is ready to be installed.'
      })
      updateApp()
    })

    ipcRenderer.on('update-found', function() {
      notify('Update found!', {
        body: 'Preparing to update...'
      })
    })

    ipcRenderer.send('update-check', 'check-update')
    window.addEventListener('online', function() {
      if (!store.getState().status.updateReady) {
        ipcRenderer.send('update-check', 'check-update')
      }
    })
  }
)
