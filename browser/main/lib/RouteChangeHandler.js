/**
 * Listens to changes in the app's route history, ie. navigating from note to note.
 * Maintains a list of the last N routes. Newer routers are pushed to the end of the list.
 */

import NoteUtils from './NoteUtils';
import FileMonitor from './FileMonitor';
import { findStorage } from '../../lib/findStorage';
import consts from '../../lib/consts';
import path from 'path';

const sander = require('sander');

const ROUTE_HISTORY_SIZE = 5;
const RouteHistory = [];

const updateFileMonitor = (location, operation) => {
  const parsedKey = NoteUtils.parseKey(location.query.key);
  const storage = findStorage(parsedKey.storageKey);
  const filePath = path.join(
    storage.path,
    consts.STORAGE.NOTE_SUFFIX,
    `${parsedKey.noteKey}.cson`,
  );

  if (!sander.statSync(filePath).isFile()) {
    console.error('Could not update FileMonitor on %s', filePath);
  }

  if (operation === 'add') {
    FileMonitor.register(filePath);
  } else if (operation === 'remove') {
    FileMonitor.unregister(filePath);
  } else {
    console.error('Unsupported operation: %s', operation);
  }
};

const RouteChangeHander = location => {
  const previousLocation = RouteHistory[RouteHistory.length - 1];

  // Prune the oldest location.
  if (RouteHistory.length >= ROUTE_HISTORY_SIZE) {
    RouteHistory.shift();
  }

  // If navigating away from a note file, stop monitoring external changes.
  if (previousLocation && typeof previousLocation.query.key === 'string') {
    updateFileMonitor(previousLocation, 'remove');
  }
  // When navigating to a note file, begin to monitor external changes to it.
  if (location.query && typeof location.query.key === 'string') {
    updateFileMonitor(location, 'add');
  }

  RouteHistory.push(location);
};

module.exports = RouteChangeHander;
