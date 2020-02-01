import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';
import { remote, shell, clipboard } from 'electron';

import {
	WEBVIEW_UNREAD_CHANGED,
	WEBVIEW_TITLE_CHANGED,
	WEBVIEW_FOCUS_REQUESTED,
	WEBVIEW_SIDEBAR_STYLE_CHANGED,
	WEBVIEW_DID_NAVIGATE,
	WEBVIEW_FOCUSED,
	WEBVIEW_SCREEN_SHARING_SOURCE_REQUESTED,
	SIDE_BAR_RELOAD_SERVER_CLICKED,
	SIDE_BAR_OPEN_DEVTOOLS_FOR_SERVER_CLICKED,
	TOUCH_BAR_FORMAT_BUTTON_TOUCHED,
	SCREEN_SHARING_DIALOG_SOURCE_SELECTED,
	MENU_BAR_RELOAD_SERVER_CLICKED,
	MENU_BAR_OPEN_DEVTOOLS_FOR_SERVER_CLICKED,
	MENU_BAR_GO_BACK_CLICKED,
	MENU_BAR_GO_FORWARD_CLICKED,
	MENU_BAR_CLEAR_TRUSTED_CERTIFICATES_CLICKED,
	CERTIFICATE_TRUST_REQUESTED,
	WEBVIEW_CERTIFICATE_TRUSTED,
	WEBVIEW_CERTIFICATE_DENIED,
	WEBVIEW_FAVICON_CHANGED,
} from '../scripts/actions';
import {
	getSpellCheckingCorrections,
	getSpellCheckingDictionaries,
	getSpellCheckingDictionariesPath,
	getEnabledSpellCheckingDictionaries,
	installSpellCheckingDictionaries,
	enableSpellCheckingDictionaries,
	disableSpellCheckingDictionaries,
	getMisspelledWords,
} from '../scripts/spellChecking';

const createSpellCheckingMenuTemplate = (root, t, {
	isEditable,
	corrections,
	dictionaries,
	dictionariesPath,
	enabledDictionaries,
	installDictionaries,
	enableSpellCheckingDictionary,
	disableSpellCheckingDictionary,
}) => {
	if (!isEditable) {
		return [];
	}

	const handleBrowserForLanguage = async () => {
		const { filePaths } = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
			title: t('dialog.loadDictionary.title'),
			defaultPath: dictionariesPath,
			filters: [
				{ name: t('dialog.loadDictionary.dictionaries'), extensions: ['bdic'] },
				{ name: t('dialog.loadDictionary.allFiles'), extensions: ['*'] },
			],
			properties: ['openFile', 'multiSelections'],
		});

		try {
			await installDictionaries(filePaths);
		} catch (error) {
			console.error(error);
			remote.dialog.showErrorBox(
				t('dialog.loadDictionaryError.title'),
				t('dialog.loadDictionaryError.message', { message: error.message }),
			);
		}
	};

	return [
		...corrections ? [
			...corrections.length === 0
				? [
					{
						label: t('contextMenu.noSpellingSuggestions'),
						enabled: false,
					},
				]
				: corrections.slice(0, 6).map((correction) => ({
					label: correction,
					click: () => root.getWebContents().replaceMisspelling(correction),
				})),
			...corrections.length > 6 ? [
				{
					label: t('contextMenu.moreSpellingSuggestions'),
					submenu: corrections.slice(6).map((correction) => ({
						label: correction,
						click: () => root.getWebContents().replaceMisspelling(correction),
					})),
				},
			] : [],
			{
				type: 'separator',
			},
		] : [],
		{
			label: t('contextMenu.spellingLanguages'),
			enabled: dictionaries.length > 0,
			submenu: [
				...dictionaries.map((dictionaryName) => ({
					label: dictionaryName,
					type: 'checkbox',
					checked: enabledDictionaries.includes(dictionaryName),
					click: ({ checked }) => (checked
						? enableSpellCheckingDictionary(dictionaryName)
						: disableSpellCheckingDictionary(dictionaryName)),
				})),
				{
					type: 'separator',
				},
				{
					label: t('contextMenu.browseForLanguage'),
					click: handleBrowserForLanguage,
				},
			],
		},
		{
			type: 'separator',
		},
	];
};

