'use strict'
/**
 * Configuration
 */

const path = require('path'),
  { app } = require('electron'),
  { is } = require('electron-util')

const CONFIG = {
  LOAD_URL: `file://${path.join(__dirname, '../app/index.html')}`,
  WS_URI: 'wss://spacedrop.xyz',
  DB_PATH: path.join(app.getPath('userData'), 'spacedrop.db'),
  DROPS_DIR: path.join(app.getPath('userData'), 'drops'),
  MAIN_WIN_WIDTH: 875,
  MAIN_WIN_HEIGHT: 500
}

const CONFIG_DEV = {
  ...CONFIG,
  LOAD_URL: 'http://localhost:9000',
  WS_URI: 'ws://localhost:7000',
  MAIN_WIN_WIDTH: 875,
  MAIN_WIN_HEIGHT: 500
}

module.exports = is.development ? CONFIG_DEV : CONFIG
