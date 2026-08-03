import * as vscode from 'vscode';
import { GitLabClient } from './GitLabClient';
import { GitLabRestClient } from './GitLabRestClient';
import { GitLabNoteClient } from './GitLabNoteClient';
import { GitLabGraphQLClient } from './GitLabGraphQLClient';
import { PendingReviewService } from '../review/PendingReviewService';
import { TOKEN_SECRET_KEY } from '../infra/constants';
import { normalizeBaseUrl } from '../infra/url-utils';

export class GitLabClientFactory {
	private client?: GitLabClient;

	public constructor(
		private readonly context: vscode.ExtensionContext,
	) {}

	public async create(): Promise<GitLabClient | undefined> {
		if (this.client) {
			return this.client;
		}

		const credentials = await this.loadCredentials();
		if (!credentials) {
			await this.requestAuthentication(
				'Для загрузки merge requests ' +
					'требуется аутентификация GitLab.',
			);
			return undefined;
		}

		try {
			this.client = this.buildClient(
				credentials.baseUrl,
				credentials.token,
			);
			return this.client;
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: String(error);
			console.error('[ClientFactory] build failed:', message);
			void vscode.window.showErrorMessage(
				`Не удалось создать GitLab клиент: ${message}`,
			);
			this.client = undefined;
			return undefined;
		}
	}

	public async setCredentials(
		baseUrl: string,
		token: string,
	): Promise<boolean> {
		try {
			const client = this.buildClient(baseUrl, token);
			await client.getCurrentUser();
			this.client = client;
			return true;
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: String(error);
			console.error('[ClientFactory] setCredentials failed:', message);
			void vscode.window.showErrorMessage(
				`Ошибка подключения к GitLab: ${message}`,
			);
			this.client = undefined;
			return false;
		}
	}

	public clear(): void {
		this.client = undefined;
	}

	public async createNoteClient(): Promise<GitLabNoteClient | undefined> {
		const credentials = await this.loadCredentials();
		if (!credentials) {
			return undefined;
		}
		return new GitLabNoteClient(credentials.baseUrl, credentials.token);
	}

	private buildClient(
		baseUrl: string,
		token: string,
	): GitLabClient {
		const restClient = new GitLabRestClient(
			baseUrl,
			token,
		);

		const graphQLClient = new GitLabGraphQLClient(
			baseUrl,
			token,
		);

		const pendingReviewService =
			new PendingReviewService(graphQLClient);

		return new GitLabClient(
			restClient,
			graphQLClient,
			pendingReviewService,
		);
	}

	private async loadCredentials(): Promise<
		| { baseUrl: string; token: string }
		| undefined
	> {
		const baseUrl = this.getBaseUrl();
		if (!baseUrl) {
			return undefined;
		}

		const token =
			await this.context.secrets.get(TOKEN_SECRET_KEY);
		if (!token) {
			return undefined;
		}

		return { baseUrl, token };
	}

	private getBaseUrl(): string {
		return normalizeBaseUrl(
			vscode.workspace
				.getConfiguration('gitlabMrReview')
				.get<string>('url', ''),
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

		if (action !== 'Authenticate') {
			return;
		}

		await vscode.commands.executeCommand(
			'gitlabMrReview.authenticate',
		);
	}
}