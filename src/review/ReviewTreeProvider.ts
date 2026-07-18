import * as vscode from 'vscode';
import { ReviewItem } from './ReviewItem';
import {
	GitLabClient,
	GitLabMergeRequest,
} from '../client/GitLabClient';

export const TOKEN_SECRET_KEY =
	'gitlabMrReview.privateToken';

export class ReviewTreeProvider
	implements vscode.TreeDataProvider<ReviewItem>
{
	private readonly changeEmitter =
		new vscode.EventEmitter<
			ReviewItem | undefined | void
		>();

	public readonly onDidChangeTreeData =
		this.changeEmitter.event;

	private mergeRequests: GitLabMergeRequest[] = [];
	private loading = false;

	public constructor(
		private readonly context: vscode.ExtensionContext,
	) {}

	public refresh(): void {
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
		if (element) {
			return [];
		}

		if (!this.loading) {
			await this.loadMergeRequests();
		}

		return this.mergeRequests.map(
			mergeRequest =>
				new ReviewItem(mergeRequest),
		);
	}

	private async loadMergeRequests(): Promise<void> {
		this.loading = true;

		try {
			const configuration =
				vscode.workspace.getConfiguration(
					'gitlabMrReview',
				);

			const baseUrl = configuration
				.get<string>('url', '')
				.trim()
				.replace(/\/+$/, '');

			if (!baseUrl) {
				this.mergeRequests = [];

				const action =
					await vscode.window.showWarningMessage(
						'GitLab не настроен.',
						'Authenticate',
					);

				if (action === 'Authenticate') {
					await vscode.commands.executeCommand(
						'gitlabMrReview.authenticate',
					);
				}

				return;
			}

			const token =
				await this.context.secrets.get(
					TOKEN_SECRET_KEY,
				);

			if (!token) {
				this.mergeRequests = [];

				const action =
					await vscode.window.showWarningMessage(
						'Для загрузки merge requests ' +
							'требуется аутентификация GitLab.',
						'Authenticate',
					);

				if (action === 'Authenticate') {
					await vscode.commands.executeCommand(
						'gitlabMrReview.authenticate',
					);
				}

				return;
			}

			const client =
				new GitLabClient(baseUrl, token);

			const user =
				await client.getCurrentUser();

			this.mergeRequests =
				await client.getPendingReviews(user);

			void vscode.window.setStatusBarMessage(
				`GitLab MR Review: найдено ` +
					`${this.mergeRequests.length} MR`,
				5000,
			);
		} catch (error: unknown) {
			this.mergeRequests = [];

			const message =
				error instanceof Error
					? error.message
					: String(error);

			console.error(
				'Failed to load GitLab merge requests',
				error,
			);

			void vscode.window.showErrorMessage(
				`Не удалось загрузить GitLab MR: ` +
					message,
			);
		} finally {
			this.loading = false;
		}
	}
}
