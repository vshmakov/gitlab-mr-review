import * as vscode from 'vscode';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { ReviewStore } from '../store/ReviewStore';
import { CategoryKey, ReviewItem } from './ReviewItem';

const CATEGORIES: CategoryKey[] = [
	'needsReview',
	'requestedChanges',
	'approved',
];

const CATEGORY_LOADER: Record<
	CategoryKey,
	(store: ReviewStore) => Promise<void>
> = {
	needsReview: (s) => s.loadPending(),
	requestedChanges: (s) => s.loadRequestedChanges(),
	approved: (s) => s.loadApproved(),
};

const CATEGORY_DATA: Record<
	CategoryKey,
	(store: ReviewStore) => GitLabMergeRequest[]
> = {
	needsReview: (s) => s.pendingMRs,
	requestedChanges: (s) => s.requestedChangesMRs,
	approved: (s) => s.approvedMRs,
};

export class ReviewTreeProvider
	implements vscode.TreeDataProvider<ReviewItem>
{
	private readonly changeEmitter =
		new vscode.EventEmitter<
			ReviewItem | undefined | void
		>();

	public readonly onDidChangeTreeData =
		this.changeEmitter.event;

	public constructor(
		private readonly store: ReviewStore,
	) {
		this.store.onDidChange(() => {
			this.changeEmitter.fire();
		});
	}

	public refresh(): void {
		this.store.refresh();
	}

	public getTreeItem(
		element: ReviewItem,
	): vscode.TreeItem {
		return element;
	}

	public async getChildren(
		element?: ReviewItem,
	): Promise<ReviewItem[]> {
		if (!element) {
			return CATEGORIES.map(key =>
				ReviewItem.createCategory(key),
			);
		}

		if (element.type === 'category') {
			return await this.getCategoryItems(
				element.categoryKey!,
			);
		}

		if (
			element.type === 'mergeRequest' &&
			element.mergeRequest
		) {
			return this.getFilesForMR(
				element.mergeRequest,
			);
		}

		return [];
	}

	private async getCategoryItems(
		categoryKey: CategoryKey,
	): Promise<ReviewItem[]> {
		await CATEGORY_LOADER[categoryKey](this.store);

		const mr = CATEGORY_DATA[categoryKey](this.store);

		return mr.map(m =>
			ReviewItem.createMergeRequest(m),
		);
	}

	private async getFilesForMR(
		mergeRequest: GitLabMergeRequest,
	): Promise<ReviewItem[]> {
		const files = this.store.getFiles(mergeRequest);

		if (files) {
			return files.map(file =>
				ReviewItem.createFile(
					mergeRequest,
					file,
				),
			);
		}

		await this.store.loadFiles(mergeRequest);

		const updatedFiles =
			this.store.getFiles(mergeRequest);

		if (!updatedFiles) {
			return [];
		}

		return updatedFiles.map(file =>
			ReviewItem.createFile(
				mergeRequest,
				file,
			),
		);
	}
}