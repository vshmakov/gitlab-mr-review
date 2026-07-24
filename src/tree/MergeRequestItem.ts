import * as path from 'path';
import * as vscode from 'vscode';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { GitLabMergeRequestFile } from '../model/GitLabMergeRequestFile';

export type MergeRequestItemType =
	| 'category'
	| 'mergeRequest'
	| 'file';

export type MergeRequestCategory =
	| 'needsReview'
	| 'approved'
	| 'requestedChanges';

export class MergeRequestItem extends vscode.TreeItem {
	private constructor(
		public readonly type: MergeRequestItemType,
		label: string,
		collapsibleState:
			vscode.TreeItemCollapsibleState,
		public readonly mergeRequest?:
			GitLabMergeRequest,
		public readonly file?:
			GitLabMergeRequestFile,
		public readonly category?:
			MergeRequestCategory,
	) {
		super(label, collapsibleState);
	}

	public static createCategory(
		category: MergeRequestCategory,
	): MergeRequestItem {
		const config: Record<MergeRequestCategory, {
			label: string;
			icon: string;
			contextValue: string;
		}> = {
			needsReview: {
				label: 'Needs My Review',
				icon: 'git-pull-request',
				contextValue: 'categoryNeedsReview',
			},
			approved: {
				label: 'I Approved',
				icon: 'check',
				contextValue: 'categoryApproved',
			},
			requestedChanges: {
				label: 'I Requested Changes',
				icon: 'warning',
				contextValue: 'categoryRequestedChanges',
			},
		};

		const entry = config[category];

		const item = new MergeRequestItem(
			'category',
			entry.label,
			vscode.TreeItemCollapsibleState.Collapsed,
			undefined,
			undefined,
			category,
		);

		item.iconPath = new vscode.ThemeIcon(
			entry.icon,
		);

		item.contextValue = entry.contextValue;

		return item;
	}

	public static createMergeRequest(
		mergeRequest: GitLabMergeRequest,
	): MergeRequestItem {
		const item = new MergeRequestItem(
			'mergeRequest',
			`!${mergeRequest.iid} ${mergeRequest.title}`,
			vscode.TreeItemCollapsibleState.Collapsed,
			mergeRequest,
		);

		item.description =
			`${mergeRequest.author?.name ?? 'не указан'} ` +
			`${mergeRequest.references?.full ?? ''}`.trim();

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
	): MergeRequestItem {
		const fileName = path.basename(file.path);
		const directory = path.dirname(file.path);
		const prefix =
			MergeRequestItem.getFilePrefix(file);

		const label = `${prefix} ${fileName}`;

		const item = new MergeRequestItem(
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
			MergeRequestItem.getFileTooltip(file);

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