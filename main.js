const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');

const indexPath = path.join(__dirname, 'index.html');
const indexUrl = pathToFileURL(indexPath).href;

// Читаем только рабочий каталог, из которого запущено приложение.
const workingDirectory = process.cwd();

function createApplicationMenu() {
  const template = [
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Обновить список',
          accelerator: 'CmdOrCtrl+R',
          click: (_menuItem, focusedWindow) => {
            const targetWindow =
              focusedWindow || BrowserWindow.getAllWindows()[0];

            if (targetWindow && !targetWindow.isDestroyed()) {
              targetWindow.webContents.send('refresh-directory');
            }
          }
        },
        {
          type: 'separator'
        },
        {
          role: 'quit',
          label: 'Выйти'
        }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        {
          role: 'toggleDevTools',
          label: 'Инструменты разработчика'
        },
        {
          type: 'separator'
        },
        {
          role: 'resetZoom',
          label: 'Обычный масштаб'
        },
        {
          role: 'zoomIn',
          label: 'Увеличить'
        },
        {
          role: 'zoomOut',
          label: 'Уменьшить'
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      role: 'appMenu'
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 700,
    minHeight: 500,
    title: 'Файловый обозреватель — Практическая работа № 3',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(indexPath);

  // Не разрешаем странице открывать новые окна.
  win.webContents.setWindowOpenHandler(() => ({
    action: 'deny'
  }));

  // Не разрешаем переходить с локального интерфейса на другие страницы.
  win.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });
}

ipcMain.handle('list-dir', async (event, dir) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);

  // Принимаем запросы только от главного фрейма нашего локального окна.
  if (
    !senderWindow ||
    event.senderFrame !== event.sender.mainFrame ||
    event.senderFrame.url !== indexUrl
  ) {
    throw new Error('Недопустимый источник запроса.');
  }

  // В этой работе интерфейсу разрешено читать только текущий каталог.
  if (dir !== '.') {
    throw new Error('Разрешено чтение только рабочего каталога.');
  }

  const entries = await fs.readdir(workingDirectory, {
    withFileTypes: true
  });

  return entries
    .map((entry) => ({
      name: entry.name,
      isDir: entry.isDirectory()
    }))
    .sort((a, b) => {
      if (a.isDir !== b.isDir) {
        return a.isDir ? -1 : 1;
      }

      return a.name.localeCompare(b.name, 'ru', {
        numeric: true
      });
    });
});

app.whenReady().then(() => {
  createWindow();
  createApplicationMenu();

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