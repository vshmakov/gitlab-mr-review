import * as vscode from 'vscode';
import {
	GitLabMergeRequest,
	GitLabMergeRequestFile,
} from '../client/GitLabClient';

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
		file: GitLabMergeRequestFile,
	): ReviewItem {
		const item = new ReviewItem(
			'file',
			file.path,
			vscode.TreeItemCollapsibleState.None,
			undefined,
			file,
		);

		item.description =
			ReviewItem.getFileStatus(file);

		item.tooltip =
			ReviewItem.getFileTooltip(file);

		item.contextValue = 'mergeRequestFile';

		item.iconPath = new vscode.ThemeIcon(
			ReviewItem.getFileIcon(file),
		);

		return item;
	}

	private static getFileStatus(
		file: GitLabMergeRequestFile,
	): string | undefined {
		if (file.added) {
			return 'added';
		}

		if (file.deleted) {
			return 'deleted';
		}

		if (file.renamed) {
			return 'renamed';
		}

		return undefined;
	}

	private static getFileIcon(
		file: GitLabMergeRequestFile,
	): string {
		if (file.added) {
			return 'diff-added';
		}

		if (file.deleted) {
			return 'diff-removed';
		}

		if (file.renamed) {
			return 'diff-renamed';
		}

		return 'file';
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