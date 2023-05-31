import { Icon, Table } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ActionButton from './ActionButton';
import { invoke } from '../../../ipc/renderer';

type CertificateItemProps = {
  url: string;
};

const CertificateItem: FC<CertificateItemProps> = ({ url }) => {
  const { t } = useTranslation();

  const handleRemove = useCallback(() => {
    invoke('certificatesManager/remove', url);
  }, [url]);

  return (
    <Table.Row key={url}>
      <Table.Cell>
        <Icon name='key' size='x16' />
        {url}
      </Table.Cell>
      <Table.Cell align='end'>
        <ActionButton onClick={handleRemove}>
          {t('certificatesManager.item.remove')}
        </ActionButton>
      </Table.Cell>
    </Table.Row>
  );
};

export default CertificateItem;
