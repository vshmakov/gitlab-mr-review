import * as vscode from 'vscode';

import { UnifiedDiffParser } from '../review/diff/unified-diff-parser';
import { GitLabClientFactory } from '../tree/GitLabClientFactory';
import { ReviewTreeProvider } from '../tree/ReviewTreeProvider';
import { GitLabAuthenticationService } from './GitLabAuthenticationService';
import { GitLabCommandRegistrar } from './GitLabCommandRegistrar';
import { GitLabFileOpener } from './GitLabFileOpener';
import { OpenedDiffStore } from '../review/opened-diff-store';

export class GitLabMrReviewExtension {
	private readonly treeProvider: ReviewTreeProvider;

	private readonly authenticationService:
		GitLabAuthenticationService;

	private readonly unifiedDiffParser:
		UnifiedDiffParser;

	private readonly openedDiffStore:
		OpenedDiffStore;

	private readonly fileOpener: GitLabFileOpener;

	private readonly commandRegistrar:
		GitLabCommandRegistrar;

	public constructor(
		private readonly context: vscode.ExtensionContext,
	) {
		const clientFactory =
			new GitLabClientFactory(context);

		this.treeProvider =
			new ReviewTreeProvider(clientFactory);

		this.authenticationService =
			new GitLabAuthenticationService(
				context,
				this.treeProvider,
				clientFactory,
			);

		this.unifiedDiffParser =
			new UnifiedDiffParser();

		this.openedDiffStore =
			new OpenedDiffStore();

		this.fileOpener =
			new GitLabFileOpener(
				this.unifiedDiffParser,
				this.openedDiffStore,
			);

		this.commandRegistrar =
			new GitLabCommandRegistrar(
				this.treeProvider,
				this.authenticationService,
				this.fileOpener,
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