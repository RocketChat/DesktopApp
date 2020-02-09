import { remote } from 'electron';
import { forwardRef, useImperativeHandle, useRef } from 'react';

import { useElementRefValue } from './useElementRefValue';

export const Group = forwardRef(function Group({
	children: itemsElement,
}, ref) {
	const innerRef = useRef();

	const [items, clonedItemsElement] = useElementRefValue(itemsElement);

	useImperativeHandle(ref, () => {
		innerRef.current = new remote.TouchBar.TouchBarGroup({
			items: items || {},
		});
		return innerRef.current;
	}, [items]);

	return clonedItemsElement;
});
