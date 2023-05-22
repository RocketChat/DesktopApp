import {
  Menu,
  app,
  shell,
  MenuItemConstructorOptions,
  BrowserWindow,
} from 'electron';
import i18next from 'i18next';
import { createSelector, createStructuredSelector } from 'reselect';

import { relaunchApp } from '../../app/main/app';
import { CERTIFICATES_CLEARED } from '../../navigation/actions';
import { dispatch, select, Service } from '../../store';
import { RootState } from '../../store/rootReducer';
import {
  MENU_BAR_ABOUT_CLICKED,
  MENU_BAR_ADD_NEW_SERVER_CLICKED,
  MENU_BAR_SELECT_SERVER_CLICKED,
  MENU_BAR_TOGGLE_IS_MENU_BAR_ENABLED_CLICKED,
  MENU_BAR_TOGGLE_IS_SHOW_WINDOW_ON_UNREAD_CHANGED_ENABLED_CLICKED,
  MENU_BAR_TOGGLE_IS_SIDE_BAR_ENABLED_CLICKED,
  MENU_BAR_TOGGLE_IS_TRAY_ICON_ENABLED_CLICKED,
  SIDE_BAR_DOWNLOADS_BUTTON_CLICKED,
  SIDE_BAR_SETTINGS_BUTTON_CLICKED,
} from '../actions';
import { askForAppDataReset } from './dialogs';
import { getRootWindow } from './rootWindow';
import { getWebContentsByServerUrl } from './serverView';

const t = i18next.t.bind(i18next);

const on = (
  condition: boolean,
  getMenuItems: () => MenuItemConstructorOptions[]
): MenuItemConstructorOptions[] => (condition ? getMenuItems() : []);

const selectAddServersDeps = createStructuredSelector<
  RootState,
  Pick<RootState, 'isAddNewServersEnabled'>
>({
  isAddNewServersEnabled: ({ isAddNewServersEnabled }) =>
    isAddNewServersEnabled,
});

