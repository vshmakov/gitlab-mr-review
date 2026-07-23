import * as vscode from 'vscode';

import { GitLabClientFactory } from '../client/GitLabClientFactory';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { UnifiedDiffParser } from '../review/diff/unified-diff-parser';
import { OpenedDiffStore } from '../review/OpenedDiffStore';
import { GitLabCommentController } from './GitLabCommentController';

export interface OpenFilePatchCommandArguments {
	mergeRequest: GitLabMergeRequest;
	file: GitLabMergeRequestFile;
}

export class GitLabFileOpener {
	private readonly unifiedDiffParser: UnifiedDiffParser;

	private readonly openedDiffStore: OpenedDiffStore;

	private readonly commentController: GitLabCommentController;

	public constructor(
		unifiedDiffParser: UnifiedDiffParser,
		openedDiffStore: OpenedDiffStore,
		commentController: GitLabCommentController,
		private readonly clientFactory: GitLabClientFactory,
	) {
		this.unifiedDiffParser = unifiedDiffParser;
		this.openedDiffStore = openedDiffStore;
		this.commentController = commentController;
	}

	public async openMergeRequest(
		mergeRequest: GitLabMergeRequest,
	): Promise<void> {
		await vscode.env.openExternal(
			vscode.Uri.parse(mergeRequest.web_url),
		);
	}

	public async openFilePatch(
		arguments_: OpenFilePatchCommandArguments,
	): Promise<void> {
		const { mergeRequest, file } = arguments_;

		if (!file.diff.trim()) {
			void vscode.window.showInformationMessage(
				`Для файла ${file.path} патч отсутствует.`,
			);
			return;
		}

		const enrichedRequest =
			await this.enrichMergeRequest(mergeRequest);

		const patchContent = this.createPatchContent(file);

		const parsedDiff = this.unifiedDiffParser.parse(
			patchContent,
		);

		const document =
			await vscode.workspace.openTextDocument({
				content: parsedDiff.text,
				language: 'diff',
			});

		this.openedDiffStore.set(document, {
			mergeRequest: enrichedRequest,
			file,
			parsedDiff,
		});

		this.commentController.onDocumentOpened(document);

		await vscode.window.showTextDocument(document, {
			preview: false,
		});
	}

	private async enrichMergeRequest(
		mergeRequest: GitLabMergeRequest,
	): Promise<GitLabMergeRequest> {
		if (mergeRequest.baseSha) {
			return mergeRequest;
		}

		const client = await this.clientFactory.create();
		if (!client) {
			return mergeRequest;
		}

		try {
			return await client.getMergeRequestDetails(
				mergeRequest,
			);
		} catch {
			return mergeRequest;
		}
	}

	private createPatchContent(
		file: GitLabMergeRequestFile,
	): string {
		return [
			`diff --git a/${file.oldPath} b/${file.newPath}`,
			`--- a/${file.oldPath}`,
			`+++ b/${file.newPath}`,
			file.diff,
		].join('\n');
	}
}