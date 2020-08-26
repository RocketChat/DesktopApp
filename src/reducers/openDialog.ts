import { Reducer } from 'redux';

import {
  ABOUT_DIALOG_DISMISSED,
  CERTIFICATES_CLIENT_CERTIFICATE_REQUESTED,
  MENU_BAR_ABOUT_CLICKED,
  SCREEN_SHARING_DIALOG_DISMISSED,
  SELECT_CLIENT_CERTIFICATE_DIALOG_CERTIFICATE_SELECTED,
  SELECT_CLIENT_CERTIFICATE_DIALOG_DISMISSED,
  UPDATE_DIALOG_DISMISSED,
  UPDATE_DIALOG_INSTALL_BUTTON_CLICKED,
  UPDATE_DIALOG_REMIND_UPDATE_LATER_CLICKED,
  UPDATE_DIALOG_SKIP_UPDATE_CLICKED,
  UPDATES_NEW_VERSION_AVAILABLE,
  WEBVIEW_SCREEN_SHARING_SOURCE_REQUESTED,
  WEBVIEW_SCREEN_SHARING_SOURCE_RESPONDED,
  AboutDialogDismissedAction,
  CertificatesClientCertificateRequestedAction,
  MenuBarAboutClickedAction,
  ScreenSharingDialogDismissedAction,
  SelectClientCertificateDialogCertificateSelectedAction,
  SelectClientCertificateDialogDismissedAction,
  UpdateDialogDismissedAction,
  UpdateDialogInstallButtonClickedAction,
  UpdateDialogRemindUpdateLaterClickedAction,
  UpdateDialogSkipUpdateClickedAction,
  UpdatesNewVersionAvailableAction,
  WebviewScreenSharingSourceRequestedAction,
  WebviewScreenSharingSourceRespondedAction,
} from '../actions';

type OpenDialogAction = (
  AboutDialogDismissedAction
  | CertificatesClientCertificateRequestedAction
  | MenuBarAboutClickedAction
  | ScreenSharingDialogDismissedAction
  | SelectClientCertificateDialogCertificateSelectedAction
  | SelectClientCertificateDialogDismissedAction
  | UpdateDialogDismissedAction
  | UpdateDialogInstallButtonClickedAction
  | UpdateDialogRemindUpdateLaterClickedAction
  | UpdateDialogSkipUpdateClickedAction
  | UpdatesNewVersionAvailableAction
  | WebviewScreenSharingSourceRequestedAction
  | WebviewScreenSharingSourceRespondedAction
);

export const openDialog: Reducer<string | null, OpenDialogAction> = (state = null, action) => {
  switch (action.type) {
    case MENU_BAR_ABOUT_CLICKED:
      return 'about';

    case WEBVIEW_SCREEN_SHARING_SOURCE_REQUESTED:
      return 'screen-sharing';

    case UPDATES_NEW_VERSION_AVAILABLE:
      return 'update';

    case CERTIFICATES_CLIENT_CERTIFICATE_REQUESTED:
      return 'select-client-certificate';

    case ABOUT_DIALOG_DISMISSED:
    case SCREEN_SHARING_DIALOG_DISMISSED:
    case WEBVIEW_SCREEN_SHARING_SOURCE_RESPONDED:
    case SELECT_CLIENT_CERTIFICATE_DIALOG_CERTIFICATE_SELECTED:
    case SELECT_CLIENT_CERTIFICATE_DIALOG_DISMISSED:
    case UPDATE_DIALOG_DISMISSED:
    case UPDATE_DIALOG_SKIP_UPDATE_CLICKED:
    case UPDATE_DIALOG_REMIND_UPDATE_LATER_CLICKED:
    case UPDATE_DIALOG_INSTALL_BUTTON_CLICKED:
      return null;

    default:
      return state;
  }
};