const createImageMenuTemplate = (root, t, {
	mediaType,
	srcURL,
}) => (
	mediaType === 'image'
		? [
			{
				label: t('contextMenu.saveImageAs'),
				click: () => root.getWebContents().downloadURL(srcURL),
			},
			{
				type: 'separator',
			},
		]
		: []
);

const createLinkMenuTemplate = (root, t, {
	linkURL,
	linkText,
}) => (
	linkURL
		? [
			{
				label: t('contextMenu.openLink'),
				click: () => shell.openExternal(linkURL),
			},
			{
				label: t('contextMenu.copyLinkText'),
				click: () => clipboard.write({ text: linkText, bookmark: linkText }),
				enabled: !!linkText,
			},
			{
				label: t('contextMenu.copyLinkAddress'),
				click: () => clipboard.write({ text: linkURL, bookmark: linkText }),
			},
			{
				type: 'separator',
			},
		]
		: []
);

const createDefaultMenuTemplate = (root, t, {
	editFlags: {
		canUndo = false,
		canRedo = false,
		canCut = false,
		canCopy = false,
		canPaste = false,
		canSelectAll = false,
	} = {},
} = {}) => [
	{
		label: t('contextMenu.undo'),
		role: 'undo',
		accelerator: 'CommandOrControl+Z',
		enabled: canUndo,
	},
	{
		label: t('contextMenu.redo'),
		role: 'redo',
		accelerator: process.platform === 'win32' ? 'Control+Y' : 'CommandOrControl+Shift+Z',
		enabled: canRedo,
	},
	{
		type: 'separator',
	},
	{
		label: t('contextMenu.cut'),
		role: 'cut',
		accelerator: 'CommandOrControl+X',
		enabled: canCut,
	},
	{
		label: t('contextMenu.copy'),
		role: 'copy',
		accelerator: 'CommandOrControl+C',
		enabled: canCopy,
	},
	{
		label: t('contextMenu.paste'),
		role: 'paste',
		accelerator: 'CommandOrControl+V',
		enabled: canPaste,
	},
	{
		label: t('contextMenu.selectAll'),
		role: 'selectall',
		accelerator: 'CommandOrControl+A',
		enabled: canSelectAll,
	},
];

const computeProps = (params) => {
	const { selectionText } = params;
	return {
		...params,
		corrections: getSpellCheckingCorrections(selectionText),
		dictionaries: getSpellCheckingDictionaries(),
		dictionariesPath: getSpellCheckingDictionariesPath(),
		enabledDictionaries: getEnabledSpellCheckingDictionaries(),
		installDictionaries: (...args) => installSpellCheckingDictionaries(...args),
		enableSpellCheckingDictionary: (...args) => enableSpellCheckingDictionaries(...args),
		disableSpellCheckingDictionary: (...args) => disableSpellCheckingDictionaries(...args),
	};
};

