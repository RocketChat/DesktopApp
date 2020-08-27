import { Reducer } from 'redux';

import { APP_SETTINGS_LOADED } from '../../app/actions';
import { ActionOf } from '../../store/actions';
import { ROOT_WINDOW_STATE_CHANGED } from '../actions';
import { WindowState } from '../common';

type MainWindowStateAction = (
  ActionOf<typeof ROOT_WINDOW_STATE_CHANGED>
  | ActionOf<typeof APP_SETTINGS_LOADED>
);

export const mainWindowState: Reducer<WindowState, MainWindowStateAction> = (state = {
  focused: true,
  visible: true,
  maximized: false,
  minimized: false,
  fullscreen: false,
  normal: true,
  bounds: {
    x: undefined,
    y: undefined,
    width: 1000,
    height: 600,
  },
}, action) => {
  switch (action.type) {
    case ROOT_WINDOW_STATE_CHANGED:
      return action.payload;

    case APP_SETTINGS_LOADED: {
      const { mainWindowState = state } = action.payload;
      return mainWindowState;
    }
  }

  return state;
};
