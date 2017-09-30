import { Provider } from 'react-redux';
import Main from './Main';
import store from './store';
import React from 'react';
import ReactDOM from 'react-dom';
require('!!style!css!stylus?sourceMap!./global.styl');
import {
  Router,
  Route,
  IndexRoute,
  IndexRedirect,
  hashHistory,
} from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
require('./lib/ipcClient');
require('../lib/customMeta');
import RouteChangeHandler from './lib/RouteChangeHandler';

const electron = require('electron');

const { remote, ipcRenderer } = electron;
const { dialog } = remote;

document.addEventListener('drop', function(e) {
  e.preventDefault();
  e.stopPropagation();
});
document.addEventListener('dragover', function(e) {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('click', function(e) {
  const className = e.target.className;
  if (!className && typeof className !== 'string') return;
  const isInfoButton = className.includes('infoButton');
  const isInfoPanel = e.target.offsetParent.className.includes('infoPanel');
  if (isInfoButton || isInfoPanel) return;
  const infoPanel = document.querySelector('.infoPanel');
  if (infoPanel) infoPanel.style.display = 'none';
});

const el = document.getElementById('content');
const history = syncHistoryWithStore(hashHistory, store);

function notify(...args) {
  return new window.Notification(...args);
}

function updateApp() {
  const index = dialog.showMessageBox(remote.getCurrentWindow(), {
    type: 'warning',
    message: 'Update Boostnote',
    detail: 'New Boostnote is ready to be installed.',
    buttons: ['Restart & Install', 'Not Now'],
  });

  if (index === 0) {
    ipcRenderer.send('update-app-confirm');
  }
}

history.listen(RouteChangeHandler);

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={Main}>
        <IndexRedirect to="/home" />
        <Route path="home" />
        <Route path="starred" />
        <Route path="searched" />
        <Route path="trashed" />
        <Route path="storages">
          <IndexRedirect to="/home" />
          <Route path=":storageKey">
            <IndexRoute />
            <Route path="folders/:folderKey" />
          </Route>
        </Route>
      </Route>
    </Router>
  </Provider>,
  el,
  function() {
    const loadingCover = document.getElementById('loadingCover');
    loadingCover.parentNode.removeChild(loadingCover);

    ipcRenderer.on('update-ready', function() {
      store.dispatch({
        type: 'UPDATE_AVAILABLE',
      });
      notify('Update ready!', {
        body: 'New Boostnote is ready to be installed.',
      });
      updateApp();
    });

    ipcRenderer.on('update-found', function() {
      notify('Update found!', {
        body: 'Preparing to update...',
      });
    });

    ipcRenderer.send('update-check', 'check-update');
    window.addEventListener('online', function() {
      if (!store.getState().status.updateReady) {
        ipcRenderer.send('update-check', 'check-update');
      }
    });
  },
);
