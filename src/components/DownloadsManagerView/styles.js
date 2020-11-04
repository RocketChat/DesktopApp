import { css } from '@emotion/core';
import styled from '@emotion/styled';


export const Wrapper = styled.section`
	background-color: white;
	height: 100%;
	display: flex;
	flex-direction: column;

	overflow-y: auto;
	justify-content: flex-start;

	${ ({ isVisible }) => css`display: ${ isVisible ? 'flex' : 'none' };` };
`;

export const Content = styled.div`
	position: relative;
	top: 10%;
	width: 100%;
	max-width: 100%;
	display: flex;
	justify-content: center;
`;

export const ClickableLink = styled.a`
	cursor: pointer;

	&:hover,
	&:focus {
		${ ({ isRemove }) => css`color: ${ !isRemove ? '#2F343D' : '#F5455C' };` };
	}
`;
