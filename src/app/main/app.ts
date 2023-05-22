import { app } from 'electron';
import rimraf from 'rimraf';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore:next-line
// eslint-disable-next-line import/order, @typescript-eslint/no-unused-vars
import electronBuilderJson from '../../../electron-builder.json';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore:next-line
// eslint-disable-next-line import/order, @typescript-eslint/no-unused-vars
import packageJson from '../../../package.json';
import { JITSI_SERVER_CAPTURE_SCREEN_PERMISSIONS_CLEARED } from '../../jitsi/actions';
import { dispatch, listen } from '../../store';
import { readSetting } from '../../store/readSetting';
import {
  SETTINGS_CLEAR_PERMITTED_SCREEN_CAPTURE_PERMISSIONS,
  SETTINGS_SET_HARDWARE_ACCELERATION_OPT_IN_CHANGED,
} from '../../ui/actions';
import { askForClearScreenCapturePermission } from '../../ui/main/dialogs';
import { getRootWindow } from '../../ui/main/rootWindow';
import { APP_MODE, APP_PATH_SET, APP_VERSION_SET } from '../actions';
import { DevelopmentMode } from './dev';

export const packageJsonInformation = {
  productName: packageJson.productName,
  goUrlShortener: packageJson.goUrlShortener,
};

export const electronBuilderJsonInformation = {
  appId: electronBuilderJson.appId,
  protocol: electronBuilderJson.protocols.schemes[0],
};

export const relaunchApp = (...args: string[]): void => {
  const command = process.argv.slice(1, app.isPackaged ? 1 : 2);
  app.relaunch({ args: [...command, ...args] });
  app.exit();
};

export class App {
  static args = process.argv.slice(app.isPackaged ? 1 : 2);
}

export const performElectronStartup = (): void => {
  app.setAsDefaultProtocolClient(electronBuilderJsonInformation.protocol);
  app.setAppUserModelId(electronBuilderJsonInformation.appId);

  app.commandLine.appendSwitch('--autoplay-policy', 'no-user-gesture-required');
  app.commandLine.appendSwitch(
    'disable-features',
    'HardwareMediaKeyHandling,MediaSessionService'
  );

  const { args } = App;

  if (args.includes('--reset-app-data')) {
    rimraf.sync(app.getPath('userData'));
    relaunchApp();
    return;
  }

  const canStart = process.mas || app.requestSingleInstanceLock();

  if (!canStart) {
    app.exit();
    return;
  }

  const isHardwareAccelerationEnabled = readSetting(
    'isHardwareAccelerationEnabled'
  );

  if (
    args.includes('--disable-gpu') ||
    isHardwareAccelerationEnabled === false
  ) {
    console.log('Disabling Hardware acceleration');
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('--disable-2d-canvas-image-chromium');
    app.commandLine.appendSwitch('--disable-accelerated-2d-canvas');
    app.commandLine.appendSwitch('--disable-gpu');
  }
};

export const setupApp = (): void => {
  app.addListener('activate', async () => {
    const browserWindow = await getRootWindow();
    if (!browserWindow.isVisible()) {
      browserWindow.showInactive();
    }
    browserWindow.focus();
  });

  app.addListener('window-all-closed', () => {
    app.quit();
  });

  listen(SETTINGS_SET_HARDWARE_ACCELERATION_OPT_IN_CHANGED, (_action) => {
    relaunchApp();
  });

  listen(
    SETTINGS_CLEAR_PERMITTED_SCREEN_CAPTURE_PERMISSIONS,
    async (_action) => {
      const permitted = await askForClearScreenCapturePermission();

      if (permitted) {
        dispatch({
          type: JITSI_SERVER_CAPTURE_SCREEN_PERMISSIONS_CLEARED,
          payload: {},
        });
      }
    }
  );

  dispatch({ type: APP_PATH_SET, payload: app.getAppPath() });
  dispatch({ type: APP_VERSION_SET, payload: app.getVersion() });

  dispatch({
    type: APP_MODE,
    payload: DevelopmentMode.isDevelopment() ? 'development' : 'production',
  });
};
