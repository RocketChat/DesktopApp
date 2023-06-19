import {
  Box,
  Button,
  ButtonGroup,
  Callout,
  Chevron,
  Margins,
} from '@rocket.chat/fuselage';
import React, { useEffect, useRef, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';

import { RootAction } from '../../../store/actions';
import { RootState } from '../../../store/rootReducer';
import { compareVersions } from '../../../utils/version';
import {
  UPDATE_DIALOG_SKIP_UPDATE_CLICKED,
  UPDATE_DIALOG_REMIND_UPDATE_LATER_CLICKED,
  UPDATE_DIALOG_INSTALL_BUTTON_CLICKED,
  UPDATE_DIALOG_DISMISSED,
} from '../../actions';
import { Dialog } from '../Dialog';

const os = require('os');

export const UpdateDialog: FC = () => {
  const currentVersion = useSelector(({ appVersion }: RootState) => appVersion);
  const newVersion = useSelector(
    ({ newUpdateVersion }: RootState) => newUpdateVersion
  );
  const openDialog = useSelector(({ openDialog }: RootState) => openDialog);
  const isVisible = openDialog === 'update';

  const dispatch = useDispatch<Dispatch<RootAction>>();

  const { t } = useTranslation();

  const installButtonRef = useRef<HTMLButtonElement>();

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    installButtonRef.current?.focus();
  }, [isVisible]);

  const handleSkipButtonClick = (): void => {
    dispatch({ type: UPDATE_DIALOG_SKIP_UPDATE_CLICKED, payload: newVersion });
  };

  const handleRemindLaterButtonClick = (): void => {
    dispatch({ type: UPDATE_DIALOG_REMIND_UPDATE_LATER_CLICKED });
  };

  const handleInstallButtonClick = (): void => {
    dispatch({ type: UPDATE_DIALOG_INSTALL_BUTTON_CLICKED });
  };

  const handleClose = (): void => {
    dispatch({ type: UPDATE_DIALOG_DISMISSED });
  };

  const showDeprecatedWindowsVersionWarning = (): boolean => {
    if (newVersion === null) {
      return false;
    }

    return (
      os.platform() === 'win32' &&
      compareVersions(os.release(), '<', '10.0.0') &&
      compareVersions(newVersion, '>=', '4.0.0')
    );
  };

  return (
    <Dialog isVisible={isVisible} onClose={handleClose}>
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        width='x450'
      >
        <Box display='flex' flexDirection='column' alignItems='center'>
          <Margins block='x8'>
            <Box fontScale='h1'>{t('dialog.update.announcement')}</Box>
            <Box>{t('dialog.update.message')}</Box>
          </Margins>

          <Margins block='x32'>
            <Box display='flex' alignItems='center' justifyContent='center'>
              <Margins inline='x16'>
                <Box
                  display='flex'
                  flexDirection='column'
                  alignItems='center'
                  color='info'
                >
                  <Box>{t('dialog.update.currentVersion')}</Box>
                  <Box fontScale='p2'>{currentVersion}</Box>
                </Box>
                <Chevron right size='32' />
                <Box display='flex' flexDirection='column' alignItems='center'>
                  <Box>{t('dialog.update.newVersion')}</Box>
                  <Box fontScale='p2'>{newVersion}</Box>
                </Box>
              </Margins>
            </Box>
          </Margins>
        </Box>
        {!showDeprecatedWindowsVersionWarning() && (
          <Callout
            title={t('dialog.update.deprecatedOSTitle')}
            type='warning'
            marginBlockEnd='x32'
          >
            {t('dialog.update.deprecatedWindowsVersion')}
          </Callout>
        )}
        <ButtonGroup>
          <Button type='button' onClick={handleSkipButtonClick}>
            {t('dialog.update.skip')}
          </Button>
          <Button type='button' onClick={handleRemindLaterButtonClick}>
            {t('dialog.update.remindLater')}
          </Button>
          <Button
            ref={installButtonRef}
            type='button'
            primary
            onClick={handleInstallButtonClick}
          >
            {t('dialog.update.install')}
          </Button>
        </ButtonGroup>
      </Box>
    </Dialog>
  );
};
