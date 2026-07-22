import * as vscode from 'vscode';

import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { ParsedDiff } from '../review/diff/parsed-diff';
import { UnifiedDiffParser } from '../review/diff/unified-diff-parser';
import { OpenedDiffStore } from '../review/opened-diff-store';

export interface OpenFilePatchCommandArguments {
	mergeRequest: GitLabMergeRequest;
	file: GitLabMergeRequestFile;
}

export class GitLabFileOpener {
	private readonly unifiedDiffParser: UnifiedDiffParser;

	private readonly openedDiffStore: OpenedDiffStore;

	public constructor(
		unifiedDiffParser: UnifiedDiffParser,
		openedDiffStore: OpenedDiffStore,
	) {
		this.unifiedDiffParser = unifiedDiffParser;
		this.openedDiffStore = openedDiffStore;
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
			mergeRequest,
			file,
			parsedDiff,
		});

		await vscode.window.showTextDocument(document, {
			preview: false,
		});
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