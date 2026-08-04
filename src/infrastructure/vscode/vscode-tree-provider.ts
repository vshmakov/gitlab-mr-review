import * as vscode from 'vscode';
import { MergeRequestsStore } from '../../domain/store/MergeRequestsStore';
import { toVsCodeTreeItem } from '../vscode/vscode-tree-adapter';
import { MergeRequestCategoryItem } from '../../domain/tree/MergeRequestCategoryItem';
import { ITreeItem, CATEGORIES } from '../../domain/tree/tree-item';

export class MergeRequestsTreeProvider
	implements vscode.TreeDataProvider<ITreeItem>
{
	private readonly changeEmitter =
		new vscode.EventEmitter<
			ITreeItem | undefined | void
		>();

	public readonly onDidChangeTreeData =
		this.changeEmitter.event;

	private readonly categoryItems = new Map<
		string,
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

		this.store.onDidChange((change) => {
			switch (change.type) {
				case 'category':
					this.changeEmitter.fire(
						this.categoryItems.get(change.category!),
					);
					break;
				case 'mergeRequest':
					// Fire root to rebuild MR subtree
					this.changeEmitter.fire();
					break;
				case 'refresh':
					this.changeEmitter.fire();
					break;
			}
		});
	}

	public refresh(): void {
		this.store.refresh();
	}

	public refreshFile(fileItem: ITreeItem): void {
		this.changeEmitter.fire(fileItem);
	}

	public getTreeItem(
		element: ITreeItem,
	): vscode.TreeItem {
		return toVsCodeTreeItem(element);
	}

	public getChildren(
		element?: ITreeItem,
	): ITreeItem[] {
		if (!element) {
			return CATEGORIES.map((key) =>
				this.categoryItems.get(key)!,
			);
		}

		return element.getChildren?.() ?? [];
	}
}