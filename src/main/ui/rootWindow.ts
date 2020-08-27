import path from 'path';

import {
  app,
  BrowserWindow,
  screen,
  shell,
  ipcMain,
  webContents,
  clipboard,
  Menu,
  WebContents,
  DidNavigateEvent,
  DidFailLoadEvent,
  MenuItemConstructorOptions,
  Event,
  Input,
  WebPreferences,
  IpcMainEvent,
  Rectangle,
  ContextMenuParams,
} from 'electron';
import i18next from 'i18next';
import { createSelector } from 'reselect';

import {
  ROOT_WINDOW_STATE_CHANGED,
  ROOT_WINDOW_WEBCONTENTS_FOCUSED,
  WEBVIEW_DID_NAVIGATE,
  LOADING_ERROR_VIEW_RELOAD_SERVER_CLICKED,
  WEBVIEW_SPELL_CHECKING_DICTIONARY_TOGGLED,
  WEBVIEW_DID_START_LOADING,
  WEBVIEW_DID_FAIL_LOAD,
  SIDE_BAR_REMOVE_SERVER_CLICKED,
  SIDE_BAR_CONTEXT_MENU_TRIGGERED,
  WEBVIEW_FOCUS_REQUESTED,
} from '../../actions';
import {
  EVENT_WEB_CONTENTS_FOCUS_CHANGED,
  EVENT_BROWSER_VIEW_ATTACHED,
} from '../../ipc';
import {
  selectGlobalBadge,
  selectGlobalBadgeCount,
  selectMainWindowState,
} from '../../selectors';
import { dispatch, select, watch, listen } from '../../store';
import { Dictionary } from '../../structs/spellChecking';
import { getTrayIconPath, getAppIconPath } from '../icons';
import { importSpellCheckingDictionaries, getCorrectionsForMisspelling } from '../spellChecking';
import { browseForSpellCheckingDictionary } from './dialogs';

const t = i18next.t.bind(i18next);

const webContentsByServerUrl = new Map();

export const getWebContentsByServerUrl = (serverUrl: string): WebContents =>
  webContentsByServerUrl.get(serverUrl);

export const getAllServerWebContents = (): WebContents[] =>
  Array.from(webContentsByServerUrl.values());

let rootWindow: BrowserWindow;

export const getRootWindow = (): BrowserWindow =>
  rootWindow;

const selectFocusedWebContents = createSelector([
  ({ focusedWebContentsId }) => focusedWebContentsId,
], (focusedWebContentsId) =>
  (focusedWebContentsId > -1 ? webContents.fromId(focusedWebContentsId) : null));