export function WebUiView({
	active = false,
	failed = false,
	hasSidebar = false,
	lastPath,
	url,
	dispatch,
	subscribe,
	onLoad,
	onFail,
}) {
	const { t } = useTranslation();

	const [root] = useState(() => {
		const root = document.createElement('webview');
		document.body.append(root);
		return root;
	});

	useEffect(() => {
		root.classList.add('webview');
		root.setAttribute('preload', '../preload.js');
		root.toggleAttribute('allowpopups', true);
		root.toggleAttribute('disablewebsecurity', false);
		root.setAttribute('enableremotemodule', 'true');
	}, []);

	useEffect(() => {
		root.classList.toggle('active', active);

		if (active) {
			root.focus();
		}
	}, [active]);

	useEffect(() => {
		const handleWindowFocus = () => {
			if (!active) {
				return;
			}

			root.focus();
		};

		window.addEventListener('focus', handleWindowFocus);

		return () => {
			window.removeEventListener('focus', handleWindowFocus);
		};
	}, [active]);

	useEffect(() => {
		root.classList.toggle('hidden', failed);
		root.classList.toggle('failed', failed);
	}, [failed]);

	const prevFailedRef = useRef(failed);

	useEffect(() => {
		if (prevFailedRef.current === failed) {
			return;
		}

		if (!failed) {
			root.loadURL(url);
		}

		prevFailedRef.current === failed;
	}, [url, failed]);

	useEffect(() => {
		const webContentsId = root.getWebContents().id;

		const handleFocus = () => {
			dispatch({ type: WEBVIEW_FOCUSED, payload: { webContentsId, url } });
		};

		root.addEventListener('focus', handleFocus);

		return () => {
			root.removeEventListener('focus', handleFocus);
		};
	}, [url]);

	useEffect(() => {
		const handleContextMenu = async (event) => {
			const props = await computeProps(event.params);

			const template = [
				...createSpellCheckingMenuTemplate(root, t, props),
				...createImageMenuTemplate(root, t, props),
				...createLinkMenuTemplate(root, t, props),
				...createDefaultMenuTemplate(root, t, props),
			];

			const menu = remote.Menu.buildFromTemplate(template);
			menu.popup({ window: remote.getCurrentWindow() });
		};

		root.addEventListener('context-menu', handleContextMenu);

		return () => {
			root.removeEventListener('context-menu', handleContextMenu);
		};
	}, []);

	useEffect(() => {
		const handleDidNavigateInPage = (event) => {
			dispatch({ type: WEBVIEW_DID_NAVIGATE, payload: { url, pageUrl: event.url } });
		};

		root.addEventListener('did-navigate-in-page', handleDidNavigateInPage);

		return () => {
			root.removeEventListener('did-navigate-in-page', handleDidNavigateInPage);
		};
	}, [url]);

	const [ready, setReady] = useState(false);

	useEffect(() => {
		const handleDomReady = () => {
			setReady(true);
		};

		root.addEventListener('dom-ready', handleDomReady);

		return () => {
			root.removeEventListener('dom-ready', handleDomReady);
		};
	}, []);

	useEffect(() => {
		root.classList.toggle('ready', ready);
	}, [ready]);

	useEffect(() => {
		const webContentsId = root.getWebContents().id;

		const handleIpcMessage = (event) => {
			switch (event.channel) {
				case 'get-sourceId':
					dispatch({ type: WEBVIEW_SCREEN_SHARING_SOURCE_REQUESTED, payload: { webContentsId, url } });
					break;

				case 'unread-changed':
					dispatch({ type: WEBVIEW_UNREAD_CHANGED, payload: { webContentsId, url, badge: event.args[0] } });
					break;

				case 'title-changed':
					dispatch({ type: WEBVIEW_TITLE_CHANGED, payload: { webContentsId, url, title: event.args[0] } });
					break;

				case 'focus':
					dispatch({ type: WEBVIEW_FOCUS_REQUESTED, payload: { webContentsId, url } });
					break;

				case 'sidebar-style':
					dispatch({ type: WEBVIEW_SIDEBAR_STYLE_CHANGED, payload: { webContentsId, url, style: event.args[0] } });
					break;

				case 'get-misspelled-words':
					root.send('misspelled-words', JSON.stringify(event.args[0]), getMisspelledWords(event.args[0]));
					break;

				case 'favicon-changed':
					dispatch({ type: WEBVIEW_FAVICON_CHANGED, payload: { webContentsId, url, favicon: event.args[0] } });
					break;
			}
		};

		root.addEventListener('ipc-message', handleIpcMessage);

		return () => {
			root.removeEventListener('ipc-message', handleIpcMessage);
		};
	}, []);

	useEffect(() => {
		const handleDidFinishLoad = () => {
			onLoad && onLoad();
		};

		root.addEventListener('did-finish-load', handleDidFinishLoad);

		return () => {
			root.removeEventListener('did-finish-load', handleDidFinishLoad);
		};
	}, [onLoad]);

	useEffect(() => {
		const handleDidFailLoad = (e) => {
			if (e.errorCode === -3) {
				console.warn('Ignoring likely spurious did-fail-load with errorCode -3, cf https://github.com/electron/electron/issues/14004');
				return;
			}
			if (e.isMainFrame) {
				onFail && onFail();
			}
		};

		const handleDidGetResponseDetails = (e) => {
			if (e.resourceType === 'mainFrame' && e.httpResponseCode >= 500) {
				onFail && onFail();
			}
		};

		root.addEventListener('did-fail-load', handleDidFailLoad);
		root.addEventListener('did-get-response-details', handleDidGetResponseDetails);

		return () => {
			root.removeEventListener('did-fail-load', handleDidFailLoad);
			root.removeEventListener('did-get-response-details', handleDidGetResponseDetails);
		};
	}, [onFail]);

	useEffect(() => {
		const handleActionDispatched = async ({ type, payload }) => {
			if (type === SIDE_BAR_RELOAD_SERVER_CLICKED) {
				if (url !== payload) {
					return;
				}

				root.reload();
				return;
			}

			if (type === SIDE_BAR_OPEN_DEVTOOLS_FOR_SERVER_CLICKED) {
				if (url !== payload) {
					return;
				}

				root.openDevTools();
				return;
			}

			if (type === TOUCH_BAR_FORMAT_BUTTON_TOUCHED) {
				if (!active || failed) {
					return;
				}

				root.send('format-button-touched', payload);
				return;
			}

			if (type === SCREEN_SHARING_DIALOG_SOURCE_SELECTED) {
				if (!active) {
					return;
				}

				root.send('screen-sharing-source-selected', payload);
				return;
			}

			if (type === MENU_BAR_RELOAD_SERVER_CLICKED) {
				if (!active) {
					return;
				}

				const { ignoringCache = false } = payload || {};

				if (ignoringCache) {
					root.reloadIgnoringCache();
					return;
				}

				root.reload();
				return;
			}

			if (type === MENU_BAR_OPEN_DEVTOOLS_FOR_SERVER_CLICKED) {
				if (!active) {
					return;
				}

				root.openDevTools();
				return;
			}

			if (type === MENU_BAR_GO_BACK_CLICKED) {
				if (!active) {
					return;
				}

				root.goBack();
				return;
			}

			if (type === MENU_BAR_GO_FORWARD_CLICKED) {
				if (!active) {
					return;
				}

				root.goForward();
				return;
			}

			if (type === MENU_BAR_CLEAR_TRUSTED_CERTIFICATES_CLICKED) {
				root.reloadIgnoringCache();
				return;
			}

			if (type === CERTIFICATE_TRUST_REQUESTED) {
				const { webContentsId, url, error, fingerprint, issuerName, willBeReplaced } = payload;

				if (webContentsId !== root.getWebContents().id) {
					return;
				}

				let detail = `URL: ${ url }\nError: ${ error }`;
				if (willBeReplaced) {
					detail = t('error.differentCertificate', { detail });
				}

				const { response } = await remote.dialog.showMessageBox(remote.getCurrentWindow(), {
					title: t('dialog.certificateError.title'),
					message: t('dialog.certificateError.message', { issuerName }),
					detail,
					type: 'warning',
					buttons: [
						t('dialog.certificateError.yes'),
						t('dialog.certificateError.no'),
					],
					cancelId: 1,
				});

				if (response === 0) {
					dispatch({ type: WEBVIEW_CERTIFICATE_TRUSTED, payload: { fingerprint } });
					return;
				}

				dispatch({ type: WEBVIEW_CERTIFICATE_DENIED, payload: { fingerprint } });
			}
		};

		return subscribe(handleActionDispatched);
	}, [url, active, failed]);

	useEffect(() => {
		if (process.platform !== 'darwin') {
			return;
		}

		if (!root.classList.contains('ready')) {
			return;
		}

		root.send('sidebar-visibility-changed', hasSidebar);
	}, [hasSidebar]);

	useEffect(() => {
		root.src = lastPath || url;
	}, [url]);

	return null;
}