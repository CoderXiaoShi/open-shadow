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

const API_BASE = 'http://localhost:3000'

interface Persona {
  name: string
  avatar_url: string
  [key: string]: unknown
}

let personaData: Persona | null = null

async function fetchPersona() {
  try {
    const res = await fetch(`${API_BASE}/api/persona`)
    const json = await res.json()
    console.log('[persona] fetch:', json)
    if (json.code !== 200 || !json.data) return
    personaData = json.data

    if (tray) {
      tray.setToolTip(personaData!.name || '智影')

      const avatarUrl = personaData!.avatar_url
      if (avatarUrl) {
        const fullUrl = avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE}${avatarUrl}`
        const imgRes = await fetch(fullUrl)
        const buffer = Buffer.from(await imgRes.arrayBuffer())
        const image = nativeImage.createFromBuffer(buffer).resize({ width: 32, height: 32 })
        tray.setImage(image)
      }
    }
  } catch (e) {
    console.error('[persona] fetch failed:', e)
  }
}

ipcMain.handle('get-persona', () => personaData)

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
      nodeIntegration: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(indexHtml)
  }
  
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
    // win.webContents.openDevTools()
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
  fetchPersona()
})

// 打开聊天弹窗，定位在头像窗口左侧
ipcMain.on('open-chat-window', () => {
  if (!win) return

  const [x, y] = win.getPosition()
  const chatWidth  = 360
  const chatHeight = 520
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const chatX = x - chatWidth - 8
  const chatY = Math.min(y, sh - chatHeight - 15)

  // 已存在：隐藏中则重新定位并显示，可见则聚焦
  if (chatWin && !chatWin.isDestroyed()) {
    chatWin.setPosition(chatX, chatY)
    chatWin.isVisible() ? chatWin.focus() : chatWin.show()
    return
  }

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
      nodeIntegration: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    chatWin.loadURL(`${VITE_DEV_SERVER_URL}#chat`)
  } else {
    chatWin.loadFile(indexHtml, { hash: 'chat' })
  }
  
  // chatWin.webContents.openDevTools()
  chatWin.on('closed', () => {
    chatWin = null
  })
})

ipcMain.on('close-chat-window', () => {
  if (chatWin && !chatWin.isDestroyed()) {
    chatWin.hide()
  }
})

let dragInterval: ReturnType<typeof setInterval> | null = null

ipcMain.on('start-drag', () => {
  if (!win) return
  const [initX, initY] = win.getPosition()
  const initCursor = screen.getCursorScreenPoint()

  if (dragInterval) clearInterval(dragInterval)

  dragInterval = setInterval(() => {
    if (!win) return
    const cursor = screen.getCursorScreenPoint()
    win.setSize(100, 100);
    win.setPosition(
      initX + cursor.x - initCursor.x,
      initY + cursor.y - initCursor.y,
      false
    )
  }, 16)
})

ipcMain.on('stop-drag', () => {
  if (dragInterval) {
    clearInterval(dragInterval)
    dragInterval = null
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
