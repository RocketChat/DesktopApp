import { Reducer } from 'redux';

import { ActionOf } from '../../store/actions';
import { APP_MODE } from '../actions';

type AppModeAction = ActionOf<typeof APP_MODE>;

export const appMode: Reducer<string | null, AppModeAction> = (
  state = null,
  action
) => {
  switch (action.type) {
    case APP_MODE:
      return action.payload;

    default:
      return state;
  }
};
