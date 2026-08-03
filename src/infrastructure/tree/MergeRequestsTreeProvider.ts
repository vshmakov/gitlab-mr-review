import * as vscode from 'vscode';
import { MergeRequestsStore } from '../../domain/store/MergeRequestsStore';
import { toVsCodeTreeItem } from '../vscode/vscode-tree-adapter';
import { MergeRequestCategory, MergeRequestItem } from '../../domain/tree/MergeRequestItem';
import { MergeRequestApprovedItem, MergeRequestRequestedChangesItem } from '../../domain/tree/ReviewerListTreeItem';
import { MergeRequestCategoryItem } from '../../domain/tree/MergeRequestCategoryItem';
import { MergeRequestChangesItem } from '../../domain/tree/MergeRequestChangesItem';
import { MergeRequestFileItem } from '../../domain/tree/MergeRequestFileItem';
import { MergeRequestMessageItem } from '../../domain/tree/MergeRequestMessageItem';
import { MergeRequestReviewerItem } from '../../domain/tree/MergeRequestReviewerItem';

export type MergeRequestTreeItem =
	| MergeRequestCategoryItem
	| MergeRequestItem
	| MergeRequestApprovedItem
	| MergeRequestRequestedChangesItem
	| MergeRequestChangesItem
	| MergeRequestFileItem
	| MergeRequestReviewerItem
	| MergeRequestMessageItem;

const CATEGORIES: MergeRequestCategory[] = [
	'my',
	'needsReview',
	'requestedChanges',
	'approved',
	'missed',
];

export class MergeRequestsTreeProvider
	implements vscode.TreeDataProvider<MergeRequestTreeItem>
{
	private readonly changeEmitter =
		new vscode.EventEmitter<
			MergeRequestTreeItem | undefined | void
		>();

	public readonly onDidChangeTreeData =
		this.changeEmitter.event;

	public constructor(
		private readonly store: MergeRequestsStore,
	) {
		this.store.onDidChange(() => {
			this.changeEmitter.fire();
		});
	}

	public refresh(): void {
		this.store.refresh();
	}

	public getTreeItem(
		element: MergeRequestTreeItem,
	): vscode.TreeItem {
		return toVsCodeTreeItem(element);
	}

	public getChildren(
		element?: MergeRequestTreeItem,
	): MergeRequestTreeItem[] {
		if (!element) {
			return CATEGORIES.map((key) =>
				new MergeRequestCategoryItem(
					key,
					this.store,
				),
			);
		}

		if (element instanceof MergeRequestCategoryItem) {
			return element.getChildren();
		}

		if (element instanceof MergeRequestItem) {
			return element.getChildren();
		}

		if (element instanceof MergeRequestApprovedItem) {
			return element.getChildren();
		}

		if (element instanceof MergeRequestRequestedChangesItem) {
			return element.getChildren();
		}

		if (element instanceof MergeRequestChangesItem) {
			return element.getChildren();
		}

		return [];
	}
}