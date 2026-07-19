import * as vscode from 'vscode';
import { GitLabClient } from '../client/GitLabClient';

import { TOKEN_SECRET_KEY } from './constants';
import { ReviewTreeProvider } from '../tree/ReviewTreeProvider';


export class GitLabAuthenticationService {
	private static readonly CONFIGURATION_SECTION =
		'gitlabMrReview';

	private static readonly URL_CONFIGURATION_KEY = 'url';

	public constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly treeProvider: ReviewTreeProvider,
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
			() =>
				this.performAuthentication(
					credentials.baseUrl,
					credentials.token,
				),
		);
	}

	public async logout(): Promise<void> {
		await this.context.secrets.delete(TOKEN_SECRET_KEY);

		void vscode.window.showInformationMessage(
			'Выход из GitLab выполнен.',
		);

		this.treeProvider.refresh();
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
		try {
			const client = new GitLabClient(baseUrl, token);
			const user = await client.getCurrentUser();

			await this.saveCredentials(baseUrl, token);

			void vscode.window.showInformationMessage(
				`GitLab: выполнен вход как ` +
					`${user.name} (@${user.username}).`,
			);

			this.treeProvider.refresh();
		} catch (error: unknown) {
			this.showAuthenticationError(error);
		}
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

	private showAuthenticationError(error: unknown): void {
		const message =
			error instanceof Error
				? error.message
				: String(error);

		void vscode.window.showErrorMessage(
			`Ошибка аутентификации GitLab: ${message}`,
		);
	}
}

interface GitLabCredentials {
	baseUrl: string;
	token: string;
}