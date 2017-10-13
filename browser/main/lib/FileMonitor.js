/**
 * Handles listening to file changes. If a file changes, it emits an event.
 * TODO: Handle monitoring multiple files.
 */

const chokidar = require('chokidar');

const onFileChanged = (path, stats) => {
  if (!isMonitoring) {
    return;
  }
  console.log('Change! %s %o', path, stats);
};

let watcher = null;
let isMonitoring = false;

const FileMonitor = {
  register: filePath => {
    watcher = chokidar.watch(filePath).on('change', onFileChanged);
    isMonitoring = true;
  },
  unregister: filePath => {
    watcher && watcher.close();
    isMonitoring = false;
  },
  pause: () => {
    isMonitoring = false;
  },
};

export default FileMonitor;
