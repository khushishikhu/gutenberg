/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';
import { Card, CardHeader, CardFooter } from '../card';
import { Button } from '../button';
import { Heading } from '../heading';

/**
 * Internal dependencies
 */
import type { OwnProps } from './types';
import { useConfirm } from './hook';
import { contextConnect, PolymorphicComponentProps } from '../ui/context';

function Confirm(
	props: PolymorphicComponentProps< OwnProps, 'div' >,
	forwardedRef: Ref< any >
) {
	const { role, wrapperClassName, ...otherProps } = useConfirm( props );

	return (
		<div { ...otherProps } role={ role } className={ wrapperClassName }>
			<Card ref={ forwardedRef }>
				<CardHeader>
					<Heading level="4">Are you sure?</Heading>
				</CardHeader>
				<CardFooter justify="center">
					<Button>OK</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

export default contextConnect( Confirm, 'Confirm' );