const initializeServerWebContents = (serverUrl: string, guestWebContents: WebContents): void => {
  webContentsByServerUrl.set(serverUrl, guestWebContents);

  guestWebContents.addListener('destroyed', () => {
    webContentsByServerUrl.delete(serverUrl);
  });

  const handleDidStartLoading = (): void => {
    dispatch({ type: WEBVIEW_DID_START_LOADING, payload: { url: serverUrl } });
    rootWindow.webContents.send(WEBVIEW_DID_START_LOADING, serverUrl);
  };

  const handleDidFailLoad = (
    _event: DidFailLoadEvent,
    errorCode: number,
    _errorDescription: string,
    _validatedURL: string,
    isMainFrame: boolean,
    _frameProcessId: number,
    _frameRoutingId: number,
  ): void => {
    if (errorCode === -3) {
      console.warn('Ignoring likely spurious did-fail-load with errorCode -3, cf https://github.com/electron/electron/issues/14004');
      return;
    }

    dispatch({
      type: WEBVIEW_DID_FAIL_LOAD,
      payload: { url: serverUrl, isMainFrame },
    });
  };

  const handleDomReady = (): void => {
    guestWebContents.focus();
  };

  const handleDidNavigateInPage = (
    _event: DidNavigateEvent,
    pageUrl: string,
    _isMainFrame: boolean,
    _frameProcessId: number,
    _frameRoutingId: number,
  ): void => {
    dispatch({
      type: WEBVIEW_DID_NAVIGATE,
      payload: {
        url: serverUrl,
        pageUrl,
      },
    });
  };

  const handleContextMenu = async (event: Event, params: ContextMenuParams): Promise<void> => {
    event.preventDefault();

    const dictionaries = select(({ spellCheckingDictionaries }) => spellCheckingDictionaries);
    const webContents = select(selectFocusedWebContents);

    type Params = Partial<ContextMenuParams> & {
      corrections: string[];
      dictionaries: Dictionary[];
    };

    const createSpellCheckingMenuTemplate = ({
      isEditable,
      corrections,
      dictionaries,
    }: Params): MenuItemConstructorOptions[] => {
      if (!isEditable) {
        return [];
      }

      return [
        ...corrections ? [
          ...corrections.length === 0
            ? [
              {
                label: t('contextMenu.noSpellingSuggestions'),
                enabled: false,
              },
            ]
            : corrections.slice(0, 6).map<MenuItemConstructorOptions>((correction) => ({
              label: correction,
              click: () => {
                webContents.replaceMisspelling(correction);
              },
            })),
          ...corrections.length > 6 ? [
            {
              label: t('contextMenu.moreSpellingSuggestions'),
              submenu: corrections.slice(6).map<MenuItemConstructorOptions>((correction) => ({
                label: correction,
                click: () => {
                  webContents.replaceMisspelling(correction);
                },
              })),
            },
          ] : [],
          { type: 'separator' },
        ] as MenuItemConstructorOptions[] : [],
        {
          label: t('contextMenu.spellingLanguages'),
          enabled: dictionaries.length > 0,
          submenu: [
            ...dictionaries.map<MenuItemConstructorOptions>(({ name, enabled }) => ({
              label: name,
              type: 'checkbox',
              checked: enabled,
              click: ({ checked }) => {
                dispatch({
                  type: WEBVIEW_SPELL_CHECKING_DICTIONARY_TOGGLED,
                  payload: { name, enabled: checked },
                });
              },
            })),
            { type: 'separator' },
            {
              label: t('contextMenu.browseForLanguage'),
              click: async () => {
                const filePaths = await browseForSpellCheckingDictionary(rootWindow);
                importSpellCheckingDictionaries(filePaths);
              },
            },
          ],
        },
        { type: 'separator' },
      ];
    };

    const createImageMenuTemplate = ({
      mediaType,
      srcURL,
    }: Params): MenuItemConstructorOptions[] => (
      mediaType === 'image' ? [
        {
          label: t('contextMenu.saveImageAs'),
          click: () => webContents.downloadURL(srcURL),
        },
        { type: 'separator' },
      ] : []
    );

    const createLinkMenuTemplate = ({
      linkURL,
      linkText,
    }: Params): MenuItemConstructorOptions[] => (
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
          { type: 'separator' },
        ]
        : []
    );

    const createDefaultMenuTemplate = ({
      editFlags: {
        canUndo = false,
        canRedo = false,
        canCut = false,
        canCopy = false,
        canPaste = false,
        canSelectAll = false,
      },
    }: Params): MenuItemConstructorOptions[] => [
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
      { type: 'separator' },
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
        role: 'selectAll',
        accelerator: 'CommandOrControl+A',
        enabled: canSelectAll,
      },
    ];

    const props = {
      ...params,
      corrections: await getCorrectionsForMisspelling(params.selectionText),
      dictionaries,
    };

    const template = [
      ...createSpellCheckingMenuTemplate(props),
      ...createImageMenuTemplate(props),
      ...createLinkMenuTemplate(props),
      ...createDefaultMenuTemplate(props),
    ];

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: rootWindow });
  };

  const handleBeforeInputEvent = (_event: Event, { type, key }: Input): void => {
    if (type !== 'keyUp' && type !== 'keyDown') {
      return;
    }

    const shortcutKey = process.platform === 'darwin' ? 'Meta' : 'Control';

    if (key !== shortcutKey) {
      return;
    }

    rootWindow.webContents.sendInputEvent({ type, keyCode: key, modifiers: [] });
  };

  const handleDevToolsFocused = (): void => {
    dispatch({
      type: ROOT_WINDOW_WEBCONTENTS_FOCUSED,
      payload: guestWebContents.isDevToolsFocused() ? guestWebContents.devToolsWebContents?.id : guestWebContents.id,
    });
  };

  guestWebContents.addListener('did-start-loading', handleDidStartLoading);
  guestWebContents.addListener('did-fail-load', handleDidFailLoad);
  guestWebContents.addListener('dom-ready', handleDomReady);
  guestWebContents.addListener('did-navigate-in-page', handleDidNavigateInPage);
  guestWebContents.addListener('context-menu', handleContextMenu);
  guestWebContents.addListener('before-input-event', handleBeforeInputEvent);
  guestWebContents.addListener('devtools-focused', handleDevToolsFocused);
};

