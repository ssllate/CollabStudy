const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');

// Отключаем аппаратное ускорение если нет GPU (для совместимости)
app.disableHardwareAcceleration && process.env.DISABLE_GPU && app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'CollabStudy',
    backgroundColor: '#080C14',
    show: false, // скрыть до готовности (избегаем белого flash)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Разрешаем localStorage в Electron
      enableRemoteModule: false,
    },
    // Красивая рамка окна
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
  });

  // Загружаем наш HTML
  mainWindow.loadFile('index.html');

  // Показываем окно когда страница готова — без белого флеша
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Открывать внешние ссылки в браузере, не в Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── МЕНЮ ПРИЛОЖЕНИЯ ──
function buildMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // macOS: меню приложения
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: 'О CollabStudy' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit', label: 'Выйти' }
      ]
    }] : []),

    // Файл
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Сбросить данные',
          click: async () => {
            const { response } = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              title: 'Сбросить данные',
              message: 'Все данные будут удалены. Продолжить?',
              buttons: ['Отмена', 'Сбросить'],
              defaultId: 0,
              cancelId: 0
            });
            if (response === 1) {
              mainWindow.webContents.send('clear-storage');
            }
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Закрыть' } : { role: 'quit', label: 'Выйти' }
      ]
    },

    // Правка
    {
      label: 'Правка',
      submenu: [
        { role: 'undo', label: 'Отменить' },
        { role: 'redo', label: 'Повторить' },
        { type: 'separator' },
        { role: 'cut', label: 'Вырезать' },
        { role: 'copy', label: 'Копировать' },
        { role: 'paste', label: 'Вставить' },
        { role: 'selectAll', label: 'Выбрать всё' }
      ]
    },

    // Вид
    {
      label: 'Вид',
      submenu: [
        { role: 'reload', label: 'Обновить' },
        { type: 'separator' },
        { role: 'zoomIn',  label: 'Увеличить' },
        { role: 'zoomOut', label: 'Уменьшить' },
        { role: 'resetZoom', label: 'Сбросить масштаб' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Полный экран' }
      ]
    },

    // Окно
    {
      label: 'Окно',
      submenu: [
        { role: 'minimize', label: 'Свернуть' },
        { role: 'zoom', label: 'Развернуть' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ── СОБЫТИЯ ПРИЛОЖЕНИЯ ──
app.whenReady().then(() => {
  createWindow();
  // Меню только на macOS (там оно обязательно), на Windows/Linux убираем
  if (process.platform === 'darwin') {
    buildMenu();
  } else {
    Menu.setApplicationMenu(null);
  }

  // macOS: переоткрыть окно при клике на dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: очистить localStorage по запросу меню
ipcMain.on('storage-cleared', () => {
  // подтверждение от renderer
});
