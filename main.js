const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        autoHideMenuBar: true, // Oculta la barra de menú superior (Archivo, Editar, etc.)
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Carga el archivo HTML principal de tu juego
    mainWindow.loadFile('index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// Habilita el audio automáticamente sin restricciones de interacción
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});