const attachGuestWebContentsEvents = (): void => {
  const handleWillAttachWebview = (_event: Event, webPreferences: WebPreferences): void => {
    delete webPreferences.enableBlinkFeatures;
    webPreferences.preload = `${ app.getAppPath() }/app/preload.js`;
    webPreferences.nodeIntegration = false;
    webPreferences.nodeIntegrationInWorker = true;
    webPreferences.nodeIntegrationInSubFrames = true;
    webPreferences.enableRemoteModule = false;
    webPreferences.webSecurity = true;
  };

  const handleDidAttachWebview = (_event: Event, webContents: WebContents): void => {
    // webContents.send('console-warn', '%c%s', 'color: red; font-size: 32px;', t('selfxss.title'));
    // webContents.send('console-warn', '%c%s', 'font-size: 20px;', t('selfxss.description'));
    // webContents.send('console-warn', '%c%s', 'font-size: 20px;', t('selfxss.moreInfo'));

    webContents.addListener('new-window', (event, url, _frameName, disposition, options) => {
      event.preventDefault();

      if (disposition === 'foreground-tab' || disposition === 'background-tab') {
        shell.openExternal(url);
        return;
      }

      const newWindow = new BrowserWindow({
        ...options,
        show: false,
      });

      newWindow.once('ready-to-show', () => {
        newWindow.show();
      });

      event.newGuest = newWindow;
    });
  };

  ipcMain.addListener(EVENT_BROWSER_VIEW_ATTACHED, (_event: IpcMainEvent, serverUrl, webContentsId) => {
    const guestWebContents = webContents.fromId(webContentsId);
    initializeServerWebContents(serverUrl, guestWebContents);
  });

  rootWindow.webContents.addListener('will-attach-webview', handleWillAttachWebview);
  rootWindow.webContents.addListener('did-attach-webview', handleDidAttachWebview);
};

export const createRootWindow = async (): Promise<BrowserWindow> => {
  rootWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 400,
    minHeight: 400,
    titleBarStyle: 'hidden',
    backgroundColor: '#2f343d',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true,
      webviewTag: true,
      worldSafeExecuteJavaScript: true,
    },
  });

  rootWindow.addListener('close', (event) => {
    event.preventDefault();
  });

  attachGuestWebContentsEvents();

  if (process.env.NODE_ENV === 'development') {
    rootWindow.webContents.openDevTools();
  }

  rootWindow.loadFile(path.join(app.getAppPath(), 'app/index.html'));

  return new Promise((resolve) => {
    rootWindow.on('ready-to-show', () => {
      resolve(rootWindow);
    });
  });
};

const isInsideSomeScreen = ({ x, y, width, height }: Rectangle): boolean =>
  screen.getAllDisplays()
    .some(({ bounds }) => x >= bounds.x && y >= bounds.y
      && x + width <= bounds.x + bounds.width && y + height <= bounds.y + bounds.height,
    );

export const applyMainWindowState = (): void => {
  const rootWindowState = select(selectMainWindowState);

  let { x, y } = rootWindowState.bounds;
  const { width, height } = rootWindowState.bounds;
  if (!isInsideSomeScreen({ x, y, width, height })) {
    const {
      bounds: {
        width: primaryDisplayWidth,
        height: primaryDisplayHeight,
      },
    } = screen.getPrimaryDisplay();
    x = Math.round((primaryDisplayWidth - width) / 2);
    y = Math.round((primaryDisplayHeight - height) / 2);
  }

  if (rootWindow.isVisible()) {
    return;
  }

  rootWindow.setBounds({ x, y, width, height });

  if (rootWindowState.maximized) {
    rootWindow.maximize();
  }

  if (rootWindowState.minimized) {
    rootWindow.minimize();
  }

  if (rootWindowState.fullscreen) {
    rootWindow.setFullScreen(true);
  }

  if (rootWindowState.visible) {
    rootWindow.show();
  }

  if (rootWindowState.focused) {
    rootWindow.focus();
  }
};

const fetchRootWindowState = (): ReturnType<typeof selectMainWindowState> => ({
  focused: rootWindow.isFocused(),
  visible: rootWindow.isVisible(),
  maximized: rootWindow.isMaximized(),
  minimized: rootWindow.isMinimized(),
  fullscreen: rootWindow.isFullScreen(),
  normal: rootWindow.isNormal(),
  bounds: rootWindow.getNormalBounds(),
});

