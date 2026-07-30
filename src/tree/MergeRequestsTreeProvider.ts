import * as vscode from 'vscode';
import { MergeRequestsStore } from '../store/MergeRequestsStore';
import { MergeRequestCategory } from './MergeRequestItem';
import { MergeRequestApprovedItem } from './MergeRequestApprovedItem';
import { MergeRequestCategoryItem } from './MergeRequestCategoryItem';
import { MergeRequestChangesItem } from './MergeRequestChangesItem';
import { MergeRequestFileItem } from './MergeRequestFileItem';
import { MergeRequestItem } from './MergeRequestItem';
import { MergeRequestMessageItem } from './MergeRequestMessageItem';
import { MergeRequestReviewerItem } from './MergeRequestReviewerItem';
import { MergeRequestRequestedChangesItem } from './MergeRequestRequestedChangesItem';

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
		return element;
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