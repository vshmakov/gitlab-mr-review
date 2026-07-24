import * as vscode from 'vscode';
import { MergeRequestsStore } from '../store/MergeRequestsStore';
import { MergeRequestCategory } from './MergeRequestItem';
import { MergeRequestCategoryItem } from './MergeRequestCategoryItem';
import { MergeRequestFileItem } from './MergeRequestFileItem';
import { MergeRequestItem } from './MergeRequestItem';
import { MergeRequestMessageItem } from './MergeRequestMessageItem';

export type MergeRequestTreeItem =
	| MergeRequestCategoryItem
	| MergeRequestItem
	| MergeRequestFileItem
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

		return element.getChildren();
	}
}