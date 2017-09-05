import { remote } from 'electron';
import i18n from '../i18n';
//import servers from './servers';
import appMenu from './app';
/*import editMenu from './edit';
import viewMenu from './view';
import windowMenu from './window';
import helpMenu from './help';*/

const Menu = remote.Menu;
const APP_NAME = remote.app.getName();
const isMac = process.platform === 'darwin';

document.title = APP_NAME;

function getLabel(label) {
  return isMac ? label : `&${label}`;
}

const menuTemplate = [
  {
    label: getLabel(APP_NAME),
    submenu: appMenu
  },
  /*{
      label: getLabel(i18n.__('Edit')),
      submenu: editMenu
  },
  {
      label: getLabel(i18n.__('View')),
      submenu: viewMenu
  },
  {
      label: getLabel(i18n.__('Window')),
      id: 'window',
      role: 'window',
      submenu: windowMenu
  }*/
];

/*if (isMac) {
  menuTemplate.push({
    label: i18n.__('Help'),
    role: 'help',
    submenu: helpMenu
  });
}*/

function createMenu() {
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

/*function addServer (host, position) {
    const index = windowMenu.findIndex((i) => i.id === 'server-list-separator');
    windowMenu[index].visible = true;

    const menuItem = {
        label: host.title,
        accelerator: `CmdOrCtrl+ ${position}`,
        position: 'before=server-list-separator',
        id: host.url,
        click: () => {
            const mainWindow = remote.getCurrentWindow();
            mainWindow.show();
            servers.setActive(host.url);
        }
    };

    windowMenu.push(menuItem);

    createMenu();
}

function removeServer (server) {
    const index = windowMenu.findIndex((i) => i.id === server);
    windowMenu.splice(index, 1);
    createMenu();
}

function autoHideMenu () {
    remote.getCurrentWindow().setAutoHideMenuBar(true);
}

if (!isMac && localStorage.getItem('autohideMenu') === 'true') {
    autoHideMenu();
}*/

createMenu();

/*export {
    addServer,
    removeServer
};*/
