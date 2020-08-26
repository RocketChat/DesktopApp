import Bugsnag from '@bugsnag/js';
import { app } from 'electron';

const setupBugsnag = (apiKey: string): void => {
  Bugsnag.start({
    apiKey,
    appVersion: app.getVersion(),
    appType: 'main',
    collectUserIp: false,
    releaseStage: process.env.NODE_ENV,
  });
};

export const attachErrorHandlers = (): void => {
  if (process.env.BUGSNAG_API_KEY) {
    setupBugsnag(process.env.BUGSNAG_API_KEY);
    return;
  }

  process.addListener('uncaughtException', (error) => {
    console.error(error);
    app.exit(1);
  });

  process.addListener('unhandledRejection', (reason) => {
    console.error(reason);
    app.exit(1);
  });
};
