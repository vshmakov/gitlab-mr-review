import * as vscode from 'vscode';
import { GitLabMergeRequest } from './GitLabClient';
import { GitLabAuthenticationService } from './GitLabAuthenticationService';
import { ReviewTreeProvider } from './ReviewTreeProvider';

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

	private async openMergeRequest(
		mergeRequest: GitLabMergeRequest,
	): Promise<void> {
		await vscode.env.openExternal(
			vscode.Uri.parse(mergeRequest.web_url),
		);
	}
}