import * as path from 'path';
import * as vscode from 'vscode';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';

export class MergeRequestFileItem
	extends vscode.TreeItem
{
	public constructor(
		mergeRequest: GitLabMergeRequest,
		file: GitLabMergeRequestFile,
	) {
		const fileName = path.basename(file.path);
		const directory = path.dirname(file.path);
		const prefix = MergeRequestFileItem.getFilePrefix(
			file,
		);

		super(
			`${prefix} ${fileName}`,
			vscode.TreeItemCollapsibleState.None,
		);

		this.description =
			directory === '.'
				? undefined
				: directory;

		this.accessibilityInformation = {
			label: `${prefix} ${fileName}`,
			role: 'treeitem',
		};

		this.tooltip =
			MergeRequestFileItem.getFileTooltip(file);

		this.contextValue = 'mergeRequestFile';

		this.command = {
			command: 'gitlabMrReview.openFilePatch',
			title: 'Открыть патч файла',
			arguments: [{
				mergeRequest,
				file,
			}],
		};
	}

	private static getFilePrefix(
		file: GitLabMergeRequestFile,
	): string {
		if (file.added) {
			return 'A';
		}

		if (file.deleted) {
			return 'D';
		}

		if (file.renamed) {
			return 'R';
		}

		return 'M';
	}

	private static getFileTooltip(
		file: GitLabMergeRequestFile,
	): string {
		if (file.renamed) {
			return `${file.oldPath} → ${file.newPath}`;
		}

		return file.path;
	}

	public getChildren(): never[] {
		return [];
	}
}