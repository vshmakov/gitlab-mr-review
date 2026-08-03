import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { Disposable } from '../infra/disposable';
import { CommandRegistry } from '../infra/command-registry';
import { Notifier } from '../infra/notifier';
import { Input } from '../infra/input';
import { DocumentService } from '../infra/document-service';
import { MergeRequestItem } from '../tree/MergeRequestItem';
import { MergeRequestsTreeProvider } from '../tree/MergeRequestsTreeProvider';
import { GitLabAuthenticationService } from './GitLabAuthenticationService';
import { GitLabCommentController } from './GitLabCommentController';
import {
	GitLabFileOpener,
	OpenFilePatchCommandArguments,
} from './GitLabFileOpener';

export class GitLabCommandRegistrar {
	public constructor(
		private readonly commands: CommandRegistry,
		private readonly notifier: Notifier,
		private readonly input: Input,
		private readonly documents: DocumentService,
		private readonly treeProvider: MergeRequestsTreeProvider,
		private readonly authenticationService: GitLabAuthenticationService,
		private readonly fileOpener: GitLabFileOpener,
		private readonly commentController: GitLabCommentController,
		private readonly clientFactory: GitLabClientFactory,
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
				await this.commentController.addComment(
					document as unknown as import('vscode').TextDocument,
					0, // TODO: get from selection
					text,
				);
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
}