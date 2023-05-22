import { combineReducers } from 'redux';

import { appMode } from '../app/reducers/appMode';
import { appPath } from '../app/reducers/appPath';
import { appVersion } from '../app/reducers/appVersion';
import { downloads } from '../downloads/reducers/downloads';
import { allowedJitsiServers } from '../jitsi/reducers';
import {
  clientCertificates,
  externalProtocols,
  trustedCertificates,
  notTrustedCertificates,
} from '../navigation/reducers';
import { servers } from '../servers/reducers';
import { currentView } from '../ui/reducers/currentView';
import { hasHideOnTrayNotificationShown } from '../ui/reducers/hasHideOnTrayNotificationShown';
import { isAddNewServersEnabled } from '../ui/reducers/isAddNewServersEnabled';
import { isFlashFrameEnabled } from '../ui/reducers/isFlashFrameEnabled';
import { isHardwareAccelerationEnabled } from '../ui/reducers/isHardwareAccelerationEnabled';
import { isInternalVideoChatWindowEnabled } from '../ui/reducers/isInternalVideoChatWindowEnabled';
import { isMenuBarEnabled } from '../ui/reducers/isMenuBarEnabled';
import { isMessageBoxFocused } from '../ui/reducers/isMessageBoxFocused';
import { isMinimizeOnCloseEnabled } from '../ui/reducers/isMinimizeOnCloseEnabled';
import { isReportEnabled } from '../ui/reducers/isReportEnabled';
import { isShowWindowOnUnreadChangedEnabled } from '../ui/reducers/isShowWindowOnUnreadChangedEnabled';
import { isSideBarEnabled } from '../ui/reducers/isSideBarEnabled';
import { isTrayIconEnabled } from '../ui/reducers/isTrayIconEnabled';
import { openDialog } from '../ui/reducers/openDialog';
import { rootWindowIcon } from '../ui/reducers/rootWindowIcon';
import { rootWindowState } from '../ui/reducers/rootWindowState';
import {
  doCheckForUpdatesOnStartup,
  isCheckingForUpdates,
  isEachUpdatesSettingConfigurable,
  isUpdatingAllowed,
  isUpdatingEnabled,
  newUpdateVersion,
  skippedUpdateVersion,
  updateError,
} from '../updates/reducers';

export const rootReducer = combineReducers({
  allowedJitsiServers,
  appPath,
  appMode,
  appVersion,
  clientCertificates,
  currentView,
  doCheckForUpdatesOnStartup,
  downloads,
  externalProtocols,
  isCheckingForUpdates,
  isEachUpdatesSettingConfigurable,
  isMenuBarEnabled,
  isMessageBoxFocused,
  isShowWindowOnUnreadChangedEnabled,
  isSideBarEnabled,
  isTrayIconEnabled,
  isMinimizeOnCloseEnabled,
  isUpdatingAllowed,
  isUpdatingEnabled,
  newUpdateVersion,
  openDialog,
  rootWindowIcon,
  rootWindowState,
  servers,
  skippedUpdateVersion,
  trustedCertificates,
  notTrustedCertificates,
  updateError,
  isReportEnabled,
  isFlashFrameEnabled,
  isHardwareAccelerationEnabled,
  isInternalVideoChatWindowEnabled,
  isAddNewServersEnabled,
  hasHideOnTrayNotificationShown,
});

export type RootState = ReturnType<typeof rootReducer>;
