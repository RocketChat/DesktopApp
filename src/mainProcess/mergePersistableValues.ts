import fs from 'fs';
import path from 'path';

import { app } from 'electron';

import { APP_SETTINGS_LOADED } from '../common/actions/appActions';
import { selectPersistableValues } from '../common/selectPersistableValues';
import { select, dispatch } from '../common/store';
import { getPersistedValues } from './getPersistedValues';

export const mergePersistableValues = async (
  localStorage: Record<string, string>
): Promise<void> => {
  const initialValues = select(selectPersistableValues);

  const electronStoreValues = getPersistedValues();

  const localStorageValues = Object.fromEntries(
    Object.entries(localStorage).map(([key, value]) => {
      try {
        return [key, JSON.parse(value)];
      } catch (error) {
        return [];
      }
    })
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
      isShowWindowOnUnreadChangedEnabled:
        localStorage.showWindowOnUnreadChanged === 'true',
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

  const userRootWindowState = await (async () => {
    try {
      const filePath = path.join(
        app.getPath('userData'),
        'main-window-state.json'
      );
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
    rootWindowState: {
      focused: true,
      visible: !(
        userRootWindowState?.isHidden ?? !values?.rootWindowState?.visible
      ),
      maximized:
        userRootWindowState.isMaximized ?? values?.rootWindowState?.maximized,
      minimized:
        userRootWindowState.isMinimized ?? values?.rootWindowState?.minimized,
      fullscreen: false,
      normal:
        !(userRootWindowState.isMinimized || userRootWindowState.isMaximized) ??
        values?.rootWindowState?.normal,
      bounds: {
        x: userRootWindowState.x ?? values?.rootWindowState?.bounds?.x,
        y: userRootWindowState.y ?? values?.rootWindowState?.bounds?.y,
        width:
          userRootWindowState.width ?? values?.rootWindowState?.bounds?.width,
        height:
          userRootWindowState.height ?? values?.rootWindowState?.bounds?.height,
      },
    },
  };

  dispatch({
    type: APP_SETTINGS_LOADED,
    payload: values,
  });
};
