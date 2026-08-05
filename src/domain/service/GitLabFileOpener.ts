import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { UnifiedDiffParser } from '../diff/unified-diff-parser';
import { Notifier } from '../interfaces/notifier';
import { DocumentService } from '../interfaces/document-service';
import { UriOpener } from '../interfaces/uri-opener';
import { CommentManager } from '../interfaces/comment-manager';

export interface OpenFilePatchCommandArguments {
	mergeRequest: GitLabMergeRequest | null;
	file: GitLabMergeRequestFile;
}

export class GitLabFileOpener {
	public constructor(
		private readonly uriOpener: UriOpener,
		private readonly notifier: Notifier,
		private readonly documents: DocumentService,
		private readonly unifiedDiffParser: UnifiedDiffParser,
		private readonly comments: CommentManager,
	) {}

	public async openMergeRequest(
		mergeRequest: GitLabMergeRequest,
	): Promise<void> {
		this.uriOpener.openExternal(mergeRequest.web_url);
	}

	public async openFilePatch(
		arguments_: OpenFilePatchCommandArguments,
	): Promise<void> {
		const { mergeRequest, file } = arguments_;

		if (!file.diff.trim()) {
			this.notifier.showInfo(
				`Для файла ${file.path} патч отсутствует.`,
			);
			return;
		}

		const patchContent = this.createPatchContent(file);
		const parsedDiff = this.unifiedDiffParser.parse(patchContent);

		const document = await this.documents.openVirtualDocument(
			parsedDiff.text,
			'diff',
		);

		if (mergeRequest) {
			this.comments.setContext(document, {
				mergeRequest: {
					project_id: mergeRequest.project_id,
					iid: mergeRequest.iid,
				},
				file: {
					path: file.path,
					oldPath: file.oldPath,
					newPath: file.newPath,
				},
				lines: parsedDiff.lines,
			});
		}

		this.documents.showDocument(document);
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