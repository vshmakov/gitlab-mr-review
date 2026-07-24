import * as vscode from 'vscode';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { MergeRequestsStore } from '../store/MergeRequestsStore';
import { MergeRequestCategory, MergeRequestItem } from './MergeRequestItem';

const CATEGORIES: MergeRequestCategory[] = [
	'needsReview',
	'requestedChanges',
	'approved',
];

const CATEGORY_LOADER: Record<
	MergeRequestCategory,
	(store: MergeRequestsStore) => Promise<void>
> = {
	needsReview: (s) => s.loadPending(),
	requestedChanges: (s) => s.loadRequestedChanges(),
	approved: (s) => s.loadApproved(),
};

const CATEGORY_DATA: Record<
	MergeRequestCategory,
	(store: MergeRequestsStore) => GitLabMergeRequest[]
> = {
	needsReview: (s) => s.pendingMergeRequests,
	requestedChanges: (s) =>
		s.requestedChangesMergeRequests,
	approved: (s) => s.approvedMergeRequests,
};

export class MergeRequestsTreeProvider
	implements vscode.TreeDataProvider<MergeRequestItem>
{
	private readonly changeEmitter =
		new vscode.EventEmitter<
			MergeRequestItem | undefined | void
		>();

	public readonly onDidChangeTreeData =
		this.changeEmitter.event;

	public constructor(
		private readonly store:
			MergeRequestsStore,
	) {
		this.store.onDidChange(() => {
			this.changeEmitter.fire();
		});
	}

	public refresh(): void {
		this.store.refresh();
	}

	public getTreeItem(
		element: MergeRequestItem,
	): vscode.TreeItem {
		return element;
	}

	public async getChildren(
		element?: MergeRequestItem,
	): Promise<MergeRequestItem[]> {
		if (!element) {
			return CATEGORIES.map((key) =>
				MergeRequestItem.createCategory(key),
			);
		}

		if (element.type === 'category') {
			return await this.getCategoryItems(
				element.category!,
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
		category: MergeRequestCategory,
	): Promise<MergeRequestItem[]> {
		await CATEGORY_LOADER[category](this.store);

		const mr =
			CATEGORY_DATA[category](this.store);

		return mr.map((m) =>
			MergeRequestItem.createMergeRequest(m),
		);
	}

	private async getFilesForMR(
		mergeRequest: GitLabMergeRequest,
	): Promise<MergeRequestItem[]> {
		const files =
			this.store.files.getFiles(mergeRequest);

		if (files) {
			return files.map((file) =>
				MergeRequestItem.createFile(
					mergeRequest,
					file,
				),
			);
		}

		await this.store.loadFiles(mergeRequest);

		const updatedFiles =
			this.store.files.getFiles(mergeRequest);

		if (!updatedFiles) {
			return [];
		}

		return updatedFiles.map((file) =>
			MergeRequestItem.createFile(
				mergeRequest,
				file,
			),
		);
	}
}