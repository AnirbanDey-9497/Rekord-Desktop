import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron'

import { fileURLToPath } from 'node:url'
import path from 'node:path'


const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let studio: BrowserWindow | null;
let floatingWebCam: BrowserWindow | null;

function createWindow() {
  console.log('Creating main window...');
  win = new BrowserWindow({
    width: 600,
    height: 600,
    minHeight: 600,
    minWidth: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    focusable: true,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, "preload.mjs"),
    },
  });
  console.log('Main window created with ID:', win.id);

  console.log('Creating studio window...');
  studio = new BrowserWindow({
    width: 400,
    height: 50,
    minHeight: 70,
    maxHeight: 400,
    minWidth: 300,
    maxWidth: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    focusable: true,
    movable: true,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, "preload.mjs"),
    },
  });
  console.log('Studio window created with ID:', studio.id);

  console.log('Creating floating webcam window...');
  floatingWebCam = new BrowserWindow({
    width: 400,
    height: 200,
    minHeight: 70,
    maxHeight: 400,
    minWidth: 300,
    maxWidth: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    focusable: false,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, "preload.mjs"),
    },
  });
  console.log('Floating webcam window created with ID:', floatingWebCam.id);

  console.log('Setting window properties...');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setAlwaysOnTop(false, "screen-saver", 1);
  studio.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  studio.setAlwaysOnTop(false, "screen-saver", 1);
  floatingWebCam.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  floatingWebCam.setAlwaysOnTop(true, "screen-saver", 1);

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    console.log('Main window loaded');
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  studio.webContents.on("did-finish-load", () => {
    console.log('Studio window loaded');
    studio?.webContents.send(
      "main-process-message",
      new Date().toLocaleString()
    );
    // Set initial size after window loads
    studio?.setSize(400, 250);
  });

  studio.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`Studio window console [${level}]: ${message}`);
  });

  if (VITE_DEV_SERVER_URL) {
    console.log('Loading development URLs...');
    win.loadURL(VITE_DEV_SERVER_URL)
    studio.loadURL("http://localhost:5173/studio.html");
    floatingWebCam.loadURL("http://localhost:5173/floating-webcam.html");
  } else {
    console.log('Loading production files...');
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    studio.loadFile(path.join(RENDERER_DIST, 'studio.html'))
    floatingWebCam.loadFile(path.join(RENDERER_DIST, 'floating-webcam.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
    studio = null
    floatingWebCam = null
  }
})

ipcMain.on("closeApp", () => {
  //only works on windows, mac does not need this
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
    studio = null;
    floatingWebCam = null;
  }
});

ipcMain.handle("getSources", async () => {
  try {
    console.log("[Main] Getting desktop sources");
    const sources = await desktopCapturer.getSources({
      thumbnailSize: { height: 100, width: 150 },
      fetchWindowIcons: true,
      types: ["window", "screen"],
    });
    console.log("[Main] Desktop sources:", sources.map(s => ({ id: s.id, name: s.name })));
    return sources;
  } catch (error) {
    console.error("[Main] Error getting sources:", error);
    throw error;
  }
});

ipcMain.on("media-sources", (event, payload) => {
  try {
    console.log("[Main] Received media sources from renderer:", payload);
    if (!studio) {
      console.error("[Main] Studio window not available");
      return;
    }
    if (!payload || !payload.screen || !payload.audio || !payload.id) {
      console.error("[Main] Invalid media sources payload:", payload);
      return;
    }
    console.log("[Main] Sending media sources to studio window");
    studio.webContents.send("profile-received", payload);
  } catch (error) {
    console.error("[Main] Error handling media sources:", error);
  }
});

ipcMain.on("resize-studio", (event, payload) => {
  try {
    console.log("[Main] Resizing studio window:", payload);
    if (!studio) {
      console.error("[Main] Studio window not available");
      return;
    }
    if (payload.shrink) {
      studio.setSize(400, 100);
    }
    if (!payload.shrink) {
      studio.setSize(400, 250);
    }
  } catch (error) {
    console.error("[Main] Error resizing studio window:", error);
  }
});

ipcMain.on("hide-plugin", (event, payload) => {
  console.log(event);
  win?.webContents.send("hide-plugin", payload);
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow();
});

ipcMain.on("hideOrCloseWindow", (event) => {
  const sender = event.sender;
  const allWindows = BrowserWindow.getAllWindows();
  const winToActOn = allWindows.find(w => w.webContents.id === sender.id);
  if (!winToActOn) return;
  if (process.platform === "darwin") {
    winToActOn.hide();
  } else {
    winToActOn.close();
  }
});
