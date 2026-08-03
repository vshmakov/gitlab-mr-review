import { GitLabClient } from './GitLabClient';
import { GitLabRestClient } from './GitLabRestClient';
import { GitLabNoteClient } from './GitLabNoteClient';
import { GitLabGraphQLClient } from './GitLabGraphQLClient';
import { PendingReviewService } from '../service/PendingReviewService';
import { TOKEN_SECRET_KEY } from './constants';
import { normalizeBaseUrl } from './url-utils';
import { SecretStorage } from '../interfaces/secret-storage';
import { Configuration } from '../interfaces/configuration';
import { Notifier } from '../interfaces/notifier';
import { Input } from '../interfaces/input';
import { CommandRegistry } from '../interfaces/command-registry';

export class GitLabClientFactory {
	private client?: GitLabClient;

	public constructor(
		private readonly secrets: SecretStorage,
		private readonly config: Configuration,
		private readonly notifier: Notifier,
		private readonly input: Input,
		private readonly commands: CommandRegistry,
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
			this.notifier.showError(
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
			this.notifier.showError(
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

		const token = await this.secrets.get(TOKEN_SECRET_KEY);
		if (!token) {
			return undefined;
		}

		return { baseUrl, token };
	}

	private getBaseUrl(): string {
		return normalizeBaseUrl(
			this.config.get<string>('gitlabMrReview', 'url', ''),
		);
	}

	private async requestAuthentication(
		message: string,
	): Promise<void> {
		const action = await this.input.showWarningMessage(
			message,
			'Authenticate',
		);

		if (action !== 'Authenticate') {
			return;
		}

		await this.commands.execute('gitlabMrReview.authenticate');
	}
}