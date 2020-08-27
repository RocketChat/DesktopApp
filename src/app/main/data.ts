import fs from 'fs';
import path from 'path';

import { app } from 'electron';

import { select, dispatch, watch } from '../../store';
import { getRootWindow } from '../../ui/main/rootWindow';
import { APP_SETTINGS_LOADED } from '../actions';
import { selectPersistableValues } from '../selectors';
import { getPersistedValues, persistValues } from './persistence';

export const getLocalStorage = (): Promise<Record<string, string>> =>
  getRootWindow().webContents.executeJavaScript('({...localStorage})');

export const purgeLocalStorage = async (): Promise<void> => {
  await getRootWindow().webContents.executeJavaScript('localStorage.clear()');
};

export const mergePersistableValues = async (localStorage: Record<string, string>): Promise<void> => {
  const initialValues = select(selectPersistableValues);

  const electronStoreValues = getPersistedValues();

  const localStorageValues = Object.fromEntries(
    Object.entries(localStorage)
      .map(([key, value]) => {
        try {
          return [key, JSON.parse(value)];
        } catch (error) {
          return [];
        }
      }),
  );

  let values = selectPersistableValues({
    ...initialValues,
    ...electronStoreValues,
    ...localStorageValues,
  });

  if (localStorage.autohideMenu) {
    values = {
      ...values,
      isMenuBarEnabled: localStorage.autohideMenu !== 'true',
    };
  }

  if (localStorage.showWindowOnUnreadChanged) {
    values = {
      ...values,
      isShowWindowOnUnreadChangedEnabled: localStorage.showWindowOnUnreadChanged === 'true',
    };
  }

  if (localStorage['sidebar-closed']) {
    values = {
      ...values,
      isSideBarEnabled: localStorage['sidebar-closed'] !== 'true',
    };
  }

  if (localStorage.hideTray) {
    values = {
      ...values,
      isTrayIconEnabled: localStorage.hideTray !== 'true',
    };
  }

  const userMainWindowState = await (async () => {
    try {
      const filePath = path.join(app.getPath('userData'), 'main-window-state.json');
      const content = await fs.promises.readFile(filePath, 'utf8');
      const json = JSON.parse(content);
      await fs.promises.unlink(filePath);

      return json && typeof json === 'object' ? json : {};
    } catch (error) {
      return {};
    }
  })();

  values = {
    ...values,
    mainWindowState: {
      focused: true,
      visible: !(userMainWindowState?.isHidden ?? !values?.mainWindowState?.visible),
      maximized: userMainWindowState.isMaximized ?? values?.mainWindowState?.maximized,
      minimized: userMainWindowState.isMinimized ?? values?.mainWindowState?.minimized,
      fullscreen: false,
      normal: !(userMainWindowState.isMinimized || userMainWindowState.isMaximized) ?? values?.mainWindowState?.normal,
      bounds: {
        x: userMainWindowState.x ?? values?.mainWindowState?.bounds?.x,
        y: userMainWindowState.y ?? values?.mainWindowState?.bounds?.y,
        width: userMainWindowState.width ?? values?.mainWindowState?.bounds?.width,
        height: userMainWindowState.height ?? values?.mainWindowState?.bounds?.height,
      },
    },
  };

  dispatch({
    type: APP_SETTINGS_LOADED,
    payload: values,
  });
};

export const watchAndPersistChanges = (): void => {
  watch(selectPersistableValues, (values) => {
    persistValues(values);
  });
};
