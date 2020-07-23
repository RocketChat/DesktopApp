import { dialog } from 'electron';
import { t } from 'i18next';

export const askForAppDataReset = async (rootWindow) => {
	const { response } = await dialog.showMessageBox(rootWindow, {
		type: 'question',
		buttons: [t('dialog.resetAppData.yes'), t('dialog.resetAppData.cancel')],
		defaultId: 1,
		title: t('dialog.resetAppData.title'),
		message: t('dialog.resetAppData.message'),
	});

	return response === 0;
};

export const askForServerAddition = async (rootWindow, serverUrl) => {
	const { response } = await dialog.showMessageBox(rootWindow, {
		type: 'question',
		buttons: [t('dialog.addServer.add'), t('dialog.addServer.cancel')],
		defaultId: 0,
		title: t('dialog.addServer.title'),
		message: t('dialog.addServer.message', { host: serverUrl }),
	});

	return response === 0;
};

export const warnAboutInvalidServerUrl = (/* rootWindow, serverUrl, reason */) => {
	throw Error('unimplemented');
};