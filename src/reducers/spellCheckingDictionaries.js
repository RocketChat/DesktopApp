import { SPELL_CHECKING_DICTIONARIES_UPDATED } from '../actions';

export const spellCheckingDictionaries = (state = [], { type, payload }) => {
	switch (type) {
		case SPELL_CHECKING_DICTIONARIES_UPDATED: {
			const { available, enabled } = payload;
			return available.map((dictionaryName) => ({
				name: dictionaryName,
				enabled: enabled.includes(dictionaryName),
			}));
		}

		default:
			return state;
	}
};
