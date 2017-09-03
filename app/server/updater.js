'use strict';

// Packages
const autoUpdater = require('electron-updater').autoUpdater;
const {ipcMain, app} = require('electron');
const log = require('electron-log');

// Ours
const {isDev} = require('./util');

autoUpdater.logger = log;

module.exports = function (mainWindow) {
	if (isDev) {
		return;
	}

	autoUpdater.on('update-downloaded', info => {
		mainWindow.webContents.send('updateDownloaded', info);
	});

	app.on('ready', () => {
		autoUpdater.checkForUpdates();
	});

	ipcMain.on('installUpdateNow', () => {
		autoUpdater.quitAndInstall();
	});
};
