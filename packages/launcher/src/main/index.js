// @flow

import path from 'path'
import url from 'url'
import Client, { type VaultSettings } from '@mainframe/client'
import { Environment, DaemonConfig, VaultConfig } from '@mainframe/config'
import StreamRPC from '@mainframe/rpc-stream'
import { app, BrowserWindow, WebContents, ipcMain, Menu } from 'electron'
import { is } from 'electron-util'
import {
  startServer as startDaemon,
  stopServer as stopDaemon,
} from '@mainframe/daemon'

import { APP_TRUSTED_REQUEST_CHANNEL } from '../constants'
import type { AppSession } from '../types'

import { AppContext, LauncherContext } from './contexts'
import { interceptWebRequests } from './permissions'
import { registerStreamProtocol } from './storage'
import createElectronTransport from './createElectronTransport'
import createRPCChannels from './rpc/createChannels'

const PORT = process.env.ELECTRON_WEBPACK_WDS_PORT || ''

const envType =
  process.env.NODE_ENV === 'production' ? 'production' : 'development'

const envName = process.env.MAINFRAME_ENV || `v030-${envType}`

// Get existing env or create with specified type
const env = Environment.get(envName, envType)

// eslint-disable-next-line no-console
console.log(`using environment "${env.name}" (${env.type})`)

const daemonConfig = new DaemonConfig(env)
const vaultConfig = new VaultConfig(env)

let client
let launcherWindow
let localDaemon = false

if (envType === 'production') {
  if (app.requestSingleInstanceLock()) {
    app.on('second-instance', () => {
      // Someone tried to run a second instance, we should focus our window.
      if (launcherWindow) {
        if (launcherWindow.isMinimized()) launcherWindow.restore()
        launcherWindow.focus()
      }
    })
  } else {
    app.exit()
  }
}

type AppContexts = { [appID: string]: { [userID: string]: AppContext } }

const appContexts: AppContexts = {}
const contextsBySandbox: WeakMap<WebContents, AppContext> = new WeakMap()
const contextsByWindow: WeakMap<BrowserWindow, AppContext> = new WeakMap()

const newWindow = (params: Object = {}) => {
  const window = new BrowserWindow({
    minWidth: 1020,
    minHeight: 702,
    width: 1020,
    height: 702,
    show: false,
    titleBarStyle: 'hidden',
    title: 'Mainframe',
    icon:
      process.platform === 'linux'
        ? path.join(__dirname, '/build/icon/Icon-512x512.png')
        : undefined,
    ...params,
  })

  if (is.development) {
    window.loadURL(`http://localhost:${PORT}`)
  } else {
    const formattedUrl = url.format({
      pathname: path.join(__dirname, `index.html`),
      protocol: 'file:',
      slashes: true,
    })
    window.loadURL(formattedUrl)
  }
  // hide the menu (Win and Linux)
  window.setAutoHideMenuBar(true)

  return window
}

const template = [
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteandmatchstyle' },
      { role: 'delete' },
      { role: 'selectall' },
    ],
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  {
    role: 'window',
    submenu: [{ role: 'minimize' }, { role: 'close' }],
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click() {
          require('electron').shell.openExternal('https://mainframeos.com')
        },
      },
    ],
  },
]

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ],
  })

  // Edit menu
  template[1].submenu.push(
    { type: 'separator' },
    {
      label: 'Speech',
      submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }],
    },
  )

  // Window menu
  template[3].submenu = [
    { role: 'close' },
    { role: 'minimize' },
    { role: 'zoom' },
    { type: 'separator' },
    { role: 'front' },
  ]
}

// App Lifecycle

