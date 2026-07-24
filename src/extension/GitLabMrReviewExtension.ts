import * as vscode from 'vscode';

import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { UnifiedDiffParser } from '../review/diff/unified-diff-parser';
import { OpenedDiffStore } from '../review/OpenedDiffStore';
import { MergeRequestsStore } from '../store/MergeRequestsStore';
import { MergeRequestsTreeProvider } from '../tree/MergeRequestsTreeProvider';
import { GitLabAuthenticationService } from './GitLabAuthenticationService';
import { GitLabCommandRegistrar } from './GitLabCommandRegistrar';
import { GitLabCommentController } from './GitLabCommentController';
import { GitLabCommentService } from './GitLabCommentService';
import { GitLabFileOpener } from './GitLabFileOpener';

export class GitLabMrReviewExtension {
	private readonly store: MergeRequestsStore;

	private readonly treeProvider: MergeRequestsTreeProvider;

	private readonly authenticationService:
		GitLabAuthenticationService;

	private readonly unifiedDiffParser:
		UnifiedDiffParser;

	private readonly openedDiffStore:
		OpenedDiffStore;

	private readonly commentController:
		GitLabCommentController;

	private readonly fileOpener: GitLabFileOpener;

	private readonly commandRegistrar:
		GitLabCommandRegistrar;

	public constructor(
		private readonly context: vscode.ExtensionContext,
	) {
		const clientFactory =
			new GitLabClientFactory(context);

		this.store = new MergeRequestsStore(clientFactory);

		this.treeProvider =
			new MergeRequestsTreeProvider(this.store);

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

		const commentService =
			new GitLabCommentService(clientFactory);

		this.commentController =
			new GitLabCommentController(
				this.openedDiffStore,
				commentService,
			);

		this.fileOpener =
			new GitLabFileOpener(
				this.unifiedDiffParser,
				this.openedDiffStore,
				this.commentController,
			);

		this.commandRegistrar =
			new GitLabCommandRegistrar(
				this.treeProvider,
				this.authenticationService,
				this.fileOpener,
				this.commentController,
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

		this.store.loadPending().catch(() => {
			// ignored
		});

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
			this.commentController,
			...this.commandRegistrar.register(),
		);
	}
}