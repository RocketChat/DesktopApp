import { PersistableValues } from './PersistableValues';

export const APP_ERROR_THROWN = 'app/error-thrown';
export const APP_PATH_SET = 'app/path-set';
export const APP_MODE = 'app/mode';
export const APP_VERSION_SET = 'app/version-set';
export const APP_SETTINGS_LOADED = 'app/settings-loaded';

export type AppActionTypeToPayloadMap = {
  [APP_ERROR_THROWN]: Error;
  [APP_PATH_SET]: string;
  [APP_MODE]: 'production' | 'development';
  [APP_VERSION_SET]: string;
  [APP_SETTINGS_LOADED]: Partial<PersistableValues>;
};
