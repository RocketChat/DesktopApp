import { css } from '@emotion/core';
import styled from '@emotion/styled';

export const Wrapper = styled.section`
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	overflow-y: auto;
	background-color: #2f343d;
	align-items: center;
	-webkit-app-region: drag;
	justify-content: center;

	${ ({ isVisible }) => css`display: ${ isVisible ? 'flex' : 'none' };` };
	${ ({ isFull }) => css`left: ${ isFull ? '0' : '68px' };` }
`;

export const Content = styled.div`
	width: 520px;
	max-width: 100%;
`;
