const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listDir: (dir) => ipcRenderer.invoke('list-dir', dir),

  onRefreshDirectory: (callback) => {
    if (typeof callback !== 'function') {
      throw new TypeError('Обработчик должен быть функцией.');
    }

    const listener = () => {
      callback();
    };

    ipcRenderer.on('refresh-directory', listener);

    return () => {
      ipcRenderer.removeListener('refresh-directory', listener);
    };
  }
});