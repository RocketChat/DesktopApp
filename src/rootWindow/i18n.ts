import { ipcRenderer } from 'electron';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { QUERY_I18N_PARAMS } from '../ipc';

export const setupI18next = async (): Promise<void> => {
	const { lng, resources } = await ipcRenderer.invoke(QUERY_I18N_PARAMS);

	await i18next
		.use(initReactI18next)
		.init({
			lng,
			resources,
			interpolation: {
				format: (value, _format, lng) => {
					if (value instanceof Date) {
						return new Intl.DateTimeFormat(lng).format(value);
					}

					return value;
				},
			},
		});
};