const createAppMenu = createSelector(
  selectAddServersDeps,
  ({ isAddNewServersEnabled }): MenuItemConstructorOptions => ({
    id: 'appMenu',
    label: process.platform === 'darwin' ? app.name : t('menus.fileMenu'),
    submenu: [
      ...on(process.platform === 'darwin', () => [
        {
          id: 'about',
          label: t('menus.about', { appName: app.name }),
          click: async () => {
            const browserWindow = await getRootWindow();

            if (!browserWindow.isVisible()) {
              browserWindow.showInactive();
            }
            browserWindow.focus();
            dispatch({ type: MENU_BAR_ABOUT_CLICKED });
          },
        },
        { type: 'separator' },
        {
          id: 'services',
          label: t('menus.services'),
          role: 'services',
        },
        { type: 'separator' },
        {
          id: 'hide',
          label: t('menus.hide', { appName: app.name }),
          role: 'hide',
        },
        {
          id: 'hideOthers',
          label: t('menus.hideOthers'),
          role: 'hideOthers',
        },
        {
          id: 'unhide',
          label: t('menus.unhide'),
          role: 'unhide',
        },
        { type: 'separator' },
      ]),
      ...on(process.platform !== 'darwin' && isAddNewServersEnabled, () => [
        {
          id: 'addNewServer',
          label: t('menus.addNewServer'),
          accelerator: 'CommandOrControl+N',
          click: async () => {
            const browserWindow = await getRootWindow();

            if (!browserWindow.isVisible()) {
              browserWindow.showInactive();
            }
            browserWindow.focus();
            dispatch({ type: MENU_BAR_ADD_NEW_SERVER_CLICKED });
          },
        },
        { type: 'separator' },
      ]),
      {
        id: 'disableGpu',
        label: t('menus.disableGpu'),
        enabled: !app.commandLine.hasSwitch('disable-gpu'),
        click: () => {
          relaunchApp('--disable-gpu');
        },
      },
      { type: 'separator' },
      {
        id: 'quit',
        label: t('menus.quit', { appName: app.name }),
        accelerator: 'CommandOrControl+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  })
);

const createEditMenu = createSelector(
  () => undefined,
  (): MenuItemConstructorOptions => ({
    id: 'editMenu',
    label: t('menus.editMenu'),
    submenu: [
      {
        id: 'undo',
        label: t('menus.undo'),
        role: 'undo',
      },
      {
        id: 'redo',
        label: t('menus.redo'),
        role: 'redo',
      },
      { type: 'separator' },
      {
        id: 'cut',
        label: t('menus.cut'),
        role: 'cut',
      },
      {
        id: 'copy',
        label: t('menus.copy'),
        role: 'copy',
      },
      {
        id: 'paste',
        label: t('menus.paste'),
        role: 'paste',
      },
      {
        id: 'selectAll',
        label: t('menus.selectAll'),
        role: 'selectAll',
      },
    ],
  })
);

const selectViewDeps = createStructuredSelector<
  RootState,
  Pick<
    RootState,
    | 'currentView'
    | 'isSideBarEnabled'
    | 'isTrayIconEnabled'
    | 'isMenuBarEnabled'
    | 'rootWindowState'
  >
>({
  currentView: ({ currentView }) => currentView,
  isSideBarEnabled: ({ isSideBarEnabled }) => isSideBarEnabled,
  isTrayIconEnabled: ({ isTrayIconEnabled }) => isTrayIconEnabled,
  isMenuBarEnabled: ({ isMenuBarEnabled }) => isMenuBarEnabled,
  rootWindowState: ({ rootWindowState }) => rootWindowState,
});

const createViewMenu = createSelector(
  selectViewDeps,
  ({
    currentView,
    isSideBarEnabled,
    isTrayIconEnabled,
    isMenuBarEnabled,
    rootWindowState,
  }): MenuItemConstructorOptions => ({
    id: 'viewMenu',
    label: t('menus.viewMenu'),
    submenu: [
      {
        id: 'reload',
        label: t('menus.reload'),
        accelerator: 'CommandOrControl+R',
        enabled: typeof currentView === 'object' && !!currentView.url,
        click: async () => {
          const browserWindow = await getRootWindow();

          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          const guestWebContents =
            typeof currentView === 'object'
              ? getWebContentsByServerUrl(currentView.url)
              : null;
          guestWebContents?.reload();
        },
      },
      {
        id: 'reloadIgnoringCache',
        label: t('menus.reloadIgnoringCache'),
        enabled: typeof currentView === 'object' && !!currentView.url,
        click: async () => {
          const browserWindow = await getRootWindow();

          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          const guestWebContents =
            typeof currentView === 'object'
              ? getWebContentsByServerUrl(currentView.url)
              : null;
          guestWebContents?.reloadIgnoringCache();
        },
      },
      {
        id: 'openDevTools',
        label: t('menus.openDevTools'),
        enabled: typeof currentView === 'object' && !!currentView.url,
        accelerator:
          process.platform === 'darwin' ? 'Command+Alt+I' : 'Ctrl+Shift+I',
        click: () => {
          const guestWebContents =
            typeof currentView === 'object'
              ? getWebContentsByServerUrl(currentView.url)
              : null;
          guestWebContents?.toggleDevTools();
        },
      },
      {
        id: 'openDevToolsOnAllWindows',
        label: t('menus.openDevToolsOnAllWindows'),
        enabled: typeof currentView === 'object' && !!currentView.url,
        accelerator:
          process.platform === 'darwin' ? 'Command+Alt+G' : 'Ctrl+Shift+G',
        click: () => {
          const windows = BrowserWindow.getAllWindows();
          windows.forEach((window) => {
            window.webContents.toggleDevTools();
          });
        },
      },
      { type: 'separator' },
      {
        id: 'back',
        label: t('menus.back'),
        enabled: typeof currentView === 'object' && !!currentView.url,
        accelerator: process.platform === 'darwin' ? 'Command+[' : 'Alt+Left',
        click: async () => {
          const browserWindow = await getRootWindow();

          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          const guestWebContents =
            typeof currentView === 'object'
              ? getWebContentsByServerUrl(currentView.url)
              : null;
          guestWebContents?.goBack();
        },
      },
      {
        id: 'forward',
        label: t('menus.forward'),
        enabled: typeof currentView === 'object' && !!currentView.url,
        accelerator: process.platform === 'darwin' ? 'Command+]' : 'Alt+Right',
        click: async () => {
          const browserWindow = await getRootWindow();

          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          const guestWebContents =
            typeof currentView === 'object'
              ? getWebContentsByServerUrl(currentView.url)
              : null;
          guestWebContents?.goForward();
        },
      },
      { type: 'separator' },
      {
        id: 'showTrayIcon',
        label: t('menus.showTrayIcon'),
        type: 'checkbox',
        checked: isTrayIconEnabled,
        accelerator:
          process.platform === 'darwin' ? 'Shift+Command+T' : 'Ctrl+Shift+T',
        click: ({ checked }) => {
          setTimeout(() => {
            dispatch({
              type: MENU_BAR_TOGGLE_IS_TRAY_ICON_ENABLED_CLICKED,
              payload: checked,
            });
          }, 10);
        },
      },
      ...on(process.platform === 'darwin', () => [
        {
          id: 'showFullScreen',
          label: t('menus.showFullScreen'),
          type: 'checkbox',
          checked: rootWindowState.fullscreen,
          accelerator: 'Control+Command+F',
          click: async ({ checked: enabled }) => {
            const browserWindow = await getRootWindow();

            if (!browserWindow.isVisible()) {
              browserWindow.showInactive();
            }
            browserWindow.focus();
            browserWindow.setFullScreen(enabled);
          },
        },
      ]),
      ...on(process.platform !== 'darwin', () => [
        {
          id: 'showMenuBar',
          label: t('menus.showMenuBar'),
          type: 'checkbox',
          checked: isMenuBarEnabled,
          accelerator:
            process.platform === 'darwin' ? 'Shift+Command+M' : 'Ctrl+Shift+M',
          click: async ({ checked }) => {
            const browserWindow = await getRootWindow();

            if (!browserWindow.isVisible()) {
              browserWindow.showInactive();
            }
            browserWindow.focus();
            dispatch({
              type: MENU_BAR_TOGGLE_IS_MENU_BAR_ENABLED_CLICKED,
              payload: checked,
            });
          },
        },
      ]),
      {
        id: 'showServerList',
        label: t('menus.showServerList'),
        type: 'checkbox',
        checked: isSideBarEnabled,
        accelerator:
          process.platform === 'darwin' ? 'Shift+Command+S' : 'Ctrl+Shift+S',
        click: async ({ checked }) => {
          const browserWindow = await getRootWindow();

          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          dispatch({
            type: MENU_BAR_TOGGLE_IS_SIDE_BAR_ENABLED_CLICKED,
            payload: checked,
          });
        },
      },
      { type: 'separator' },
      {
        id: 'resetZoom',
        label: t('menus.resetZoom'),
        accelerator: 'CommandOrControl+0',
        click: async () => {
          const browserWindow = await getRootWindow();

          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          const url = typeof currentView === 'object' ? currentView.url : null;
          if (!url) {
            return;
          }
          const guestWebContents = getWebContentsByServerUrl(url);
          guestWebContents?.setZoomLevel(0);
        },
      },
      {
        id: 'zoomIn',
        label: t('menus.zoomIn'),
        accelerator: 'CommandOrControl+Plus',
        click: async () => {
          const browserWindow = await getRootWindow();
          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          const url = typeof currentView === 'object' ? currentView.url : null;
          if (!url) {
            return;
          }
          const guestWebContents = getWebContentsByServerUrl(url);
          if (!guestWebContents) {
            return;
          }
          const zoomLevel = guestWebContents?.getZoomLevel();
          if (zoomLevel >= 9) {
            return;
          }

          guestWebContents.setZoomLevel(zoomLevel + 1);
        },
      },
      {
        id: 'zoomOut',
        label: t('menus.zoomOut'),
        accelerator: 'CommandOrControl+-',
        click: async () => {
          const browserWindow = await getRootWindow();
          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          const url = typeof currentView === 'object' ? currentView.url : null;
          if (!url) {
            return;
          }

          const guestWebContents = getWebContentsByServerUrl(url);
          if (!guestWebContents) {
            return;
          }

          const zoomLevel = guestWebContents.getZoomLevel();
          if (zoomLevel <= -9) {
            return;
          }

          guestWebContents.setZoomLevel(zoomLevel - 1);
        },
      },
    ],
  })
);

const selectWindowDeps = createStructuredSelector<
  RootState,
  Pick<
    RootState,
    | 'servers'
    | 'currentView'
    | 'isShowWindowOnUnreadChangedEnabled'
    | 'isAddNewServersEnabled'
  >
>({
  servers: ({ servers }) => servers,
  currentView: ({ currentView }) => currentView,
  isShowWindowOnUnreadChangedEnabled: ({
    isShowWindowOnUnreadChangedEnabled,
  }) => isShowWindowOnUnreadChangedEnabled,
  isAddNewServersEnabled: ({ isAddNewServersEnabled }) =>
    isAddNewServersEnabled,
});

const createWindowMenu = createSelector(
  selectWindowDeps,
  ({
    servers,
    currentView,
    isShowWindowOnUnreadChangedEnabled,
    isAddNewServersEnabled,
  }): MenuItemConstructorOptions => ({
    id: 'windowMenu',
    label: t('menus.windowMenu'),
    role: 'windowMenu',
    submenu: [
      ...on(process.platform === 'darwin' && isAddNewServersEnabled, () => [
        {
          id: 'addNewServer',
          label: t('menus.addNewServer'),
          accelerator: 'CommandOrControl+N',
          click: async () => {
            const browserWindow = await getRootWindow();

            if (!browserWindow.isVisible()) {
              browserWindow.showInactive();
            }
            browserWindow.focus();
            dispatch({ type: MENU_BAR_ADD_NEW_SERVER_CLICKED });
          },
        },
        { type: 'separator' },
      ]),
      ...on(servers.length > 0, () => [
        ...servers.map(
          (server, i): MenuItemConstructorOptions => ({
            id: server.url,
            type:
              typeof currentView === 'object' && currentView.url === server.url
                ? 'checkbox'
                : 'normal',
            label: server.title?.replace(/&/g, '&&'),
            checked:
              typeof currentView === 'object' && currentView.url === server.url,
            accelerator: `CommandOrControl+${i + 1}`,
            click: async () => {
              const browserWindow = await getRootWindow();

              if (!browserWindow.isVisible()) {
                browserWindow.showInactive();
              }
              browserWindow.focus();
              setTimeout(() => {
                dispatch({
                  type: MENU_BAR_SELECT_SERVER_CLICKED,
                  payload: server.url,
                });
              }, 100);
            },
          })
        ),
        { type: 'separator' },
      ]),
      {
        id: 'downloads',
        label: t('menus.downloads'),
        checked: currentView === 'downloads',
        accelerator: 'CommandOrControl+D',
        click: async () => {
          const browserWindow = await getRootWindow();

          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          dispatch({ type: SIDE_BAR_DOWNLOADS_BUTTON_CLICKED });
        },
      },
      {
        id: 'settings',
        label: t('menus.settings'),
        checked: currentView === 'settings',
        click: async () => {
          const browserWindow = await getRootWindow();

          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          dispatch({ type: SIDE_BAR_SETTINGS_BUTTON_CLICKED });
        },
      },
      {
        id: 'showOnUnreadMessage',
        type: 'checkbox',
        label: t('menus.showOnUnreadMessage'),
        checked: isShowWindowOnUnreadChangedEnabled,
        click: async ({ checked }) => {
          const browserWindow = await getRootWindow();

          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          dispatch({
            type: MENU_BAR_TOGGLE_IS_SHOW_WINDOW_ON_UNREAD_CHANGED_ENABLED_CLICKED,
            payload: checked,
          });
        },
      },
      { type: 'separator' },
      {
        id: 'minimize',
        role: 'minimize',
        label: t('menus.minimize'),
        accelerator: 'CommandOrControl+M',
      },
      {
        id: 'close',
        role: 'close',
        label: t('menus.close'),
        accelerator: 'CommandOrControl+W',
      },
    ],
  })
);

const createHelpMenu = createSelector(
  () => undefined,
  (): MenuItemConstructorOptions => ({
    id: 'helpMenu',
    label: t('menus.helpMenu'),
    role: 'help',
    submenu: [
      {
        id: 'documentation',
        label: t('menus.documentation'),
        click: () => {
          shell.openExternal('https://docs.rocket.chat/');
        },
      },
      {
        id: 'reportIssue',
        label: t('menus.reportIssue'),
        click: () => {
          shell.openExternal(
            'https://github.com/RocketChat/Rocket.Chat/issues/new'
          );
        },
      },
      { type: 'separator' },
      {
        id: 'reload-window',
        label: t('menus.reload'),
        accelerator: 'CommandOrControl+Shift+R',
        click: async () => {
          const browserWindow = await getRootWindow();

          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          browserWindow.webContents.reload();
        },
      },
      {
        id: 'toggleDevTools',
        label: t('menus.toggleDevTools'),
        accelerator: 'CommandOrControl+Shift+D',
        click: async () => {
          const browserWindow = await getRootWindow();

          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          browserWindow.webContents.toggleDevTools();
        },
      },
      {
        id: 'runDevelopment',
        label: t('menus.runDevelopment'),
        enabled: !app.commandLine.hasSwitch('dev'),
        click: () => {
          relaunchApp('--dev');
        },
      },
      { type: 'separator' },
      {
        id: 'clearTrustedCertificates',
        label: t('menus.clearTrustedCertificates'),
        click: async () => {
          const browserWindow = await getRootWindow();

          if (!browserWindow.isVisible()) {
            browserWindow.showInactive();
          }
          browserWindow.focus();
          dispatch({ type: CERTIFICATES_CLEARED });
        },
      },
      ...on(!process.mas, () => [
        {
          id: 'resetAppData',
          label: t('menus.resetAppData'),
          click: async () => {
            const permitted = await askForAppDataReset();

            if (permitted) {
              relaunchApp('--reset-app-data');
            }
          },
        },
      ]),
      { type: 'separator' },
      {
        id: 'learnMore',
        label: t('menus.learnMore'),
        click: () => {
          shell.openExternal('https://rocket.chat');
        },
      },
      ...on(process.platform !== 'darwin', () => [
        {
          id: 'about',
          label: t('menus.about', { appName: app.name }),
          click: async () => {
            const browserWindow = await getRootWindow();

            if (!browserWindow.isVisible()) {
              browserWindow.showInactive();
            }
            browserWindow.focus();
            dispatch({ type: MENU_BAR_ABOUT_CLICKED });
          },
        },
      ]),
    ],
  })
);

const selectMenuBarTemplate = createSelector(
  [
    createAppMenu,
    createEditMenu,
    createViewMenu,
    createWindowMenu,
    createHelpMenu,
  ],
  (...menus) => menus
);

const selectMenuBarTemplateAsJson = createSelector(
  selectMenuBarTemplate,
  (template: unknown) => JSON.stringify(template)
);

class MenuBarService extends Service {
  protected initialize(): void {
    this.watch(selectMenuBarTemplateAsJson, async () => {
      const menuBarTemplate = select(selectMenuBarTemplate);
      const menu = Menu.buildFromTemplate(menuBarTemplate);

      if (process.platform === 'darwin') {
        Menu.setApplicationMenu(menu);
        return;
      }

      Menu.setApplicationMenu(null);
      (await getRootWindow()).setMenu(menu);
    });
  }
}

export default new MenuBarService();
