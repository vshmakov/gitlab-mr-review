import * as vscode from 'vscode';
import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { ReviewDataSource } from './ReviewDataSource';
import { CategoryKey, ReviewItem } from './ReviewItem';

const CATEGORIES: CategoryKey[] = [
	'needsReview',
	'approved',
];

export class ReviewTreeProvider
	implements vscode.TreeDataProvider<ReviewItem>
{
	private readonly changeEmitter =
		new vscode.EventEmitter<
			ReviewItem | undefined | void
		>();

	public readonly onDidChangeTreeData =
		this.changeEmitter.event;

	private readonly dataSource:
		ReviewDataSource;

	public constructor(
		clientFactory: GitLabClientFactory,
	) {
		this.dataSource = new ReviewDataSource(
			clientFactory,
		);
	}

	public refresh(): void {
		this.dataSource.refresh();
		this.changeEmitter.fire();
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
			return this.getMergeRequestItems(
				element.categoryKey!,
			);
		}

		if (
			element.type === 'mergeRequest' &&
			element.mergeRequest
		) {
			return this.getFileItems(
				element.mergeRequest,
			);
		}

		return [];
	}

	private async getMergeRequestItems(
		categoryKey: CategoryKey,
	): Promise<ReviewItem[]> {
		try {
			let mergeRequests: GitLabMergeRequest[];

			if (categoryKey === 'needsReview') {
				mergeRequests =
					await this.dataSource
						.getMergeRequests();
			} else {
				mergeRequests =
					await this.dataSource
						.getApprovedMergeRequests();
			}

			return mergeRequests.map(
				mergeRequest =>
					ReviewItem
						.createMergeRequest(
							mergeRequest,
						),
			);
		} catch (error: unknown) {
			this.showLoadError(
				'Не удалось загрузить GitLab MR',
				error,
			);

			return [];
		}
	}

	private async getFileItems(
		mergeRequest: GitLabMergeRequest,
	): Promise<ReviewItem[]> {
		try {
			const files =
				await this.dataSource
					.getMergeRequestFiles(
						mergeRequest,
					);

			return files.map(
				file =>
					ReviewItem.
				createFile(mergeRequest, file),
			);
		} catch (error: unknown) {
			this.showLoadError(
				`Не удалось загрузить файлы MR ` +
					`!${mergeRequest.iid}`,
				error,
			);

			return [];
		}
	}

	private showLoadError(
		prefix: string,
		error: unknown,
	): void {
		const message =
			error instanceof Error
				? error.message
				: String(error);

		console.error(prefix, error);

		void vscode.window.showErrorMessage(
			`${prefix}: ${message}`,
		);
	}
}