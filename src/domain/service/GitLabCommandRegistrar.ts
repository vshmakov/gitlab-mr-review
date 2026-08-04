import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { Disposable } from '../interfaces/disposable';
import { CommandRegistry } from '../interfaces/command-registry';
import { Notifier } from '../interfaces/notifier';
import { Input } from '../interfaces/input';
import { DocumentService } from '../interfaces/document-service';
import { CommentManager } from '../interfaces/comment-manager';
import { MergeRequestItem } from '../tree/MergeRequestItem';
import { MergeRequestFileItem } from '../tree/MergeRequestFileItem';
import { MergeRequestsTreeProvider } from '../../infrastructure/vscode/vscode-tree-provider';
import { GitLabAuthenticationService } from './GitLabAuthenticationService';
import {
	GitLabFileOpener,
	OpenFilePatchCommandArguments,
} from './GitLabFileOpener';
import { MergeRequestsStore } from '../store/MergeRequestsStore';
import { ReviewedPersistence } from '../interfaces/reviewed-persistence';

export class GitLabCommandRegistrar {
	public constructor(
		private readonly commands: CommandRegistry,
		private readonly notifier: Notifier,
		private readonly input: Input,
		private readonly documents: DocumentService,
		private readonly comments: CommentManager,
		private readonly treeProvider: MergeRequestsTreeProvider,
		private readonly authenticationService: GitLabAuthenticationService,
		private readonly fileOpener: GitLabFileOpener,
		private readonly clientFactory: GitLabClientFactory,
		private readonly store: MergeRequestsStore,
		private readonly reviewedPersistence: ReviewedPersistence,
	) {}

	public register(): Disposable[] {
		return [
			this.registerRefreshCommand(),
			this.registerAuthenticateCommand(),
			this.registerLogoutCommand(),
			this.registerOpenMergeRequestCommand(),
			this.registerOpenFilePatchCommand(),
			this.registerAddCommentCommand(),
			this.registerApproveCommand(),
			this.registerMarkAsReviewedCommand(),
			this.registerUnmarkAsReviewedCommand(),
		];
	}

	private registerRefreshCommand(): Disposable {
		return this.commands.register(
			'gitlabMrReview.refresh',
			() => {
				this.treeProvider.refresh();
			},
		);
	}

	private registerAuthenticateCommand(): Disposable {
		return this.commands.register(
			'gitlabMrReview.authenticate',
			() => this.authenticationService.authenticate(),
		);
	}

	private registerLogoutCommand(): Disposable {
		return this.commands.register(
			'gitlabMrReview.logout',
			() => this.authenticationService.logout(),
		);
	}

	private registerOpenMergeRequestCommand(): Disposable {
		return this.commands.register(
			'gitlabMrReview.openMergeRequest',
			(mergeRequest: GitLabMergeRequest) =>
				this.fileOpener.openMergeRequest(mergeRequest),
		);
	}

	private registerOpenFilePatchCommand(): Disposable {
		return this.commands.register(
			'gitlabMrReview.openFilePatch',
			(arguments_: OpenFilePatchCommandArguments) =>
				this.fileOpener.openFilePatch(arguments_),
		);
	}

	private registerAddCommentCommand(): Disposable {
		return this.commands.register(
			'gitlabMrReview.addComment',
			async () => {
				const document = this.documents.activeDocument;
				if (!document) {
					this.notifier.showWarning('Нет активного редактора');
					return;
				}

				if (document.languageId !== 'diff') {
					this.notifier.showWarning(
						'Комментирование доступно только в дифф-файлах',
					);
					return;
				}

				const text = await this.input.showInputBox({
					title: 'Комментарий к диффу',
					prompt: 'Введите комментарий',
					ignoreFocusOut: true,
				});

				if (!text) {
					return;
				}

				// TODO: get line from selection
				await this.comments.addComment(document, 0, text);
			},
		);
	}

	private registerApproveCommand(): Disposable {
		return this.commands.register(
			'gitlabMrReview.approve',
			async (item: MergeRequestItem | undefined) => {
				if (!item || !item.mergeRequest) {
					this.notifier.showError('No MR selected');
					return;
				}

				const mergeRequest = item.mergeRequest;

				try {
					const client = await this.clientFactory.create();
					if (!client) {
						this.notifier.showError(
							'GitLab client is not initialized',
						);
						return;
					}

					await client.approveMergeRequest(mergeRequest);
					this.treeProvider.refresh();

					this.notifier.showInfo(
						`MR !${mergeRequest.iid} approved`,
					);
				} catch (error: unknown) {
					const message = error instanceof Error
						? error.message
						: String(error);

					this.notifier.showError(
						`Failed to approve MR: ${message}`,
					);
				}
			},
		);
	}

	private registerMarkAsReviewedCommand(): Disposable {
		return this.commands.register(
			'gitlabMrReview.markAsReviewed',
			(item: MergeRequestFileItem | undefined) => {
				if (!item || !item.mergeRequest) {
					this.notifier.showWarning('No file selected');
					return;
				}

				this.store.reviewed.markAsReviewed(item.mergeRequest, item.file);
				this.reviewedPersistence.save(this.store.reviewed);
				this.treeProvider.refreshFile(item);
			},
		);
	}

	private registerUnmarkAsReviewedCommand(): Disposable {
		return this.commands.register(
			'gitlabMrReview.unmarkAsReviewed',
			(item: MergeRequestFileItem | undefined) => {
				if (!item || !item.mergeRequest) {
					this.notifier.showWarning('No file selected');
					return;
				}

				this.store.reviewed.unmarkAsReviewed(item.mergeRequest, item.file);
				this.reviewedPersistence.save(this.store.reviewed);
				this.treeProvider.refreshFile(item);
			},
		);
	}
}