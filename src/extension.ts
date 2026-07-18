import * as vscode from 'vscode';
import { GitLabClient, GitLabMergeRequest } from './GitLabClient';
import { ReviewTreeProvider, TOKEN_SECRET_KEY } from './ReviewTreeProvider';

export function activate(
	context: vscode.ExtensionContext,
): void {
	const treeProvider = new ReviewTreeProvider(context);

	const treeView = vscode.window.createTreeView(
		'gitlabMrReview.pendingReviews',
		{
			treeDataProvider: treeProvider,
			showCollapseAll: false,
		},
	);

	const refreshCommand =
		vscode.commands.registerCommand(
			'gitlabMrReview.refresh',
			() => {
				treeProvider.refresh();
			},
		);

	const authenticateCommand =
		vscode.commands.registerCommand(
			'gitlabMrReview.authenticate',
			async () => {
				const configuration =
					vscode.workspace.getConfiguration(
						'gitlabMrReview',
					);

				const currentUrl =
					configuration.get<string>('url', '');

				const enteredUrl =
					await vscode.window.showInputBox({
						title: 'GitLab Authentication',
						prompt:
							'Введите URL GitLab',
						placeHolder:
							'https://gitlab.example.com',
						value: currentUrl,
						ignoreFocusOut: true,
					});

				if (!enteredUrl?.trim()) {
					return;
				}

				const baseUrl = enteredUrl
					.trim()
					.replace(/\/+$/, '');

				const token =
					await vscode.window.showInputBox({
						title: 'GitLab Authentication',
						prompt:
							'Введите Personal Access Token',
						password: true,
						ignoreFocusOut: true,
					});

				if (!token?.trim()) {
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
					async () => {
						try {
							const client = new GitLabClient(
								baseUrl,
								token.trim(),
							);

							const user =
								await client.getCurrentUser();

							await configuration.update(
								'url',
								baseUrl,
								vscode.ConfigurationTarget.Global,
							);

							await context.secrets.store(
								TOKEN_SECRET_KEY,
								token.trim(),
							);

							void vscode.window
								.showInformationMessage(
									`GitLab: выполнен вход как ` +
										`${user.name} ` +
										`(@${user.username}).`,
								);

							treeProvider.refresh();
						} catch (error: unknown) {
							const message =
								error instanceof Error
									? error.message
									: String(error);

							void vscode.window
								.showErrorMessage(
									`Ошибка аутентификации GitLab: ` +
										message,
								);
						}
					},
				);
			},
		);

	const logoutCommand =
		vscode.commands.registerCommand(
			'gitlabMrReview.logout',
			async () => {
				await context.secrets.delete(
					TOKEN_SECRET_KEY,
				);

				void vscode.window.showInformationMessage(
					'Выход из GitLab выполнен.',
				);

				treeProvider.refresh();
			},
		);

	const openMergeRequestCommand =
		vscode.commands.registerCommand(
			'gitlabMrReview.openMergeRequest',
			async (
				mergeRequest: GitLabMergeRequest,
			) => {
				await vscode.env.openExternal(
					vscode.Uri.parse(
						mergeRequest.web_url,
					),
				);
			},
		);

	context.subscriptions.push(
		treeView,
		refreshCommand,
		authenticateCommand,
		logoutCommand,
		openMergeRequestCommand,
	);
}

export function deactivate(): void {}