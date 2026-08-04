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
import { MergeRequestOverviewItem } from '../../domain/tree/MergeRequestOverviewItem';
import { MergeRequestReviewedItem } from '../../domain/tree/MergeRequestReviewedItem';

export type MergeRequestTreeItem =
	| MergeRequestCategoryItem
	| MergeRequestItem
	| MergeRequestOverviewItem
	| MergeRequestApprovedItem
	| MergeRequestRequestedChangesItem
	| MergeRequestChangesItem
	| MergeRequestReviewedItem
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

	// Stable category instances — preserves expanded state on fire
	private readonly categoryItems = new Map<
		MergeRequestCategory,
		MergeRequestCategoryItem
	>();

	public constructor(
		private readonly store: MergeRequestsStore,
	) {
		for (const cat of CATEGORIES) {
			this.categoryItems.set(
				cat,
				new MergeRequestCategoryItem(cat, this.store),
			);
		}

		this.store.onDidChange(() => {
			this.fireChanged();
		});
	}

	public refresh(): void {
		this.store.refresh();
	}

	public refreshFile(fileItem: MergeRequestFileItem): void {
		this.changeEmitter.fire(fileItem);
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
				this.categoryItems.get(key)!,
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

		if (element instanceof MergeRequestReviewedItem) {
			return element.getChildren();
		}

		return [];
	}

	private fireChanged(): void {
		// Fire loading categories (stable instances)
		for (const cat of CATEGORIES) {
			if (this.store.isCategoryLoading(cat)) {
				this.changeEmitter.fire(this.categoryItems.get(cat)!);
				return;
			}
		}

		// Fire loading MRs by searching loaded categories
		for (const cat of CATEGORIES) {
			const mrs = this.store.getCategoryMRs(cat);
			for (const mr of mrs) {
				if (
					this.store.isApprovalLoading(mr) ||
					this.store.isFilesLoading(mr)
				) {
					this.changeEmitter.fire(
						new MergeRequestItem(mr, this.store),
					);
					return;
				}
			}
		}

		// Fallback: fire root (refresh, etc.)
		this.changeEmitter.fire();
	}
}