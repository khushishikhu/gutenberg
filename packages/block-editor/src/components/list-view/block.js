/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalTreeGridCell as TreeGridCell,
	__experimentalTreeGridItem as TreeGridItem,
	__experimentalTreeGridRow as TreeGridRow,
	MenuGroup,
	MenuItem,
	__unstableUseMotionValue as useMotionValue,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { useState, useRef, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	BlockMoverUpButton,
	BlockMoverDownButton,
} from '../block-mover/button';
import ListViewBlockContents from './block-contents';
import BlockSettingsDropdown from '../block-settings-menu/block-settings-dropdown';
import { useListViewContext } from './context';
import { store as blockEditorStore } from '../../store';

export default function ListViewBlock( {
	block,
	isSelected,
	isBranchSelected,
	isLastOfSelectedBranch,
	onClick,
	onToggleExpanded,
	position,
	level,
	rowCount,
	siblingBlockCount,
	showBlockMovers,
	isExpanded,
	animateToggleOpen,
	setPosition,
	moveItem,
	dropItem,
	listPosition,
	parentId,
} ) {
	const cellRef = useRef( null );
	const [ isHovered, setIsHovered ] = useState( false );
	const { clientId } = block;
	const { blockParents } = useSelect(
		( select ) => {
			const { getBlockParents } = select( blockEditorStore );

			return {
				blockParents: getBlockParents( clientId ),
			};
		},
		[ clientId ]
	);

	const {
		selectBlock: selectEditorBlock,
		toggleBlockHighlight,
	} = useDispatch( blockEditorStore );

	const hasSiblings = siblingBlockCount > 0;
	const hasRenderedMovers = showBlockMovers && hasSiblings;
	const moverCellClassName = classnames(
		'block-editor-list-view-block__mover-cell',
		{ 'is-visible': isHovered }
	);
	const {
		__experimentalFeatures: withExperimentalFeatures,
		__experimentalPersistentListViewFeatures: withExperimentalPersistentListViewFeatures,
		isTreeGridMounted,
		animate,
		draggingId,
		setDraggingId,
		collapse,
		expand,
	} = useListViewContext();

	//TODO: handle block delete
	useEffect( () => {
		setPosition( listPosition, {
			...{
				clientId,
				dropContainer: block?.dropContainer ?? false,
				dropSibling: block?.dropSibling ?? false,
				parentId,
			},
		} );
	}, [ listPosition, draggingId ] );

	const listViewBlockSettingsClassName = classnames(
		'block-editor-list-view-block__menu-cell',
		{ 'is-visible': isHovered }
	);

	// If ListView has experimental features related to the Persistent List View,
	// only focus the selected list item on mount; otherwise the list would always
	// try to steal the focus from the editor canvas.
	useEffect( () => {
		if (
			withExperimentalPersistentListViewFeatures &&
			! isTreeGridMounted &&
			isSelected
		) {
			cellRef.current.focus();
		}
	}, [] );

	// If ListView has experimental features (such as drag and drop) enabled,
	// leave the focus handling as it was before, to avoid accidental regressions.
	useEffect( () => {
		if ( withExperimentalFeatures && isSelected ) {
			cellRef.current.focus();
		}
	}, [ withExperimentalFeatures, isSelected ] );

	const highlightBlock = withExperimentalPersistentListViewFeatures
		? toggleBlockHighlight
		: () => {};

	const onMouseEnter = () => {
		setIsHovered( true );
		if ( ! draggingId ) {
			highlightBlock( clientId, true );
		}
	};
	const onMouseLeave = () => {
		setIsHovered( false );
		if ( ! draggingId ) {
			highlightBlock( clientId, false );
		}
	};

	const classes = classnames( {
		'block-editor-list-view-leaf': true,
		'is-selected': isSelected,
		'is-branch-selected':
			withExperimentalPersistentListViewFeatures && isBranchSelected,
		'is-last-of-selected-branch':
			withExperimentalPersistentListViewFeatures &&
			isLastOfSelectedBranch,
		'is-moving': draggingId === clientId, //avoid is-dragging which has an !important rule
	} );

	const onDragStart = () => {
		setDraggingId( clientId );
		collapse( clientId );
	};

	const onDragEnd = () => {
		expand( clientId );
		setDraggingId( null );
		dropItem();
	};

	const velocity = useMotionValue( 0 );
	const onDrag = ( event, info ) => {
		// When swapping items with a neighbor a positive translate value is moving down, and a
		// negative value is moving up in the onViewportBoxUpdate callback.
		//
		// However, when skipping over items, we need mouse velocity to understand if the user is
		// dragging up or down. This is because with the view box in the same position, the
		// originPoint is modified and the translate value will flip its sign.
		//
		// Velocity is not available in onViewportBoxUpdate, so we set this motion value here:
		velocity.set( info.velocity.y );
	};

	const blockDrag = ( box, delta ) => {
		if ( draggingId === clientId ) {
			moveItem( {
				block,
				translate: delta.y.translate,
				translateX: delta.x.translate,
				velocity,
				listPosition,
			} );
		}
	};

	return (
		<TreeGridRow
			className={ classes }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			onFocus={ onMouseEnter }
			onBlur={ onMouseLeave }
			level={ level }
			positionInSet={ position }
			setSize={ rowCount }
			id={ `list-view-block-${ clientId }` }
			data-block={ clientId }
			isExpanded={ isExpanded }
			animate={ animate }
			animateOnMount={ animateToggleOpen }
			drag
			dragConstraints={ { left: -10, right: 10 } }
			whileDrag={ { scale: 1.1 } }
			onDragStart={ onDragStart }
			onDrag={ onDrag }
			onDragEnd={ onDragEnd }
			onViewportBoxUpdate={ blockDrag }
			layoutId={ clientId }
		>
			<TreeGridCell
				className="block-editor-list-view-block__contents-cell"
				colSpan={ hasRenderedMovers ? undefined : 2 }
				ref={ cellRef }
			>
				{ ( { ref, tabIndex, onFocus } ) => (
					<div className="block-editor-list-view-block__contents-container">
						<ListViewBlockContents
							block={ block }
							onClick={ onClick }
							onToggleExpanded={ onToggleExpanded }
							isSelected={ isSelected }
							position={ position }
							siblingBlockCount={ siblingBlockCount }
							level={ level }
							ref={ ref }
							tabIndex={ tabIndex }
							onFocus={ onFocus }
						/>
					</div>
				) }
			</TreeGridCell>
			{ hasRenderedMovers && (
				<>
					<TreeGridCell
						className={ moverCellClassName }
						withoutGridItem
					>
						<TreeGridItem>
							{ ( { ref, tabIndex, onFocus } ) => (
								<BlockMoverUpButton
									orientation="vertical"
									clientIds={ [ clientId ] }
									ref={ ref }
									tabIndex={ tabIndex }
									onFocus={ onFocus }
								/>
							) }
						</TreeGridItem>
						<TreeGridItem>
							{ ( { ref, tabIndex, onFocus } ) => (
								<BlockMoverDownButton
									orientation="vertical"
									clientIds={ [ clientId ] }
									ref={ ref }
									tabIndex={ tabIndex }
									onFocus={ onFocus }
								/>
							) }
						</TreeGridItem>
					</TreeGridCell>
				</>
			) }

			{ withExperimentalFeatures && (
				<TreeGridCell className={ listViewBlockSettingsClassName }>
					{ ( { ref, tabIndex, onFocus } ) => (
						<BlockSettingsDropdown
							clientIds={ [ clientId ] }
							icon={ moreVertical }
							toggleProps={ {
								ref,
								tabIndex,
								onFocus,
							} }
							disableOpenOnArrowDown
							__experimentalSelectBlock={ onClick }
						>
							{ ( { onClose } ) => (
								<MenuGroup>
									<MenuItem
										onClick={ async () => {
											if ( blockParents.length ) {
												// If the block to select is inside a dropdown, we need to open the dropdown.
												// Otherwise focus won't transfer to the block.
												for ( const parent of blockParents ) {
													await selectEditorBlock(
														parent
													);
												}
											} else {
												// If clientId is already selected, it won't be focused (see block-wrapper.js)
												// This removes the selection first to ensure the focus will always switch.
												await selectEditorBlock( null );
											}
											await selectEditorBlock( clientId );
											onClose();
										} }
									>
										{ __( 'Go to block' ) }
									</MenuItem>
								</MenuGroup>
							) }
						</BlockSettingsDropdown>
					) }
				</TreeGridCell>
			) }
		</TreeGridRow>
	);
}
