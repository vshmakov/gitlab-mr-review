import * as vscode from 'vscode';

import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { ReviewTreeProvider } from '../tree/ReviewTreeProvider';
import { GitLabAuthenticationService } from './GitLabAuthenticationService';
import { GitLabCommentController } from './GitLabCommentController';
import {
	GitLabFileOpener,
	OpenFilePatchCommandArguments,
} from './GitLabFileOpener';

export class GitLabCommandRegistrar {
	public constructor(
		private readonly treeProvider: ReviewTreeProvider,
		private readonly authenticationService:
			GitLabAuthenticationService,
		private readonly fileOpener: GitLabFileOpener,
		private readonly commentController:
			GitLabCommentController,
	) {}

	public register(): vscode.Disposable[] {
		return [
			this.registerRefreshCommand(),
			this.registerAuthenticateCommand(),
			this.registerLogoutCommand(),
			this.registerOpenMergeRequestCommand(),
			this.registerOpenFilePatchCommand(),
			this.registerAddCommentCommand(),
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
}