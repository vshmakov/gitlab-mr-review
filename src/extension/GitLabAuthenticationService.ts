import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { MergeRequestsTreeProvider } from '../tree/MergeRequestsTreeProvider';
import { TOKEN_SECRET_KEY } from '../infra/constants';
import { normalizeBaseUrl } from '../infra/url-utils';
import { SecretStorage } from '../infra/secret-storage';
import { Configuration } from '../infra/configuration';
import { Notifier } from '../infra/notifier';
import { Input } from '../infra/input';
import { Progress } from '../infra/progress';

export class GitLabAuthenticationService {
	private static readonly CONFIGURATION_SECTION =
		'gitlabMrReview';

	private static readonly URL_CONFIGURATION_KEY = 'url';

	public constructor(
		private readonly secrets: SecretStorage,
		private readonly config: Configuration,
		private readonly notifier: Notifier,
		private readonly input: Input,
		private readonly progress: Progress,
		private readonly treeProvider: MergeRequestsTreeProvider,
		private readonly clientFactory: GitLabClientFactory,
	) {}

	public async authenticate(): Promise<void> {
		const credentials = await this.requestCredentials();

		if (!credentials) {
			return;
		}

		await this.progress.withProgress(
			async () =>
				this.performAuthentication(
					credentials.baseUrl,
					credentials.token,
				),
		);
	}

	public async logout(): Promise<void> {
		await this.secrets.delete(TOKEN_SECRET_KEY);
		this.clientFactory.clear();
		this.treeProvider.refresh();

		this.notifier.showInfo('Выход из GitLab выполнен.');
	}

	private async requestCredentials(): Promise<
		GitLabCredentials | undefined
	> {
		const enteredUrl = await this.input.showInputBox({
			title: 'GitLab Authentication',
			prompt: 'Введите URL GitLab',
			placeHolder: 'https://gitlab.example.com',
			value: this.config.get<string>(
				GitLabAuthenticationService.CONFIGURATION_SECTION,
				GitLabAuthenticationService.URL_CONFIGURATION_KEY,
				'',
			),
			ignoreFocusOut: true,
		});

		const baseUrl = this.normalizeUrl(enteredUrl);

		if (!baseUrl) {
			return undefined;
		}

		const enteredToken = await this.input.showInputBox({
			title: 'GitLab Authentication',
			prompt: 'Введите Personal Access Token',
			password: true,
			ignoreFocusOut: true,
		});

		const token = enteredToken?.trim();

		if (!token) {
			return undefined;
		}

		return { baseUrl, token };
	}

	private async performAuthentication(
		baseUrl: string,
		token: string,
	): Promise<void> {
		const success = await this.clientFactory.setCredentials(
			baseUrl,
			token,
		);

		if (!success) {
			this.showAuthenticationError('Неверный URL или токен.');
			return;
		}

		await this.saveCredentials(baseUrl, token);

		const client = await this.clientFactory.create();
		if (client) {
			const user = await client.getCurrentUser();
			this.notifier.showInfo(
				`GitLab: выполнен вход как ` +
					`${user.name} (@${user.username}).`,
			);
		}

		this.treeProvider.refresh();
	}

	private async saveCredentials(
		baseUrl: string,
		token: string,
	): Promise<void> {
		await this.config.update(
			GitLabAuthenticationService.CONFIGURATION_SECTION,
			GitLabAuthenticationService.URL_CONFIGURATION_KEY,
			baseUrl,
		);

		await this.secrets.store(TOKEN_SECRET_KEY, token);
	}

	private normalizeUrl(
		value: string | undefined,
	): string | undefined {
		const trimmedValue = value?.trim();
		if (!trimmedValue) {
			return undefined;
		}
		return normalizeBaseUrl(trimmedValue);
	}

	private showAuthenticationError(message: string): void {
		this.notifier.showError(
			`Ошибка аутентификации GitLab: ${message}`,
		);
	}
}

interface GitLabCredentials {
	baseUrl: string;
	token: string;
}