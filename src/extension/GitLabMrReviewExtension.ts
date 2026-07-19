import * as vscode from 'vscode';

import { UnifiedDiffParser } from '../review/diff/unified-diff-parser';
import { ReviewTreeProvider } from '../tree/ReviewTreeProvider';
import { GitLabAuthenticationService } from './GitLabAuthenticationService';
import { GitLabCommandRegistrar } from './GitLabCommandRegistrar';
import { OpenedDiffStore } from '../review/opened-diff-store';

export class GitLabMrReviewExtension {
	private readonly treeProvider: ReviewTreeProvider;

	private readonly authenticationService:
		GitLabAuthenticationService;

	private readonly unifiedDiffParser:
		UnifiedDiffParser;

	private readonly openedDiffStore:
		OpenedDiffStore;

	private readonly commandRegistrar:
		GitLabCommandRegistrar;

	public constructor(
		private readonly context: vscode.ExtensionContext,
	) {
		this.treeProvider =
			new ReviewTreeProvider(context);

		this.authenticationService =
			new GitLabAuthenticationService(
				context,
				this.treeProvider,
			);

		this.unifiedDiffParser =
			new UnifiedDiffParser();

		this.openedDiffStore =
			new OpenedDiffStore();

		this.commandRegistrar =
			new GitLabCommandRegistrar(
				this.treeProvider,
				this.authenticationService,
				this.unifiedDiffParser,
				this.openedDiffStore,
			);
	}

	public activate(): void {
		const treeView =
			vscode.window.createTreeView(
				'gitlabMrReview.pendingReviews',
				{
					treeDataProvider:
						this.treeProvider,
					showCollapseAll: false,
				},
			);

		const closeDocumentSubscription =
			vscode.workspace.onDidCloseTextDocument(
				(document) => {
					this.openedDiffStore.delete(
						document,
					);
				},
			);

		this.context.subscriptions.push(
			treeView,
			closeDocumentSubscription,
			...this.commandRegistrar.register(),
		);
	}
}