import * as path from 'path';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { Command, ITreeItem } from './tree-item';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';

export class MergeRequestFileItem implements ITreeItem {
	readonly label: string;
	readonly description?: string;
	readonly tooltip: string;
	readonly contextValue = 'mergeRequestFile';
	readonly collapsibleState: 'none' = 'none';
	readonly command: Command;
	readonly accessibilityLabel: string;

	public constructor(
		mergeRequest: GitLabMergeRequest,
		file: GitLabMergeRequestFile,
	) {
		const fileName = path.basename(file.path);
		const directory = path.dirname(file.path);
		const prefix = getFilePrefix(file);

		this.label = `${prefix} ${fileName}`;
		this.description = directory === '.' ? undefined : directory;
		this.tooltip = getFileTooltip(file);
		this.accessibilityLabel = `${prefix} ${fileName}`;

		this.command = {
			command: 'gitlabMrReview.openFilePatch',
			title: 'Open File Patch',
			arguments: [{ mergeRequest, file }],
		};
	}

	public getChildren(): never[] {
		return [];
	}
}

function getFilePrefix(file: GitLabMergeRequestFile): string {
	if (file.added) return 'A';
	if (file.deleted) return 'D';
	if (file.renamed) return 'R';
	return 'M';
}

function getFileTooltip(file: GitLabMergeRequestFile): string {
	if (file.renamed) {
		return `${file.oldPath} → ${file.newPath}`;
	}
	return file.path;
}