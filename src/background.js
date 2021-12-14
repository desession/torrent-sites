'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import TorrentPropertyStart from 'torrentproperty'
import path from 'path'
import AutoLaunch from 'auto-launch'
const isDevelopment = process.env.NODE_ENV !== 'production'
const autoLauncher = new AutoLaunch({
    name: "Torrenter"
})

autoLauncher.isEnabled().then(function(isEnabled){
  if(isEnabled){
    return
  } else {
    autoLauncher.enable()
  }
}).catch(function(err){
  console.log(err)
  // throw err
})


const TorrentProperty = TorrentPropertyStart('managed')
const torrentproperty = new TorrentProperty({takeOutInActive: true, storage: path.resolve(__dirname + '/../folder'), clean: true, check: false})

const handleRender = (event, data) => {
  // console.log(data)

  event.reply('start', path.sep)

  torrentproperty.on('error', error => {
    event.reply('error', error)
  })
  torrentproperty.on('updated', data => {
    event.reply('updated', data)
  })
  torrentproperty.on('deactivated', data => {
    event.reply('deactivated', data)
  })
  torrentproperty.on('same', data => {
    event.reply('same', data)
  })
  torrentproperty.on('frozen', data => {
    event.reply('frozen', data)
  })
  torrentproperty.on('removed', data => {
    event.reply('removed', data)
  })
  torrentproperty.on('more', data => {
    event.reply('more', data)
  })
  torrentproperty.on('checked', data => {
    event.reply('checked', data)
  })
}
ipcMain.on('start', handleRender)

ipcMain.on('counted', (event, data) => {
  event.reply('counted', {res: {torrents: torrentproperty.webtorrent.torrents.length, properties: torrentproperty.webproperty.properties.length}, main: data})
})

ipcMain.on('publish', (event, data) => {
  torrentproperty.publish(data.folder, {address: data.address, secret: data.secret}, data.sequence, {}, (error, mainData) => {
    if(error){
      event.reply('errorPub', {res: error, main: data})
    } else {
      mainData = {address: mainData.torrent.address, infoHash: mainData.torrent.infoHash, seq: mainData.torrent.seq, active: mainData.torrent.active, magnet: mainData.torrent.magnetLink, signed: mainData.torrent.signed, folder: mainData.torrent.path + path.sep + mainData.torrent.name, name: mainData.torrent.name, path: mainData.torrent.path, secret: mainData.data.secret}
      event.reply('publish', {res: mainData, main: data})
    }
  })
})
ipcMain.on('resolve', (event, data) => {
  torrentproperty.load(data, (error, mainData) => {
    if(error){
      console.log(error)
      event.reply('errorRes', {res: error, main: data})
    } else {
      console.log(mainData)
      mainData = mainData.torrent
      mainData = {address: mainData.address, infoHash: mainData.infoHash, seq: mainData.seq, active: mainData.active, name: mainData.name, folder: mainData.path + path.sep + mainData.name, signed: mainData.signed, path: mainData.path, magnet: mainData.magnetLink}
      event.reply('resolve', {res: mainData, main: data})
    }
  })
})
ipcMain.on('remove', (event, data) => {
  torrentproperty.remove(data, (error, main) => {
    if(error){
      event.reply('errorRem', {res: error, main: data})
    } else {
      event.reply('remove', {res: main, main: data})
    }
  })
})

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: false,
      
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
