import { ToggleSwitch, Field } from '@rocket.chat/fuselage';
import React, { ChangeEvent, Dispatch, FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { RootAction } from '../../../../store/actions';
import { RootState } from '../../../../store/rootReducer';
import { SETTINGS_SET_BUGSNAG_OPT_IN } from '../../../actions';

export const BugsnagOptIn: FC = () => {
  const isBugsnagEnabled = useSelector(
    ({ isBugsnagEnabled }: RootState) => isBugsnagEnabled
  );
  const dispatch = useDispatch<Dispatch<RootAction>>();
  const { t } = useTranslation();
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.currentTarget.checked;
      dispatch({ type: SETTINGS_SET_BUGSNAG_OPT_IN, payload: isChecked });
    },
    [dispatch]
  );

  return (
    <Field>
      <Field.Row>
        <ToggleSwitch onChange={handleChange} checked={isBugsnagEnabled} />
        <Field.Label htmlFor='toggle-switch'>
          {t('settings.options.bugsnag.title')}
        </Field.Label>
      </Field.Row>
      <Field.Row>
        <Field.Hint>{t('settings.options.bugsnag.description')}</Field.Hint>
      </Field.Row>
    </Field>
  );
};
