import * as vscode from 'vscode';
import { ReviewItem } from './ReviewItem';
import {
	GitLabClient,
	GitLabMergeRequest,
	GitLabMergeRequestFile,
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

	private readonly filesCache = new Map<
		string,
		GitLabMergeRequestFile[]
	>();

	private readonly filesLoading = new Map<
		string,
		Promise<GitLabMergeRequestFile[]>
	>();

	private client?: GitLabClient;

	private loading = false;

	public constructor(
		private readonly context:
			vscode.ExtensionContext,
	) {}

	public refresh(): void {
		this.mergeRequests = [];
		this.filesCache.clear();
		this.filesLoading.clear();

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
		if (!this.loading) {
			await this.loadMergeRequests();
		}

		return this.mergeRequests.map(
			mergeRequest =>
				ReviewItem.createMergeRequest(
					mergeRequest,
				),
		);
	}

	private async getFileItems(
		mergeRequest: GitLabMergeRequest,
	): Promise<ReviewItem[]> {
		try {
			const files =
				await this.loadMergeRequestFiles(
					mergeRequest,
				);

			return files.map(
				file => ReviewItem.createFile(file),
			);
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: String(error);

			console.error(
				'Failed to load merge request files',
				error,
			);

			void vscode.window.showErrorMessage(
				`Не удалось загрузить файлы MR ` +
					`!${mergeRequest.iid}: ${message}`,
			);

			return [];
		}
	}

	private async loadMergeRequestFiles(
		mergeRequest: GitLabMergeRequest,
	): Promise<GitLabMergeRequestFile[]> {
		const cacheKey =
			this.getMergeRequestCacheKey(
				mergeRequest,
			);

		const cachedFiles =
			this.filesCache.get(cacheKey);

		if (cachedFiles) {
			return cachedFiles;
		}

		const existingRequest =
			this.filesLoading.get(cacheKey);

		if (existingRequest) {
			return existingRequest;
		}

		if (!this.client) {
			throw new Error(
				'GitLab client is not initialized',
			);
		}

		const request = this.client
			.getMergeRequestFiles(mergeRequest)
			.then(files => {
				this.filesCache.set(
					cacheKey,
					files,
				);

				return files;
			})
			.finally(() => {
				this.filesLoading.delete(cacheKey);
			});

		this.filesLoading.set(cacheKey, request);

		return request;
	}

	private async loadMergeRequests(): Promise<void> {
		this.loading = true;

		try {
			const client = await this.createClient();

			if (!client) {
				this.mergeRequests = [];
				this.client = undefined;

				return;
			}

			this.client = client;

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
			this.client = undefined;

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

	private async createClient():
		Promise<GitLabClient | undefined> {
		const configuration =
			vscode.workspace.getConfiguration(
				'gitlabMrReview',
			);

		const baseUrl = configuration
			.get<string>('url', '')
			.trim()
			.replace(/\/+$/, '');

		if (!baseUrl) {
			await this.requestAuthentication(
				'GitLab не настроен.',
			);

			return undefined;
		}

		const token =
			await this.context.secrets.get(
				TOKEN_SECRET_KEY,
			);

		if (!token) {
			await this.requestAuthentication(
				'Для загрузки merge requests ' +
					'требуется аутентификация GitLab.',
			);

			return undefined;
		}

		return new GitLabClient(
			baseUrl,
			token,
		);
	}

	private async requestAuthentication(
		message: string,
	): Promise<void> {
		const action =
			await vscode.window.showWarningMessage(
				message,
				'Authenticate',
			);

		if (action === 'Authenticate') {
			await vscode.commands.executeCommand(
				'gitlabMrReview.authenticate',
			);
		}
	}

	private getMergeRequestCacheKey(
		mergeRequest: GitLabMergeRequest,
	): string {
		return (
			`${mergeRequest.project_id}:` +
			`${mergeRequest.iid}`
		);
	}
}