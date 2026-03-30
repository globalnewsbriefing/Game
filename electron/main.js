const { app, BrowserWindow, dialog, shell } = require("electron");
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

function getDesktopBundleRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "desktop-dist");
  }

  return path.join(app.getAppPath(), "desktop-dist");
}

async function startBundledServer() {
  if (isDev) {
    return;
  }

  const bundleRoot = getDesktopBundleRoot();
  const serverPath = path.join(bundleRoot, "server.js");

  if (!fs.existsSync(serverPath)) {
    throw new Error(`Missing bundled server at ${serverPath}`);
  }

  nextServerProcess = spawn(process.execPath, [serverPath], {
    cwd: bundleRoot,
    stdio: "pipe",
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: port,
      HOSTNAME: "127.0.0.1",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    windowsHide: true,
  });

  nextServerProcess.stdout?.on("data", (chunk) => {
    process.stdout.write(chunk);
  });

  nextServerProcess.stderr?.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  nextServerProcess.on("exit", () => {
    nextServerProcess = null;
  });

  await waitForServer(`http://127.0.0.1:${port}`);
}

app.whenReady().then(async () => {
  try {
    await startBundledServer();
    createWindow();
  } catch (error) {
    dialog.showErrorBox(
      "Global News Briefing failed to start",
      error instanceof Error ? error.message : "The bundled local server could not be started.",
    );
    app.quit();
  }

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
