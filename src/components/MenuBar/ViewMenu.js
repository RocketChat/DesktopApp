import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { MenuItem } from '../electron/MenuItem';
import { Menu } from '../electron/Menu';
import {
	MENU_BAR_RELOAD_SERVER_CLICKED,
	MENU_BAR_OPEN_DEVTOOLS_FOR_SERVER_CLICKED,
	MENU_BAR_GO_BACK_CLICKED,
	MENU_BAR_GO_FORWARD_CLICKED,
	MENU_BAR_TOGGLE_SETTING_CLICKED,
	MENU_BAR_RESET_ZOOM_CLICKED,
	MENU_BAR_ZOOM_IN_CLICKED,
	MENU_BAR_ZOOM_OUT_CLICKED,
} from '../../actions';

export const ViewMenu = forwardRef(function ViewMenu({
	showFullScreen,
	showMenuBar,
	showServerList,
	showTrayIcon,
}, ref) {
	const { t } = useTranslation();
	const dispatch = useDispatch();

	return <MenuItem ref={ref} label={t('menus.viewMenu')}>
		<Menu>
			<MenuItem
				label={t('menus.reload')}
				accelerator='CommandOrControl+R+A'
				onClick={() => dispatch({ type: MENU_BAR_RELOAD_SERVER_CLICKED })}
			/>
			<MenuItem
				label={t('menus.reloadIgnoringCache')}
				onClick={() => dispatch({ type: MENU_BAR_RELOAD_SERVER_CLICKED, payload: { ignoringCache: true } })}
			/>
			<MenuItem
				label={t('menus.openDevTools')}
				accelerator={process.platform === 'darwin' ? 'Command+Alt+I' : 'Ctrl+Shift+I'}
				onClick={() => dispatch({ type: MENU_BAR_OPEN_DEVTOOLS_FOR_SERVER_CLICKED })}
			/>
			<MenuItem type='separator' />
			<MenuItem
				label={t('menus.back')}
				accelerator={process.platform === 'darwin' ? 'Command+[' : 'Alt+Left'}
				onClick={() => dispatch({ type: MENU_BAR_GO_BACK_CLICKED })}
			/>
			<MenuItem
				label={t('menus.forward')}
				accelerator={process.platform === 'darwin' ? 'Command+]' : 'Alt+Right'}
				onClick={() => dispatch({ type: MENU_BAR_GO_FORWARD_CLICKED })}
			/>
			<MenuItem type='separator' />
			<MenuItem
				label={t('menus.showTrayIcon')}
				type='checkbox'
				checked={showTrayIcon}
				onClick={() => dispatch({ type: MENU_BAR_TOGGLE_SETTING_CLICKED, payload: 'showTrayIcon' })}
			/>
			{process.platform === 'darwin' && <>
				<MenuItem
					label={t('menus.showFullScreen')}
					type='checkbox'
					checked={showFullScreen}
					accelerator='Control+Command+F'
					onClick={() => dispatch({ type: MENU_BAR_TOGGLE_SETTING_CLICKED, payload: 'showFullScreen' })}
				/>
			</>}
			{process.platform !== 'darwin' && <>
				<MenuItem
					label={t('menus.showMenuBar')}
					type='checkbox'
					checked={showMenuBar}
					onClick={() => dispatch({ type: MENU_BAR_TOGGLE_SETTING_CLICKED, payload: 'showMenuBar' })}
				/>
			</>}
			<MenuItem
				label={t('menus.showServerList')}
				type='checkbox'
				checked={showServerList}
				onClick={() => dispatch({ type: MENU_BAR_TOGGLE_SETTING_CLICKED, payload: 'showServerList' })}
			/>
			<MenuItem type='separator' />
			<MenuItem
				label={t('menus.resetZoom')}
				accelerator='CommandOrControl+0'
				onClick={() => dispatch({ type: MENU_BAR_RESET_ZOOM_CLICKED })}
			/>
			<MenuItem
				label={t('menus.zoomIn')}
				accelerator='CommandOrControl+Plus'
				onClick={() => dispatch({ type: MENU_BAR_ZOOM_IN_CLICKED })}
			/>
			<MenuItem
				label={t('menus.zoomOut')}
				accelerator='CommandOrControl+-'
				onClick={() => dispatch({ type: MENU_BAR_ZOOM_OUT_CLICKED })}
			/>
		</Menu>
	</MenuItem>;
});
