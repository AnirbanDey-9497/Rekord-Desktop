import { app, ipcMain, desktopCapturer, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let studio;
let floatingWebCam;
function createWindow() {
  console.log("Creating main window...");
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
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  console.log("Main window created with ID:", win.id);
  console.log("Creating studio window...");
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
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  console.log("Studio window created with ID:", studio.id);
  console.log("Creating floating webcam window...");
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
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  console.log("Floating webcam window created with ID:", floatingWebCam.id);
  console.log("Setting window properties...");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setAlwaysOnTop(false, "screen-saver", 1);
  studio.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  studio.setAlwaysOnTop(false, "screen-saver", 1);
  win.webContents.on("did-finish-load", () => {
    console.log("Main window loaded");
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  studio.webContents.on("did-finish-load", () => {
    console.log("Studio window loaded");
    studio == null ? void 0 : studio.webContents.send(
      "main-process-message",
      (/* @__PURE__ */ new Date()).toLocaleString()
    );
    studio == null ? void 0 : studio.setSize(400, 250);
  });
  studio.webContents.on("console-message", (event, level, message, line, sourceId) => {
    console.log(`Studio window console [${level}]: ${message}`);
  });
  if (VITE_DEV_SERVER_URL) {
    console.log("Loading development URLs...");
    win.loadURL(VITE_DEV_SERVER_URL);
    studio.loadURL("http://localhost:5173/studio.html");
    floatingWebCam.loadURL("http://localhost:5173/floating-webcam.html");
  } else {
    console.log("Loading production files...");
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
    studio.loadFile(path.join(RENDERER_DIST, "studio.html"));
    floatingWebCam.loadFile(path.join(RENDERER_DIST, "floating-webcam.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
    studio = null;
    floatingWebCam = null;
  }
});
ipcMain.on("closeApp", () => {
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
      types: ["window", "screen"]
    });
    console.log("[Main] Desktop sources:", sources.map((s) => ({ id: s.id, name: s.name })));
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
  win == null ? void 0 : win.webContents.send("hide-plugin", payload);
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
});
ipcMain.on("hideOrCloseWindow", (event) => {
  const sender = event.sender;
  const allWindows = BrowserWindow.getAllWindows();
  const winToActOn = allWindows.find((w) => w.webContents.id === sender.id);
  if (!winToActOn) return;
  if (process.platform === "darwin") {
    winToActOn.hide();
  } else {
    winToActOn.close();
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
