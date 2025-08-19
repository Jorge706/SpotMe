const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,  
      webviewTag: true,
      allowRunningInsecureContent: true,
      webSecurity: false,
    },
  });

  win.webContents.openDevTools()
  win.setMenu(null);      
  win.maximize();         
  win.show();     

  win.loadURL('http://localhost:5173');
  // win.loadFile(path.join(__dirname, 'renderer/dist/index.html'));;
}


app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
