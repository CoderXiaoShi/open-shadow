import { app, BrowserWindow, shell, ipcMain, Tray, Menu, nativeImage, screen } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'

declare module 'electron' {
  interface App {
    isQuitting: boolean
  }
}

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
let chatWin: BrowserWindow | null = null
let tray: Tray | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const winSize = 100
  const margin  = 100

  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    width: winSize,
    height: winSize,
    x: width  - winSize - margin,
    y: height - winSize - margin,
    frame: false,
    resizable: false,
    alwaysOnTop: false,
    skipTaskbar: true,
    transparent: true,
    webPreferences: {
      preload,
      webSecurity: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // 关闭窗口时隐藏到托盘，而非退出
  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      win?.hide()
    }
  })
}

function createTray() {
  const iconPath = path.join(process.env.VITE_PUBLIC, 'img.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setToolTip('智影')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    if (win) {
      win.isVisible() ? win.focus() : win.show()
    }
  })
}

app.whenReady().then(() => {
  createWindow()
  createTray()
})

// 打开聊天弹窗，定位在头像窗口左侧
ipcMain.on('open-chat-window', () => {
  if (!win) return

  // 已打开则聚焦
  if (chatWin && !chatWin.isDestroyed()) {
    chatWin.focus()
    return
  }

  const [x, y] = win.getPosition()
  const chatWidth  = 360
  const chatHeight = 520
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize

  const chatX = x - chatWidth - 8
  const chatY = Math.min(y, sh - chatHeight - 15)

  chatWin = new BrowserWindow({
    width: chatWidth,
    height: chatHeight,
    x: chatX,
    y: chatY,
    frame: false,
    resizable: false,
    alwaysOnTop: false,
    skipTaskbar: true,
    transparent: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload,
      webSecurity: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    chatWin.loadURL(`${VITE_DEV_SERVER_URL}#chat`)
  } else {
    chatWin.loadFile(indexHtml, { hash: 'chat' })
  }
  
  chatWin.webContents.openDevTools()
  chatWin.on('closed', () => {
    chatWin = null
  })
})

ipcMain.on('close-chat-window', () => {
  if (chatWin && !chatWin.isDestroyed()) {
    chatWin.close()
  }
})

app.on('window-all-closed', () => {
  win = null
  // 使用托盘时，不在所有窗口关闭时退出
})

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})
