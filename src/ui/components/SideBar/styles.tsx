import { css } from '@emotion/react';
import styled from '@emotion/styled';

import { withTooltip } from './withTolltip';

type WrapperProps = {
  sideBarStyle: {
    // background?: string;
    // color?: string;
    // border?: string;
  };
  isVisible: boolean;
  // customTheme?: string;
};

export const Wrapper = styled.div<WrapperProps>``;

type ContentProps = {
  withWindowButtons: boolean;
};

export const Content = styled.div<ContentProps>`
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  padding-top: 10px;
  align-items: stretch;

  ${({ withWindowButtons }) =>
    withWindowButtons &&
    css`
      padding-top: 28px;
    `}
`;

export const ServerList = styled.ol`
  -webkit-app-region: no-drag;
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
  align-items: center;
`;

type ServerButtonWrapperProps = {
  isDragged: boolean;
  hasUnreadMessages: boolean;
  isSelected: boolean;
  tooltip: string;
};

export const ServerButtonWrapper = styled.li<ServerButtonWrapperProps>`
  list-style-type: none;
  ${({ isDragged }) =>
    isDragged &&
    css`
      opacity: 0.5;
    `}

  ${withTooltip}
`;

type InitialsProps = {
  visible: boolean;
};

export const Initials = styled.span<InitialsProps>`
  line-height: 42px;

  ${({ visible }) => css`
    display: ${visible ? 'initial' : 'none'};
  `}
`;

type FaviconProps = {
  visible: boolean;
};

export const Favicon = styled.img<FaviconProps>`
  max-width: 100%;
  height: 100%;
  object-fit: contain;
  ${({ visible }) => css`
    display: ${visible ? 'initial' : 'none'};
  `}
`;

type AvatarProps = {
  isSelected: boolean;
};

export const Avatar = styled.span<AvatarProps>``;

export const AddServerButton = styled.button`
  -webkit-app-region: no-drag;
  font-family: inherit;
  position: relative;
  flex: 0 0 auto;
  box-sizing: border-box;
  margin: 4px 0;
  font-size: 2.5rem;
  line-height: 1.25;
  display: flex;
  flex-direction: row;
  height: 40px;
  padding: 0;
  color: inherit;
  border: none;
  background: none;
  align-items: center;
  justify-content: center;
`;

type AddServerButtonLabelProps = {
  tooltip: string;
};

export const AddServerButtonLabel = styled.span<AddServerButtonLabelProps>`
  display: block;
  line-height: 30px;
  width: 40px;
  height: 40px;
  transition: opacity var(--transitions-duration);
  opacity: 0.6;
  color: inherit;
  background-color: rgba(0, 0, 0, 0.1);
  cursor: pointer;

  &:hover {
    opacity: 1;
  }

  ${withTooltip}
`;

type SidebarActionButtonProps = {
  isSelected?: boolean;
  tooltip: string;
};

export const SidebarActionButton = styled.span<SidebarActionButtonProps>`
  -webkit-app-region: no-drag;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity var(--transitions-duration);
  opacity: 0.6;

  ${({ isSelected }) =>
    isSelected &&
    css`
      opacity: 1;
    `}

  &:hover {
    opacity: 1;
  }

  ${withTooltip}
`;
