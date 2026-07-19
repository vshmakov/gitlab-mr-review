import * as vscode from 'vscode';
import { GitLabClient } from '../client/GitLabClient';
import { TOKEN_SECRET_KEY } from '../extension/constants';

export class GitLabClientFactory {
	public constructor(
		private readonly context:
			vscode.ExtensionContext,
	) {}

	public async create():
		Promise<GitLabClient | undefined> {
		const baseUrl = this.getBaseUrl();

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

	private getBaseUrl(): string {
		return vscode.workspace
			.getConfiguration('gitlabMrReview')
			.get<string>('url', '')
			.trim()
			.replace(/\/+$/, '');
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