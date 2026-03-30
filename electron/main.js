const { app, BrowserWindow, shell } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");
const fs = require("node:fs");

const isDev = !app.isPackaged;
const port = process.env.PORT || "3000";
let nextServerProcess = null;

function waitForServer(url, timeoutMs = 60000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }

        setTimeout(attempt, 500);
      });
    };

    attempt();
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: "#06111f",
    autoHideMenuBar: true,
    title: "Global News Briefing",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);
}

async function startBundledServer() {
  if (isDev) {
    return;
  }

  const resourcesRoot = app.isPackaged
    ? process.resourcesPath
    : path.join(app.getAppPath(), ".next");
  const standaloneRoot = path.join(resourcesRoot, "app.asar.unpacked", ".next", "standalone");
  const fallbackRoot = path.join(resourcesRoot, ".next", "standalone");
  const serverRoot = fs.existsSync(path.join(standaloneRoot, "server.js")) ? standaloneRoot : fallbackRoot;
  const serverPath = path.join(serverRoot, "server.js");
  const appRoot = path.dirname(serverPath);

  nextServerProcess = spawn(process.execPath, [serverPath], {
    cwd: appRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: port,
      HOSTNAME: "127.0.0.1",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });

  nextServerProcess.on("exit", () => {
    nextServerProcess = null;
  });

  await waitForServer(`http://127.0.0.1:${port}`);
}

app.whenReady().then(async () => {
  await startBundledServer();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextServerProcess) {
    nextServerProcess.kill("SIGTERM");
  }
});
