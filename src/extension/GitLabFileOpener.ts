import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';
import { UnifiedDiffParser } from '../review/diff/unified-diff-parser';
import { Notifier } from '../infra/notifier';
import { DocumentService } from '../infra/document-service';
import { UriOpener } from '../infra/uri-opener';

export interface OpenFilePatchCommandArguments {
	mergeRequest: GitLabMergeRequest;
	file: GitLabMergeRequestFile;
}

export class GitLabFileOpener {
	public constructor(
		private readonly uriOpener: UriOpener,
		private readonly notifier: Notifier,
		private readonly documents: DocumentService,
		private readonly unifiedDiffParser: UnifiedDiffParser,
	) {}

	public async openMergeRequest(
		mergeRequest: GitLabMergeRequest,
	): Promise<void> {
		this.uriOpener.openExternal(mergeRequest.web_url);
	}

	public async openFilePatch(
		arguments_: OpenFilePatchCommandArguments,
	): Promise<void> {
		const { file } = arguments_;

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