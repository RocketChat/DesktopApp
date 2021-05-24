import React, { useMemo, FC, DragEvent, MouseEvent } from 'react';

import * as serverActions from '../../../common/actions/serverActions';
import * as viewActions from '../../../common/actions/viewActions';
import { useAppDispatch } from '../../../common/hooks/useAppDispatch';
import {
  Avatar,
  Badge,
  Favicon,
  Initials,
  KeyboardShortcut,
  ServerButtonWrapper,
} from './styles';

type ServerButtonProps = {
  url: string;
  title: string;
  shortcutNumber: string | null;
  isSelected: boolean;
  favicon: string | null;
  isShortcutVisible: boolean;
  hasUnreadMessages: boolean;
  mentionCount?: number;
  isDragged: boolean;
  onDragStart: (event: DragEvent) => void;
  onDragEnd: (event: DragEvent) => void;
  onDragEnter: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
};

const ServerButton: FC<ServerButtonProps> = ({
  url,
  title,
  shortcutNumber,
  isSelected,
  favicon,
  isShortcutVisible,
  hasUnreadMessages,
  mentionCount,
  isDragged,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDrop,
}) => {
  const dispatch = useAppDispatch();

  const handleServerClick = (): void => {
    dispatch(viewActions.changed({ url }));
  };

  const initials = useMemo(
    () =>
      title
        ?.replace(url, new URL(url).hostname ?? '')
        ?.split(/[^A-Za-z0-9]+/g)
        ?.slice(0, 2)
        ?.map((text) => text.slice(0, 1).toUpperCase())
        ?.join(''),
    [title, url]
  );

  const handleServerContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    dispatch(serverActions.popupTriggered(url));
  };

  return (
    <ServerButtonWrapper
      draggable='true'
      tooltip={title}
      isSelected={isSelected}
      isDragged={isDragged}
      hasUnreadMessages={hasUnreadMessages}
      onClick={handleServerClick}
      onContextMenu={handleServerContextMenu}
      onDragOver={(event) => event.preventDefault()}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
    >
      <Avatar isSelected={isSelected}>
        <Initials visible={!favicon}>{initials}</Initials>
        <Favicon draggable='false' src={favicon ?? ''} visible={!!favicon} />
      </Avatar>
      {mentionCount && <Badge>{mentionCount}</Badge>}
      {shortcutNumber && (
        <KeyboardShortcut visible={isShortcutVisible}>
          {process.platform === 'darwin' ? '⌘' : '^'}
          {shortcutNumber}
        </KeyboardShortcut>
      )}
    </ServerButtonWrapper>
  );
};

export default ServerButton;
