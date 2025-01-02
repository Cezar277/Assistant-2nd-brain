const { Menu, app, BrowserWindow, session, ipcMain, dialog } = require("electron");
const prompt = require("electron-prompt");
const fs = require("fs");
const path = require("path");
const createCheckboxPrompt = require("./checkboxPrompt");

app.commandLine.appendSwitch('--enable-gpu-rasterization');
app.commandLine.appendSwitch('--force-gpu-rasterization');
app.commandLine.appendSwitch('--enable-zero-copy');

let win;
let userSettings;

const isMac = process.platform === "darwin";

const availableAIs = require("./settings.json").availableAIs;

console.log("Available AIs:", availableAIs);

const defaultSettings = {
  theme: "default.css",
  streamer: false,
  assistant: "ChatGPT",
};

const userDataPath = app.getPath("userData");
const configPath = path.join(userDataPath, "config.json");
const sessionFile = path.join(userDataPath, "sessions.json");

// Fonction pour configurer les cookies
function configureCookies() {
  session.defaultSession.clearCache(() => {
    console.log('Cache cleared');
  });

  session.defaultSession.clearStorageData({
    storages: ['cookies'],
    origin: 'https://www.deepseek.com',
  }, () => {
    console.log('Cookies cleared');
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'cookies') {
      callback(true);
    } else {
      callback(false);
    }
  });

  session.defaultSession.cookies.set({
    url: 'https://www.deepseek.com',
    name: 'cookie_name',
    value: 'cookie_value',
    expirationDate: new Date().getTime() / 1000 + 7 * 24 * 60 * 60, // 1 semaine
  }).then(() => {
    console.log('Cookie set successfully');
  }).catch((error) => {
    console.error('Failed to set cookie:', error);
  });
}

function changeAssistant(label, url, save = false, killCookies = false) {
  if (killCookies) {
    win.webContents.session.clearStorageData({ storages: ["cookies"] });
  }
  win.loadURL(url);

  if (save) {
    let currentSettings = { ...userSettings, ...loadUserPreferences() };
    currentSettings.assistant = label;
    userSettings = currentSettings;
    fs.writeFileSync(configPath, JSON.stringify(userSettings), "utf-8");
  }
}

function loadUserPreferences() {
  if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath, "utf-8");
    userSettings = JSON.parse(configFile);
  } else {
    fs.writeFileSync(configPath, JSON.stringify(defaultSettings));
    userSettings = defaultSettings;
  }
  return userSettings;
}

function changeUserTheme(name, reload = false) {
  let currentSettings = { ...userSettings, ...loadUserPreferences() };
  currentSettings.theme = name;
  userSettings = currentSettings;
  fs.writeFileSync(configPath, JSON.stringify(userSettings), "utf-8");

  const cssFile = path.join(userDataPath, name);
  if (fs.existsSync(cssFile)) {
    const cssContent = fs.readFileSync(cssFile, "utf8");
    win.webContents.insertCSS(cssContent);
  } else {
    fs.writeFileSync(cssFile, "");
    win.reload();
  }
  if (reload) win.reload();
}

function toggleStreamer() {
  let currentSettings = { ...userSettings, ...loadUserPreferences() };
  currentSettings.streamer = !currentSettings.streamer;
  userSettings = currentSettings;
  fs.writeFileSync(configPath, JSON.stringify(userSettings), "utf-8");
  win.reload();
}

function fetchThemes() {
  return fs
    .readdirSync(userDataPath)
    .filter((file) => path.extname(file) === ".css") || ["default.css"];
}

function getSessions() {
  if (fs.existsSync(sessionFile)) {
    return JSON.parse(fs.readFileSync(sessionFile)) || {};
  } else {
    fs.writeFileSync(sessionFile, "{}", "utf-8");
    return getSessions();
  }
}

function getSessionsNames() {
  return Object.keys(getSessions()) || [];
}

function removeSession(name) {
  const mutableSession = getSessions();
  if (mutableSession[name]) {
    delete mutableSession[name];
    fs.writeFileSync(sessionFile, JSON.stringify(mutableSession));
    setTimeout(() => win.reload(), 1000);
  }
}

function storeSession(name, session) {
  if (Object.keys(session).length) {
    const mutableSession = getSessions();
    session.cookies.get({}).then((cookies) => {
      mutableSession[name] = { cookies };
      fs.writeFileSync(sessionFile, JSON.stringify(mutableSession));
    });
  }
}

function loadSession(name, session) {
  const existingSessions = getSessions();
  const cookies = existingSessions[name]?.cookies || [];

  session.clearStorageData();
  cookies.forEach((cookie) => {
    const url = `https://${cookie.domain.replace(/^\./, "")}`;
    if (cookie.name.startsWith("__Secure-")) cookie.secure = true;
    if (cookie.name.startsWith("__Host-")) {
      cookie.secure = true;
      cookie.path = "/";
      delete cookie.domain;
      delete cookie.sameSite;
    }
    session.cookies
      .set({
        url,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        expirationDate: cookie.expirationDate,
      })
      .catch((error) => {
        console.error("Error while restoring cookie:", error);
      });
  });
  win.reload();
}

