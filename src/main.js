import { app } from 'electron';
import setupElectronReload from 'electron-reload';

import { setupErrorHandling } from './errorHandling';
import appData from './main/appData';
import './main/basicAuth';
import { processDeepLink } from './main/deepLinks';
import { getMainWindow } from './main/mainWindow';
import { setupI18next } from './i18n';

export { default as dock } from './main/dock';
export { default as menus } from './main/menus';
export { default as tray } from './main/tray';
export { default as certificate } from './main/certificateStore';

if (process.env.NODE_ENV) {
	setupElectronReload(__dirname, {
		electron: process.execPath,
	});
}

async function prepareApp() {
	setupErrorHandling('main');

	app.setAsDefaultProtocolClient('rocketchat');
	app.setAppUserModelId('chat.rocket');

	await appData.initialize();

	const canStart = process.mas || app.requestSingleInstanceLock();

	if (!canStart) {
		app.quit();
		return false;
	}

	app.commandLine.appendSwitch('--autoplay-policy', 'no-user-gesture-required');

	// TODO: make it a setting
	if (process.platform === 'linux') {
		app.disableHardwareAcceleration();
	}

	app.on('window-all-closed', () => {
		app.quit();
	});

	app.on('open-url', (event, url) => {
		event.preventDefault();
		processDeepLink(url);
	});

	app.on('second-instance', (event, argv) => {
		argv.slice(2).forEach(processDeepLink);
	});

	return true;
}

(async () => {
	if (!await prepareApp()) {
		return;
	}

	await app.whenReady();
	await setupI18next();
	app.emit('start');
	await getMainWindow();
	process.argv.slice(2).forEach(processDeepLink);
})();