const launchApp = async (
  appSession: AppSession,
  vaultSettings: VaultSettings,
) => {
  const appID = appSession.app.appID
  const userID = appSession.user.id
  const appOpen = appContexts[appID] && appContexts[appID][userID]
  if (appOpen) {
    const appWindow = appContexts[appID][userID].window
    if (appWindow.isMinimized()) {
      appWindow.restore()
    }
    appWindow.show()
    appWindow.focus()
    return
  }

  const appWindow = newWindow({ title: appSession.app.manifest.name })

  if (appSession.isDev) {
    appWindow.webContents.on('did-attach-webview', () => {
      // Open a separate developer tools window for the app
      appWindow.webContents.executeJavaScript(
        `document.getElementById('sandbox-webview').openDevTools()`,
      )
    })
  }
  appWindow.on('closed', async () => {
    await client.app.close({ sessID: appSession.session.sessID })
    const ctx = contextsByWindow.get(appWindow)
    if (ctx != null) {
      await ctx.clear()
      contextsByWindow.delete(appWindow)
    }
    delete appContexts[appID][userID]
  })

  const appContext = new AppContext({
    appSession,
    client,
    trustedRPC: new StreamRPC(
      createElectronTransport(appWindow, APP_TRUSTED_REQUEST_CHANNEL),
    ),
    window: appWindow,
    settings: vaultSettings,
  })
  contextsByWindow.set(appWindow, appContext)

  appWindow.webContents.on('did-attach-webview', (event, webContents) => {
    webContents.on('destroyed', () => {
      contextsBySandbox.delete(webContents)
      appContext.sandbox = null
    })

    contextsBySandbox.set(webContents, appContext)
    appContext.sandbox = webContents

    interceptWebRequests(appContext, webContents.session)
  })

  if (appContexts[appID]) {
    appContexts[appID][userID] = appContext
  } else {
    // $FlowFixMe: can't assign ID type
    appContexts[appID] = { [userID]: appContext }
  }

  appWindow.webContents.on('did-attach-webview', (event, webContents) => {
    // Open a separate developer tools window for the app
    appContext.sandbox = webContents
    registerStreamProtocol(appContext)
    if (is.development) {
      appWindow.webContents.executeJavaScript(
        `document.getElementById('sandbox-webview').openDevTools()`,
      )
    }
  })

  appWindow.on('closed', async () => {
    await client.app.close({ sessID: appSession.session.sessID })
    const ctx = contextsByWindow.get(appWindow)
    if (ctx != null) {
      await ctx.clear()
      contextsByWindow.delete(appWindow)
    }
    delete appContexts[appID][userID]
  })
}

// TODO: proper setup, this is just temporary logic to simplify development flow
const setupClient = async () => {
  // First launch flow: initial setup

  const isMac = process.platform === 'darwin'

  if (isMac) {
    const fixPath = require('fix-path')
    fixPath()
  }

  if (envType === 'production') {
    await shutdownDaemon()
  }

  // Start daemon and connect local client to it
  if (daemonConfig.runStatus !== 'running') {
    daemonConfig.runStatus = 'stopped'
    await startDaemon(env.name)
    localDaemon = true
  }

  daemonConfig.runStatus = 'running'
  client = new Client(daemonConfig.socketPath)

  // Simple check for API call, not proper versioning logic
  const version = await client.apiVersion()
  if (version !== 0.1) {
    throw new Error('Unexpected API version')
  }
}

const createLauncherWindow = async () => {
  await setupClient()

  launcherWindow = newWindow({
    width: 1024,
    height: 768,
    minWidth: 900,
    minHeight: 600,
  })

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  const launcherContext = new LauncherContext({
    client,
    launchApp,
    vaultConfig,
    window: launcherWindow,
  })
  createRPCChannels(launcherContext, contextsBySandbox, contextsByWindow)

  // Emitted when the window is closed.
  launcherWindow.on('closed', async () => {
    // TODO: fix below to not error on close
    // const keys = Object.keys(appWindows)
    // Object.keys(appWindows).forEach(w => {
    //   appWindows[w].close()
    // })
    launcherWindow = null
    await launcherContext.clear()
  })
}

const shutdownDaemon = async () => {
  daemonConfig.runStatus = 'stopped'
  await stopDaemon(env.name)
}

app.on('ready', createLauncherWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (launcherWindow === null) {
    createLauncherWindow()
  }
})

app.on('will-quit', async event => {
  event.preventDefault()
  client.close()
  if (localDaemon) {
    await shutdownDaemon()
  }
  app.exit()
})

// Window lifecycle events

ipcMain.on('init-window', event => {
  const window = BrowserWindow.fromWebContents(event.sender)
  window.setAutoHideMenuBar(true)

  if (window === launcherWindow) {
    window.webContents.send('start', { type: 'launcher' })
  } else {
    const appContext = contextsByWindow.get(window)
    if (appContext != null) {
      window.webContents.send('start', {
        type: 'app',
        appSession: appContext.appSession,
        partition: `persist:${appContext.appSession.app.appID}/${
          appContext.appSession.user.id
        }`,
      })
    }
  }
})

ipcMain.on('ready-window', event => {
  BrowserWindow.fromWebContents(event.sender).show()
})
