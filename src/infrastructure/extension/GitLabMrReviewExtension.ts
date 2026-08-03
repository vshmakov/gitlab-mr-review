import * as vscode from 'vscode';
import { Environment } from '../../domain/interfaces/environment';
import { GitLabClientFactory } from '../../domain/client/GitLabClientFactory';
import { UnifiedDiffParser } from '../../domain/diff/unified-diff-parser';
import { MergeRequestsStore } from '../../domain/store/MergeRequestsStore';
import { MergeRequestsTreeProvider } from '../tree/MergeRequestsTreeProvider';
import { GitLabAuthenticationService } from '../../domain/service/GitLabAuthenticationService';
import { GitLabCommandRegistrar } from '../../domain/service/GitLabCommandRegistrar';
import { GitLabFileOpener } from '../../domain/service/GitLabFileOpener';

export class GitLabMrReviewExtension {
	private readonly store: MergeRequestsStore;
	private readonly treeProvider: MergeRequestsTreeProvider;
	private readonly authenticationService: GitLabAuthenticationService;
	private readonly unifiedDiffParser: UnifiedDiffParser;
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
			env.comments,
			this.treeProvider,
			this.authenticationService,
			this.fileOpener,
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
			vscode.workspace.onDidCloseTextDocument(() => {
				// Handle document close if needed
			});

		this.env.disposables.push(
			treeView,
			closeDocumentSubscription,
			this.env.comments,
			...this.commandRegistrar.register(),
		);
	}
}