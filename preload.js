const { contextBridge, ipcRenderer } = require('electron');

// Безопасный мост между main process и renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Получать команды от main process
  onClearStorage: (callback) => {
    ipcRenderer.on('clear-storage', () => {
      callback();
    });
  },

  // Сообщить main что хранилище очищено
  storageCleaned: () => {
    ipcRenderer.send('storage-cleared');
  },

  // Информация о платформе
  platform: process.platform,

  // Версия приложения
  version: process.env.npm_package_version || '1.0.0'
});
