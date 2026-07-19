import * as vscode from 'vscode';
import { GitLabAuthenticationService } from './GitLabAuthenticationService';
import { GitLabCommandRegistrar } from './GitLabCommandRegistrar';
import { ReviewTreeProvider } from '../tree/ReviewTreeProvider';

export class GitLabMrReviewExtension {
	private readonly treeProvider: ReviewTreeProvider;

	private readonly authenticationService:
		GitLabAuthenticationService;

	private readonly commandRegistrar: GitLabCommandRegistrar;

	public constructor(
		private readonly context: vscode.ExtensionContext,
	) {
		this.treeProvider = new ReviewTreeProvider(context);

		this.authenticationService =
			new GitLabAuthenticationService(
				context,
				this.treeProvider,
			);

		this.commandRegistrar = new GitLabCommandRegistrar(
			this.treeProvider,
			this.authenticationService,
		);
	}

	public activate(): void {
		const treeView = vscode.window.createTreeView(
			'gitlabMrReview.pendingReviews',
			{
				treeDataProvider: this.treeProvider,
				showCollapseAll: false,
			},
		);

		this.context.subscriptions.push(
			treeView,
			...this.commandRegistrar.register(),
		);
	}
}