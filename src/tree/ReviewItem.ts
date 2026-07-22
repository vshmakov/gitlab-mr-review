import * as path from 'path';
import * as vscode from 'vscode';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';

export type ReviewItemType =
	| 'mergeRequest'
	| 'file';

export class ReviewItem extends vscode.TreeItem {
	private constructor(
		public readonly type: ReviewItemType,
		label: string,
		collapsibleState:
			vscode.TreeItemCollapsibleState,
		public readonly mergeRequest?:
			GitLabMergeRequest,
		public readonly file?:
			GitLabMergeRequestFile,
	) {
		super(label, collapsibleState);
	}

	public static createMergeRequest(
		mergeRequest: GitLabMergeRequest,
	): ReviewItem {
		const item = new ReviewItem(
			'mergeRequest',
			`!${mergeRequest.iid} ${mergeRequest.title}`,
			vscode.TreeItemCollapsibleState.Collapsed,
			mergeRequest,
		);

		item.description =
			mergeRequest.references?.full ??
			mergeRequest.author?.name;

		item.tooltip = new vscode.MarkdownString(
			[
				`**${mergeRequest.title}**`,
				'',
				`Автор: ${
					mergeRequest.author?.name ??
					'не указан'
				}`,
				'',
				`Обновлён: ${
					mergeRequest.updated_at
				}`,
			].join('\n'),
		);

		item.contextValue = 'mergeRequest';

		item.iconPath = new vscode.ThemeIcon(
			'git-pull-request',
		);

		item.command = {
			command:
				'gitlabMrReview.openMergeRequest',
			title: 'Открыть Merge Request',
			arguments: [mergeRequest],
		};

		return item;
	}

	public static createFile(
		mergeRequest: GitLabMergeRequest,
		file: GitLabMergeRequestFile,
	): ReviewItem {
		const fileName = path.basename(file.path);
		const directory = path.dirname(file.path);
		const prefix =
			ReviewItem.getFilePrefix(file);

		const label = `${prefix} ${fileName}`;

		const item = new ReviewItem(
			'file',
			label,
			vscode.TreeItemCollapsibleState.None,
			undefined,
			file,
		);

		item.description =
			directory === '.'
				? undefined
				: directory;

		item.accessibilityInformation = {
			label,
			role: 'treeitem',
		};

		item.tooltip =
			ReviewItem.getFileTooltip(file);

		item.contextValue = 'mergeRequestFile';

		item.command = {
		command:
			'gitlabMrReview.openFilePatch',
		title: 'Открыть патч файла',
		arguments: [
			{
				mergeRequest,
				file,
			},
		],
	};

		return item;
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
			return (
				`${file.oldPath} → ` +
				`${file.newPath}`
			);
		}

		return file.path;
	}
}