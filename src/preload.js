import setupJitsiPreload from './preload/jitsi';
import setupLinksPreload from './preload/links';
import setupNotificationsPreload from './preload/notifications';
import setupSpellcheckingPreload from './preload/spellChecking';
import setupChangesPreload from './preload/changes';
import setupUserPresencePreload from './preload/userPresence';
import { setupI18next } from './i18n';
import { setupErrorHandling } from './preload/errors';

const initialize = async () => {
	await setupI18next();

	setupJitsiPreload();
	setupLinksPreload();
	setupNotificationsPreload();
	setupSpellcheckingPreload();
	setupChangesPreload();
	setupUserPresencePreload();
};

window.addEventListener('load', () => {
	setupErrorHandling();
});

initialize();
