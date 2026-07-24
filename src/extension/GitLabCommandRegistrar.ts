import * as vscode from 'vscode';

import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { MergeRequestsTreeProvider } from '../tree/MergeRequestsTreeProvider';
import { GitLabAuthenticationService } from './GitLabAuthenticationService';
import { GitLabCommentController } from './GitLabCommentController';
import {
	GitLabFileOpener,
	OpenFilePatchCommandArguments,
} from './GitLabFileOpener';

export class GitLabCommandRegistrar {
	public constructor(
		private readonly treeProvider:
			MergeRequestsTreeProvider,
		private readonly authenticationService:
			GitLabAuthenticationService,
		private readonly fileOpener: GitLabFileOpener,
		private readonly commentController:
			GitLabCommentController,
		private readonly clientFactory:
			GitLabClientFactory,
	) {}

	public register(): vscode.Disposable[] {
		return [
			this.registerRefreshCommand(),
			this.registerAuthenticateCommand(),
			this.registerLogoutCommand(),
			this.registerOpenMergeRequestCommand(),
			this.registerOpenFilePatchCommand(),
			this.registerAddCommentCommand(),
			this.registerApproveCommand(),
		];
	}

	private registerRefreshCommand(): vscode.Disposable {
		return vscode.commands.registerCommand(
			'gitlabMrReview.refresh',
			() => {
				this.treeProvider.refresh();
			},
		);
	}

	private registerAuthenticateCommand(): vscode.Disposable {
		return vscode.commands.registerCommand(
			'gitlabMrReview.authenticate',
			() => this.authenticationService.authenticate(),
		);
	}

	private registerLogoutCommand(): vscode.Disposable {
		return vscode.commands.registerCommand(
			'gitlabMrReview.logout',
			() => this.authenticationService.logout(),
		);
	}

	private registerOpenMergeRequestCommand():
		vscode.Disposable {
		return vscode.commands.registerCommand(
			'gitlabMrReview.openMergeRequest',
			(mergeRequest: GitLabMergeRequest) =>
				this.fileOpener.openMergeRequest(
					mergeRequest,
				),
		);
	}

	private registerOpenFilePatchCommand():
		vscode.Disposable {
		return vscode.commands.registerCommand(
			'gitlabMrReview.openFilePatch',
			(
				arguments_: OpenFilePatchCommandArguments,
			) => this.fileOpener.openFilePatch(arguments_),
		);
	}

	private registerAddCommentCommand(): vscode.Disposable {
		return vscode.commands.registerCommand(
			'gitlabMrReview.addComment',
			async () => {
				const editor =
					vscode.window.activeTextEditor;
				if (!editor) {
					vscode.window.showWarningMessage(
						'Нет активного редактора',
					);
					return;
				}

				if (editor.document.languageId !== 'diff') {
					vscode.window.showWarningMessage(
						'Комментирование доступно только в дифф-файлах',
					);
					return;
				}

				const line =
					editor.selection.start.line;

				const text =
					await vscode.window.showInputBox({
						title: 'Комментарий к диффу',
						prompt: 'Введите комментарий',
						ignoreFocusOut: true,
					});

				if (!text) {
					return;
				}

				await this.commentController.addComment(
					editor.document,
					line,
					text,
				);
			},
		);
	}

	private registerApproveCommand(): vscode.Disposable {
		return vscode.commands.registerCommand(
			'gitlabMrReview.approve',
			async (item: any) => {
				if (!item || !item.mergeRequest) {
					vscode.window.showErrorMessage(
						'No MR selected',
					);
					return;
				}

				const mergeRequest =
					item.mergeRequest;

				try {
					const client =
						await this.clientFactory.create();
					if (!client) {
						vscode.window.showErrorMessage(
							'GitLab client is not initialized',
						);
						return;
					}

					await client.approveMergeRequest(
						mergeRequest,
					);

					this.treeProvider.refresh();

					void vscode.window.showInformationMessage(
						`MR !${mergeRequest.iid} approved`,
					);
				} catch (error: unknown) {
					const message = error instanceof Error
						? error.message
						: String(error);

					void vscode.window.showErrorMessage(
						`Failed to approve MR: ${message}`,
					);
				}
			},
		);
	}
}