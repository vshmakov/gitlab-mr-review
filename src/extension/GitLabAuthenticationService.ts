import * as vscode from 'vscode';

import { TOKEN_SECRET_KEY } from './constants';
import { ReviewTreeProvider } from '../tree/ReviewTreeProvider';
import { GitLabClientFactory } from '../tree/GitLabClientFactory';

export class GitLabAuthenticationService {
	private static readonly CONFIGURATION_SECTION =
		'gitlabMrReview';

	private static readonly URL_CONFIGURATION_KEY = 'url';

	public constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly treeProvider: ReviewTreeProvider,
		private readonly clientFactory: GitLabClientFactory,
	) {}

	public async authenticate(): Promise<void> {
		const credentials = await this.requestCredentials();

		if (!credentials) {
			return;
		}

		await vscode.window.withProgress(
			{
				location:
					vscode.ProgressLocation.Notification,
				title:
					'GitLab: выполняется аутентификация...',
				cancellable: false,
			},
			async () =>
				this.performAuthentication(
					credentials.baseUrl,
					credentials.token,
				),
		);
	}

	public async logout(): Promise<void> {
		await this.context.secrets.delete(TOKEN_SECRET_KEY);
		this.clientFactory.clear();
		this.treeProvider.refresh();

		void vscode.window.showInformationMessage(
			'Выход из GitLab выполнен.',
		);
	}

	private async requestCredentials(): Promise<
		GitLabCredentials | undefined
	> {
		const configuration = this.getConfiguration();

		const enteredUrl = await vscode.window.showInputBox({
			title: 'GitLab Authentication',
			prompt: 'Введите URL GitLab',
			placeHolder: 'https://gitlab.example.com',
			value: configuration.get<string>(
				GitLabAuthenticationService
					.URL_CONFIGURATION_KEY,
				'',
			),
			ignoreFocusOut: true,
		});

		const baseUrl = this.normalizeUrl(enteredUrl);

		if (!baseUrl) {
			return undefined;
		}

		const enteredToken =
			await vscode.window.showInputBox({
				title: 'GitLab Authentication',
				prompt: 'Введите Personal Access Token',
				password: true,
				ignoreFocusOut: true,
			});

		const token = enteredToken?.trim();

		if (!token) {
			return undefined;
		}

		return {
			baseUrl,
			token,
		};
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
			this.showAuthenticationError(
				'Неверный URL или токен.',
			);
			return;
		}

		await this.saveCredentials(baseUrl, token);

		const user = await this.clientFactory.create();
		if (user) {
			const current = await user.getCurrentUser();
			void vscode.window.showInformationMessage(
				`GitLab: выполнен вход как ` +
					`${current.name} (@${current.username}).`,
			);
		}

		this.treeProvider.refresh();
	}

	private async saveCredentials(
		baseUrl: string,
		token: string,
	): Promise<void> {
		await this.getConfiguration().update(
			GitLabAuthenticationService
				.URL_CONFIGURATION_KEY,
			baseUrl,
			vscode.ConfigurationTarget.Global,
		);

		await this.context.secrets.store(
			TOKEN_SECRET_KEY,
			token,
		);
	}

	private getConfiguration(): vscode.WorkspaceConfiguration {
		return vscode.workspace.getConfiguration(
			GitLabAuthenticationService
				.CONFIGURATION_SECTION,
		);
	}

	private normalizeUrl(
		value: string | undefined,
	): string | undefined {
		const trimmedValue = value?.trim();

		if (!trimmedValue) {
			return undefined;
		}

		return trimmedValue.replace(/\/+$/, '');
	}

	private showAuthenticationError(message: string): void {
		void vscode.window.showErrorMessage(
			`Ошибка аутентификации GitLab: ${message}`,
		);
	}
}

interface GitLabCredentials {
	baseUrl: string;
	token: string;
}