const {app, BrowserWindow, ipcMain, Tray} = require('electron')
const path = require('path')

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, 
      enableRemoteModule: false
    },
    icon: path.join(__dirname, '/Users/somebody/images/window.png'),
    title: 'SolarCoin Key Converter'
  })

  mainWindow.loadFile(path.join(__dirname,'index.html'))
}

app.whenReady().then(() => {
  const appIcon = new Tray(path.join(__dirname, 'img/logo.png'))
  app.dock.setIcon(path.join(__dirname, 'img/logo.png'))
  createWindow()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
const { runKeyConvert } = require(path.join(__dirname,'./keyconvert'))

ipcMain.on('convert-key-request', (event, ...args) => {
  console.log('converting key')
  console.log(event)
  console.log(args)
  let response
  try {
    response = runKeyConvert(args[0])
  } catch {
    response = { 
      privkey: args[0],
      ethprivkey: "Error converting private key.",
      ethaddress: "",
      slraddress: "",
      pubkey: ""
    }
  }
  
  mainWindow.webContents.send('convert-key-response', response)
})