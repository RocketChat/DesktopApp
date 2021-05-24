import {
  TouchBar,
  nativeImage,
  app,
  TouchBarScrubber,
  TouchBarPopover,
  TouchBarSegmentedControl,
} from 'electron';
import i18next from 'i18next';

import * as messageBoxActions from '../common/actions/messageBoxActions';
import * as rootWindowActions from '../common/actions/rootWindowActions';
import * as viewActions from '../common/actions/viewActions';
import { select, dispatch, Service } from '../common/store';
import type { RootState } from '../common/types/RootState';
import type { Server } from '../common/types/Server';
import { getRootWindow } from './rootWindow';

const t = i18next.t.bind(i18next);

const ids = ['bold', 'italic', 'strike', 'inline_code', 'multi_line'] as const;

const createTouchBar = (): [
  TouchBar,
  TouchBarPopover,
  TouchBarScrubber,
  TouchBarSegmentedControl
] => {
  const serverSelectionScrubber = new TouchBar.TouchBarScrubber({
    selectedStyle: 'background',
    mode: 'free',
    continuous: false,
    items: [],
    select: async (index) => {
      dispatch(rootWindowActions.focused());

      const url = select((state) => state.servers[index].url);
      dispatch(viewActions.changed({ url }));
    },
  });

  const serverSelectionPopover = new TouchBar.TouchBarPopover({
    label: t('touchBar.selectServer'),
    icon: undefined,
    items: new TouchBar({
      items: [serverSelectionScrubber],
    }),
    showCloseButton: true,
  });

  const messageBoxFormattingButtons = new TouchBar.TouchBarSegmentedControl({
    mode: 'buttons',
    segments: ids.map((id) => ({
      icon: nativeImage.createFromPath(
        `${app.getAppPath()}/app/images/touch-bar/${id}.png`
      ),
      enabled: false,
    })),
    change: async (selectedIndex) => {
      dispatch(rootWindowActions.focused());
      dispatch(messageBoxActions.formatButtonClicked(ids[selectedIndex]));
    },
  });

  const touchBar = new TouchBar({
    items: [
      serverSelectionPopover,
      new TouchBar.TouchBarSpacer({ size: 'flexible' }),
      messageBoxFormattingButtons,
      new TouchBar.TouchBarSpacer({ size: 'flexible' }),
    ],
  });

  getRootWindow().then((browserWindow) => browserWindow.setTouchBar(touchBar));

  return [
    touchBar,
    serverSelectionPopover,
    serverSelectionScrubber,
    messageBoxFormattingButtons,
  ];
};

const updateServerSelectionPopover = (
  serverSelectionPopover: TouchBarPopover,
  currentServer: Server | null
): void => {
  serverSelectionPopover.label =
    currentServer?.title ?? t('touchBar.selectServer');
  serverSelectionPopover.icon = currentServer?.favicon
    ? nativeImage.createFromDataURL(currentServer?.favicon)
    : nativeImage.createEmpty();
};

const updateServerSelectionScrubber = (
  serverSelectionScrubber: TouchBarScrubber,
  servers: Server[]
): void => {
  serverSelectionScrubber.items = servers.map((server) => ({
    label: server.title?.padEnd(30),
    icon: server.favicon
      ? nativeImage.createFromDataURL(server.favicon)
      : undefined,
  }));
};

const toggleMessageFormattingButtons = (
  messageBoxFormattingButtons: TouchBarSegmentedControl,
  isEnabled: boolean
): void => {
  messageBoxFormattingButtons.segments.forEach((segment) => {
    segment.enabled = isEnabled;
  });
};

const selectCurrentServer = ({
  servers,
  ui: { view },
}: RootState): Server | null =>
  typeof view === 'object'
    ? servers.find(({ url }) => url === view.url) ?? null
    : null;

class TouchBarService extends Service {
  protected initialize(): void {
    if (process.platform !== 'darwin') {
      return;
    }

    const [
      touchBar,
      serverSelectionPopover,
      serverSelectionScrubber,
      messageBoxFormattingButtons,
    ] = createTouchBar();

    this.watch(selectCurrentServer, (currentServer) => {
      updateServerSelectionPopover(serverSelectionPopover, currentServer);
      getRootWindow().then((browserWindow) =>
        browserWindow.setTouchBar(touchBar)
      );
    });

    this.watch(
      ({ servers }) => servers,
      (servers) => {
        updateServerSelectionScrubber(serverSelectionScrubber, servers);
        getRootWindow().then((browserWindow) =>
          browserWindow.setTouchBar(touchBar)
        );
      }
    );

    this.watch(
      (state) => state.ui.messageBox.focused ?? false,
      (isMessageBoxFocused) => {
        toggleMessageFormattingButtons(
          messageBoxFormattingButtons,
          isMessageBoxFocused
        );
        getRootWindow().then((browserWindow) =>
          browserWindow.setTouchBar(touchBar)
        );
      }
    );
  }
}

export default new TouchBarService();
