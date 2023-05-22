import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';

import { app, session, WebContents } from 'electron';

import { App } from './app';

export const setUserDataDirectory = (): void => {
  if (process.env.NODE_ENV !== 'development' || process.mas) {
    return;
  }

  const folder = path.join(app.getPath('appData'), `${app.name} (development)`);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  console.log(`Setting user data directory to ${folder}`);
  app.setPath('userData', folder);
};

export const setupRootWindowReload = async (
  webContents: WebContents
): Promise<void> => {
  const chokidar = await import('chokidar');
  chokidar
    .watch(path.join(app.getAppPath(), 'app/rootWindow.js'), {
      awaitWriteFinish: true,
    })
    .on('change', () => {
      if (webContents.isDestroyed()) {
        return;
      }

      console.log('Reloading root window...');
      webContents.reload();
    });
};

export const setupPreloadReload = async (
  webContents: WebContents
): Promise<void> => {
  const chokidar = await import('chokidar');
  chokidar
    .watch(
      [
        path.join(app.getAppPath(), 'app/preload.js'),
        path.join(app.getAppPath(), 'app/injected.js'),
      ],
      {
        awaitWriteFinish: true,
      }
    )
    .on('change', () => {
      if (webContents.isDestroyed()) {
        return;
      }

      console.log('Reloading webview...');
      webContents.reload();
    });
};

export const installDevTools = async (): Promise<void> => {
  const devToolsExtensionsIds = [
    'fmkadmapgofadopljbjfkapdkoienihi/4.25.0', // React DevTools
    'lmhkpmbekcpmknklioeibfkpmmfibljd/3.0.17_0', // Redux DevTools
  ];

  const osChromeExtensionsPath = {
    linux: path.join(os.homedir(), '.config/google-chrome/Default/Extensions/'),
    darwin: path.join(
      os.homedir(),
      'Library/Application Support/Google/Chrome/Default/Extensions'
    ),
    win32: path.join(
      os.homedir(),
      'AppData/Local/Google/Chrome/User Data/Default/Extensions/'
    ),
  };

  devToolsExtensionsIds.forEach((extensionId) => {
    const extensionPath = path.join(
      osChromeExtensionsPath[process.platform],
      extensionId
    );

    if (!fs.existsSync(extensionPath)) {
      return;
    }

    app.whenReady().then(async () => {
      console.log(`Loading extension: ${extensionPath}`);
      await session.defaultSession.loadExtension(extensionPath);
    });
  });
};

export class DevelopmentMode {
  public static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || App.args.includes('--dev');
  }

  public static setupServer(): void {
    http
      .createServer((req, res) => {
        const file = path
          .join(app.getAppPath(), 'app', req.url ?? 'index.html')
          .replace('app/app', 'app');
        fs.readFile(file, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
          }
          res.writeHead(200);
          res.end(data);
        });
      })
      .listen(process.env.ELECTRON_WEBCLIENT_PORT);
    console.log(
      `Development server listening on port ${process.env.ELECTRON_WEBCLIENT_PORT}`
    );
  }

  public static installDevTools(): Promise<void> {
    return installDevTools();
  }
}
