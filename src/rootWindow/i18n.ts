import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import {
  I18N_PARAMS_REQUESTED,
} from '../actions';
import { request } from '../channels';

export const setupI18next = async (): Promise<void> => {
  const { lng, fallbackLng, resources } = await request(I18N_PARAMS_REQUESTED, undefined);

  await i18next
    .use(initReactI18next)
    .init({
      lng,
      fallbackLng,
      resources,
      interpolation: {
        format: (value, _format, lng) => {
          if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return new Intl.DateTimeFormat(lng).format(value);
          }

          return String(value);
        },
      },
    });
};
