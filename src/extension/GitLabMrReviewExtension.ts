import * as vscode from 'vscode';
import { Environment } from '../infra/environment';
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
	private readonly authenticationService: GitLabAuthenticationService;
	private readonly unifiedDiffParser: UnifiedDiffParser;
	private readonly openedDiffStore: OpenedDiffStore;
	private readonly commentController: GitLabCommentController;
	private readonly fileOpener: GitLabFileOpener;
	private readonly commandRegistrar: GitLabCommandRegistrar;

	public constructor(public readonly env: Environment) {
		const clientFactory = new GitLabClientFactory(
			env.secrets,
			env.config,
			env.notifier,
			env.input,
			env.commands,
		);

		this.store = new MergeRequestsStore(clientFactory, env.notifier);

		this.treeProvider = new MergeRequestsTreeProvider(this.store);

		this.authenticationService = new GitLabAuthenticationService(
			env.secrets,
			env.config,
			env.notifier,
			env.input,
			env.progress,
			this.treeProvider,
			clientFactory,
		);

		this.unifiedDiffParser = new UnifiedDiffParser();

		this.openedDiffStore = new OpenedDiffStore();

		const commentService = new GitLabCommentService(
			clientFactory,
			env.notifier,
		);

		this.commentController = new GitLabCommentController(
			this.openedDiffStore,
			commentService,
		);

		this.fileOpener = new GitLabFileOpener(
			env.uri,
			env.notifier,
			env.documents,
			this.unifiedDiffParser,
		);

		this.commandRegistrar = new GitLabCommandRegistrar(
			env.commands,
			env.notifier,
			env.input,
			env.documents,
			this.treeProvider,
			this.authenticationService,
			this.fileOpener,
			this.commentController,
			clientFactory,
		);
	}

	public dispose(): void {
		this.env.disposables.dispose();
	}

	public activate(): void {
		const treeView = vscode.window.createTreeView(
			'gitlabMrReview.pendingReviews',
			{
				treeDataProvider: this.treeProvider,
				showCollapseAll: false,
			},
		);

		this.store.loadPending().catch(() => {
			// ignored
		});

		const closeDocumentSubscription =
			vscode.workspace.onDidCloseTextDocument((document) => {
				this.openedDiffStore.delete(document);
			});

		this.env.disposables.push(
			treeView,
			closeDocumentSubscription,
			this.commentController,
			...this.commandRegistrar.register(),
		);
	}
}