export const setupRootWindow = (): void => {
  if (process.platform === 'linux' || process.platform === 'win32') {
    watch(({ isMenuBarEnabled }) => isMenuBarEnabled, (isMenuBarEnabled) => {
      rootWindow.autoHideMenuBar = !isMenuBarEnabled;
      rootWindow.setMenuBarVisibility(isMenuBarEnabled);
    });

    const selectRootWindowIcon = createSelector([
      ({ isTrayIconEnabled }) => isTrayIconEnabled ?? true,
      selectGlobalBadge,
    ], (isTrayIconEnabled, globalBadge) => [isTrayIconEnabled, globalBadge]);

    watch(selectRootWindowIcon, ([isTrayIconEnabled, globalBadge]) => {
      const icon = isTrayIconEnabled ? getTrayIconPath({ badge: globalBadge }) : getAppIconPath();
      rootWindow.setIcon(icon);
    });
  }

  watch(selectGlobalBadgeCount, (globalBadgeCount) => {
    if (rootWindow.isFocused() || globalBadgeCount === 0) {
      return;
    }

    const isShowWindowOnUnreadChangedEnabled = select(({ isShowWindowOnUnreadChangedEnabled }) => isShowWindowOnUnreadChangedEnabled);

    if (isShowWindowOnUnreadChangedEnabled) {
      rootWindow.showInactive();
      return;
    }

    if (process.platform === 'win32') {
      rootWindow.flashFrame(true);
    }
  });

  const fetchAndDispatchWindowState = (): void => {
    dispatch({
      type: ROOT_WINDOW_STATE_CHANGED,
      payload: fetchRootWindowState(),
    });
  };

  rootWindow.addListener('show', fetchAndDispatchWindowState);
  rootWindow.addListener('hide', fetchAndDispatchWindowState);
  rootWindow.addListener('focus', fetchAndDispatchWindowState);
  rootWindow.addListener('blur', fetchAndDispatchWindowState);
  rootWindow.addListener('maximize', fetchAndDispatchWindowState);
  rootWindow.addListener('unmaximize', fetchAndDispatchWindowState);
  rootWindow.addListener('minimize', fetchAndDispatchWindowState);
  rootWindow.addListener('restore', fetchAndDispatchWindowState);
  rootWindow.addListener('resize', fetchAndDispatchWindowState);
  rootWindow.addListener('move', fetchAndDispatchWindowState);

  fetchAndDispatchWindowState();

  rootWindow.addListener('focus', () => {
    rootWindow.flashFrame(false);
  });

  rootWindow.addListener('close', async () => {
    if (rootWindow.isFullScreen()) {
      await new Promise((resolve) => rootWindow.once('leave-full-screen', resolve));
      rootWindow.setFullScreen(false);
    }

    rootWindow.blur();

    const isTrayIconEnabled = select(({ isTrayIconEnabled }) => isTrayIconEnabled ?? true);

    if (process.platform === 'darwin' || isTrayIconEnabled) {
      rootWindow.hide();
      return;
    }

    if (process.platform === 'win32') {
      rootWindow.minimize();
      return;
    }

    rootWindow.destroy();
  });

  rootWindow.webContents.addListener('devtools-focused', () => {
    dispatch({
      type: ROOT_WINDOW_WEBCONTENTS_FOCUSED,
      payload: rootWindow.webContents.devToolsWebContents.id,
    });
  });

  rootWindow.webContents.addListener('devtools-closed', () => {
    dispatch({
      type: ROOT_WINDOW_WEBCONTENTS_FOCUSED,
      payload: rootWindow.webContents.id,
    });
  });

  ipcMain.addListener(EVENT_WEB_CONTENTS_FOCUS_CHANGED, (_event: IpcMainEvent, webContentsId = rootWindow.webContents.id) => {
    const focusedWebContents = webContents.fromId(webContentsId);
    dispatch({
      type: ROOT_WINDOW_WEBCONTENTS_FOCUSED,
      payload: focusedWebContents.isDevToolsFocused() ? focusedWebContents.devToolsWebContents.id : webContentsId,
    });
  });

  listen(SIDE_BAR_CONTEXT_MENU_TRIGGERED, (action) => {
    const { payload: serverUrl } = action;

    const menuTemplate: MenuItemConstructorOptions[] = [
      {
        label: t('sidebar.item.reload'),
        click: () => {
          const guestWebContents = getWebContentsByServerUrl(serverUrl);
          guestWebContents.loadURL(serverUrl);
        },
      },
      {
        label: t('sidebar.item.remove'),
        click: () => {
          dispatch({ type: SIDE_BAR_REMOVE_SERVER_CLICKED, payload: serverUrl });
        },
      },
      { type: 'separator' },
      {
        label: t('sidebar.item.openDevTools'),
        click: () => {
          const guestWebContents = getWebContentsByServerUrl(serverUrl);
          guestWebContents.openDevTools();
        },
      },
    ];
    const menu = Menu.buildFromTemplate(menuTemplate);
    menu.popup({
      window: rootWindow,
    });
  });

  listen(LOADING_ERROR_VIEW_RELOAD_SERVER_CLICKED, (action) => {
    getWebContentsByServerUrl(action.payload.url).loadURL(action.payload.url);
  });

  listen(WEBVIEW_FOCUS_REQUESTED, () => {
    rootWindow.focus();
  });
};