// Fonction pour ajouter une nouvelle IA
function addNewAIPrompt() {
  return async () => {
    // Demande le nom de l'IA
    const { response: nameResponse, checkboxChecked } = await dialog.showMessageBox({
      type: 'question',
      buttons: ['OK', 'Annuler'],
      title: 'Add a new AI',
      message: "Please enter the AI's name:",
      defaultId: 0,
      cancelId: 1,
      input: true
    });

    if (nameResponse === 1) return; // Annuler

    const aiName = dialog.getInputBoxResponse();
    if (!aiName || aiName.trim() === "") return;

    // Demande l'URL de l'IA
    const { response: urlResponse } = await dialog.showMessageBox({
      type: 'question',
      buttons: ['OK', 'Annuler'],
      title: 'Add a new AI',
      message: "Please enter the AI website link:",
      defaultId: 0,
      cancelId: 1,
      input: true
    });

    if (urlResponse === 1) return; // Annuler

    const aiUrl = dialog.getInputBoxResponse();
    if (!aiUrl || aiUrl.trim() === "") return;

    // Trouve le prochain ID disponible
    const nextId = availableAIs.reduce((maxId, ai) => (ai.id > maxId ? ai.id : maxId), 0) + 1;

    // Ajoute la nouvelle IA à la liste
    availableAIs.push({
      label: aiName,
      url: aiUrl,
      available: true,
      id: nextId,
    });

    // Sauvegarde les modifications dans settings.json
    fs.writeFileSync(
      path.join(__dirname, "settings.json"),
      JSON.stringify({ availableAIs }, null, 2)
    );

    // Envoie un message au renderer process pour mettre à jour la sidebar
    win.webContents.send('update-sidebar', availableAIs);
  };
}

// Gestionnaire IPC pour ajouter une nouvelle IA
ipcMain.on('open-add-ai', async () => {
  const addAI = addNewAIPrompt();
  await addAI();
});

// Gestionnaires IPC
ipcMain.on('open-change-ai', () => {
  console.log('Changer l\'IA');
  win.loadFile('accueil.html'); // Retour à l'accueil pour changer d'IA
});

ipcMain.on('open-save-session', async () => {
  try {
    const text = await prompt({
      title: 'Saving Current Session',
      label: 'Please choose a name:',
      inputAttrs: {
        type: 'text',
      },
      type: 'input',
    });

    if (text) {
      storeSession(text, session.defaultSession);
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la session :', error);
  }
});

ipcMain.on('open-delete-session', () => {
  console.log('Supprimer une session');
});

ipcMain.on('open-change-theme', () => {
  console.log('Changer le thème');
});

ipcMain.on('toggle-streamer-mode', () => {
  toggleStreamer();
});

ipcMain.on('open-add-ai', () => {
  addNewAIPrompt()();
});

// Fonction pour créer la fenêtre principale
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Disable web security to allow cross-origin requests
      allowRunningInsecureContent: true, // Allow insecure content (e.g., HTTP in HTTPS)
      sandbox: true, // Enable sandboxing for security
      webviewTag: true, // Activer l'utilisation de webview
      allowpopups: true,
      partition: 'persist:google-docs', // Partition pour les cookies
    },

    scrollBounce: false,
    scrollbarStyle: "hidden",
  });
  const ses = session.defaultSession;
  ses.cookies.set({
    url: 'https://www.google.com',
    name: 'cookie_name',
    value: 'cookie_value',
    expirationDate: new Date().getTime() + 365*24*60*60, // 1 semaine
  }).then(() => {
    console.log('Cookie set successfully');
  }).catch((err) => {
    console.error('Failed to set cookie:', err);
  });

  // Chargez l'écran d'accueil
  win.loadFile('accueil.html');

  // Ouvrez les outils de développement
  win.webContents.openDevTools();

  // Configurer les cookies
  configureCookies();

  // Communication avec le rendu
  ipcMain.handle('get-available-ais', () => {
    return availableAIs;
  });

  win.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    }
  );
}

app.commandLine.appendSwitch("disable-software-rasterizer");

app.whenReady().then(() => {
  createWindow();
});

app.on("activate", () => {
  if (win === null) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on('open-url', (event, url) => {
    let win = new BrowserWindow({
        center: true,
        resizable: true,
        webPreferences: {
            nodeIntegration: false,
            show: false
        }
    });

    win.maximize();
    win.loadURL(url);

    win.once('ready-to-show', () => {
        win.show();
    });

    win.on('closed', () => {
        win = null;
    });
});