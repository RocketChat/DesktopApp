import { EditFlags } from 'electron';
import { Reducer } from 'redux';

import {
  ROOT_WINDOW_EDIT_FLAGS_CHANGED,
  WEBVIEW_EDIT_FLAGS_CHANGED,
  RootWindowEditFlagsChangedAction,
  WebviewEditFlagsChangedAction,
} from '../actions';

type EditFlagsAction = (
  RootWindowEditFlagsChangedAction
  | WebviewEditFlagsChangedAction
);


export const editFlags: Reducer<EditFlags, EditFlagsAction> = (state = {
  canUndo: false,
  canRedo: false,
  canCut: false,
  canCopy: false,
  canPaste: false,
  canSelectAll: false,
  canDelete: false,
}, action) => {
  switch (action.type) {
    case ROOT_WINDOW_EDIT_FLAGS_CHANGED:
      return action.payload;

    case WEBVIEW_EDIT_FLAGS_CHANGED:
      return action.payload;

    default:
      return state;
  }
};
