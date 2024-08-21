import fs from 'fs';
import path from 'path';
import util from 'util';

import * as icnsConvert from '@fiahfy/icns-convert';
import * as icoConvert from '@fiahfy/ico-convert';
import Jimp from 'jimp';
import puppeteer from 'puppeteer';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { rimraf } from 'rimraf';

import type { Server } from './servers/common';
import DmgBackground from './ui/assets/DmgBackground';
import NsisSideBar from './ui/assets/NsisSideBar';
import AppIcon from './ui/icons/AppIcon';
import LinuxTrayIcon from './ui/icons/LinuxTrayIcon';
import MacOSAppIcon from './ui/icons/MacOSAppIcon';
import MacOSTrayIcon from './ui/icons/MacOSTrayIcon';
import WindowsTrayIcon from './ui/icons/WindowsTrayIcon';

const convertSvgToPng = async (
  svg: string,
  ...sizes: (number | [number, number])[]
): Promise<Buffer[]> => {
  const browser = await puppeteer.launch({
    // headless: 'new',
    args: ['--use-gl=desktop', '--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  );

  const buffers: Buffer[] = [];

  for await (const size of sizes) {
    await page.setViewport({
      ...(typeof size === 'number'
        ? {
            width: size,
            height: size,
          }
        : {
            width: size[0],
            height: size[1],
          }),
      deviceScaleFactor: 1,
    });
    const buffer = Buffer.from(
      await page.screenshot({
        type: 'png',
        omitBackground: true,
      })
    );
    buffers.push(buffer);
  }

  await page.close();
  await browser.close();

  return buffers;
};

const writeFile = async (filePath: string, data: Buffer): Promise<void> => {
  console.log(util.inspect(filePath, { colors: true }));
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  return fs.promises.writeFile(filePath, data);
};

const createMacOSAppIcon = async (): Promise<void> => {
  const macOSAppIcon = renderToStaticMarkup(createElement(MacOSAppIcon));
  const pngs = await convertSvgToPng(
    macOSAppIcon,
    1024,
    512,
    256,
    128,
    64,
    48,
    32,
    16
  );
  const icns = await icnsConvert.convert(pngs);
  await writeFile('build/icon.icns', icns);
};

const createMacOSTrayIcons = async (): Promise<void> => {
  const defaultIcon = renderToStaticMarkup(createElement(MacOSTrayIcon));
  const defaultIconPngs = await convertSvgToPng(defaultIcon, 24, 48);
  await writeFile(
    'src/public/images/tray/darwin/defaultTemplate.png',
    defaultIconPngs[0]
  );
  await writeFile(
    'src/public/images/tray/darwin/defaultTemplate@2x.png',
    defaultIconPngs[1]
  );

  const notificationIcon = renderToStaticMarkup(
    createElement(MacOSTrayIcon, { notification: true })
  );
  const notificationIconPngs = await convertSvgToPng(notificationIcon, 24, 48);
  await writeFile(
    'src/public/images/tray/darwin/notificationTemplate.png',
    notificationIconPngs[0]
  );
  await writeFile(
    'src/public/images/tray/darwin/notificationTemplate@2x.png',
    notificationIconPngs[1]
  );
};

const createDmgBackgrounds = async (): Promise<void> => {
  const background = renderToStaticMarkup(createElement(DmgBackground));
  const backgroundPngs = await convertSvgToPng(
    background,
    [600, 422],
    [2 * 600, 2 * 422]
  );
  await writeFile('build/background.png', backgroundPngs[0]);
  await writeFile('build/background@2x.png', backgroundPngs[1]);
};

const createWindowsAppIcons = async (): Promise<void> => {
  const windowsAppIcon = renderToStaticMarkup(createElement(AppIcon));
  const pngs = await convertSvgToPng(
    windowsAppIcon,
    16,
    24,
    32,
    48,
    64,
    128,
    256
  );
  const ico = await icoConvert.convert(pngs);
  await writeFile('build/installerIcon.ico', ico);
  await writeFile('build/uninstallerIcon.ico', ico);
  await writeFile('build/icon.ico', ico);
  await writeFile('src/public/images/icon.ico', ico);
};

const createWindowsTrayIcons = async (): Promise<void> => {
  const defaultIcon = renderToStaticMarkup(createElement(WindowsTrayIcon));
  const defaultIconPngs = await convertSvgToPng(
    defaultIcon,
    16,
    24,
    32,
    48,
    64,
    128,
    256
  );
  const defaultIconIco = await icoConvert.convert(defaultIconPngs);
  await writeFile('src/public/images/tray/win32/default.ico', defaultIconIco);

  for await (const badge of [
    '•',
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
  ] as Server['badge'][]) {
    const notificationIcon = renderToStaticMarkup(
      createElement(WindowsTrayIcon, { badge })
    );
    const notificationIconPngs = await convertSvgToPng(
      notificationIcon,
      16,
      24,
      32,
      48,
      64,
      128,
      256
    );
    const notificationIconIco = await icoConvert.convert(notificationIconPngs);
    const name =
      (badge === '•' && 'dot') ||
      (typeof badge === 'number' && badge > 9 && 'plus-9') ||
      String(badge);
    await writeFile(
      `src/public/images/tray/win32/notification-${name}.ico`,
      notificationIconIco
    );
  }
};

const createNsisSideBars = async (): Promise<void> => {
  const sideBar = renderToStaticMarkup(createElement(NsisSideBar));
  const [sideBarPng] = await convertSvgToPng(sideBar, [164, 314]);
  const sidebarBitmap = await (
    await Jimp.read(sideBarPng)
  ).getBufferAsync(Jimp.MIME_BMP);
  await writeFile('build/installerSidebar.bmp', sidebarBitmap);
  await writeFile('build/uninstallerSidebar.bmp', sidebarBitmap);
};

const createLinuxAppIcons = async (): Promise<void> => {
  const linuxAppIcon = renderToStaticMarkup(createElement(AppIcon));
  const pngs = await convertSvgToPng(
    linuxAppIcon,
    16,
    32,
    48,
    64,
    128,
    256,
    512
  );
  await writeFile('build/icons/16x16.png', pngs[0]);
  await writeFile('build/icons/32x32.png', pngs[1]);
  await writeFile('build/icons/48x48.png', pngs[2]);
  await writeFile('build/icons/64x64.png', pngs[3]);
  await writeFile('build/icons/128x128.png', pngs[4]);
  await writeFile('build/icons/256x256.png', pngs[5]);
  await writeFile('build/icons/512x512.png', pngs[6]);
};

const createLinuxTrayIcons = async (): Promise<void> => {
  const defaultIcon = renderToStaticMarkup(createElement(LinuxTrayIcon));
  const defaultIconPngs = await convertSvgToPng(defaultIcon, 64, 128);
  await writeFile(
    'src/public/images/tray/linux/default.png',
    defaultIconPngs[0]
  );
  await writeFile(
    'src/public/images/tray/linux/default@2x.png',
    defaultIconPngs[1]
  );

  for await (const badge of [
    '•',
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
  ] as Server['badge'][]) {
    const notificationIcon = renderToStaticMarkup(
      createElement(LinuxTrayIcon, { badge })
    );
    const notificationIconPngs = await convertSvgToPng(
      notificationIcon,
      64,
      128
    );
    const name =
      (badge === '•' && 'dot') ||
      (typeof badge === 'number' && badge > 9 && 'plus-9') ||
      String(badge);
    await writeFile(
      `src/public/images/tray/linux/notification-${name}.png`,
      notificationIconPngs[0]
    );
    await writeFile(
      `src/public/images/tray/linux/notification-${name}@2x.png`,
      notificationIconPngs[1]
    );
  }
};

const run = async (): Promise<void> => {
  await createMacOSAppIcon();
  await createWindowsAppIcons();
  await createLinuxAppIcons();

  await rimraf('src/public/images/tray');

  await createMacOSTrayIcons();
  await createWindowsTrayIcons();
  await createLinuxTrayIcons();

  await createDmgBackgrounds();
  await createNsisSideBars();
};

if (require.main === module) {
  run();
}
