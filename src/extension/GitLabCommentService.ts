import * as vscode from 'vscode';

import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';

export interface DiffCommentData {
	text: string;
	documentLine: number;
	oldLine?: number;
	newLine?: number;
	mergeRequest: GitLabMergeRequest;
	file: GitLabMergeRequestFile;
}

export class GitLabCommentService {
	public constructor(
		private readonly clientFactory: GitLabClientFactory,
	) {}

	public async handleComment(
		data: DiffCommentData,
	): Promise<void> {
		const client = await this.clientFactory.create();
		if (!client) {
			void vscode.window.showWarningMessage(
				'GitLab клиент не инициализирован.',
			);
			return;
		}

		try {
			const noteClient = client.getNoteClient();

			const note = await noteClient.createDraftNote(
				data.mergeRequest,
				data.file,
				data.text,
				data.oldLine,
				data.newLine,
			);

			void vscode.window.showInformationMessage(
				`Черновик создан (note #${note.id})`,
			);
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: String(error);

			void vscode.window.showErrorMessage(
				`Не удалось создать черновик: ${message}`,
			);
		}
	}
}