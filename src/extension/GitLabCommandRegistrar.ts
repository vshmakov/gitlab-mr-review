import * as vscode from 'vscode';
import {
	GitLabMergeRequest,
	GitLabMergeRequestFile,
} from '../client/GitLabClient';
import { GitLabAuthenticationService } from './GitLabAuthenticationService';
import { ReviewTreeProvider } from '../tree/ReviewTreeProvider';

export class GitLabCommandRegistrar {
	public constructor(
		private readonly treeProvider: ReviewTreeProvider,
		private readonly authenticationService:
			GitLabAuthenticationService,
	) {}

	public register(): vscode.Disposable[] {
		return [
			this.registerRefreshCommand(),
			this.registerAuthenticateCommand(),
			this.registerLogoutCommand(),
			this.registerOpenMergeRequestCommand(),
			this.registerOpenFilePatchCommand(),
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
				this.openMergeRequest(mergeRequest),
		);
	}

	private registerOpenFilePatchCommand():
		vscode.Disposable {
		return vscode.commands.registerCommand(
			'gitlabMrReview.openFilePatch',
			(file: GitLabMergeRequestFile) =>
				this.openFilePatch(file),
		);
	}

	private async openMergeRequest(
		mergeRequest: GitLabMergeRequest,
	): Promise<void> {
		await vscode.env.openExternal(
			vscode.Uri.parse(mergeRequest.web_url),
		);
	}

	private async openFilePatch(
		file: GitLabMergeRequestFile,
	): Promise<void> {
		if (!file.diff.trim()) {
			void vscode.window.showInformationMessage(
				`Для файла ${file.path} патч отсутствует.`,
			);

			return;
		}

		const document =
			await vscode.workspace.openTextDocument({
				content: this.createPatchContent(file),
				language: 'diff',
			});

		await vscode.window.showTextDocument(
			document,
			{
				preview: true,
			},
		);
	}

	private createPatchContent(
		file: GitLabMergeRequestFile,
	): string {
		return [
			`diff --git a/${file.oldPath} b/${file.newPath}`,
			`--- a/${file.oldPath}`,
			`+++ b/${file.newPath}`,
			file.diff,
		].join('\n');
	}
}