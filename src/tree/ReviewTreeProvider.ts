import * as vscode from 'vscode';
import {
	GitLabMergeRequest,
} from '../client/GitLabClient';
import { GitLabClientFactory } from './GitLabClientFactory';
import { ReviewDataSource } from './ReviewDataSource';
import { ReviewItem } from '../review/ReviewItem';

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
			return this.getMergeRequestItems();
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

	private async getMergeRequestItems():
		Promise<ReviewItem[]> {
		try {
			const mergeRequests =
				await this.dataSource
					.getMergeRequests();

			void vscode.window.setStatusBarMessage(
				`GitLab MR Review: найдено ` +
					`${mergeRequests.length} MR`,
				5000,
			);

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