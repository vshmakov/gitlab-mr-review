import * as vscode from 'vscode';

export interface GitLabMergeRequest {
	id: number;
	iid: number;
	title: string;
	web_url: string;
	project_id: number;
	updated_at: string;
	draft: boolean;
	work_in_progress: boolean;
	references?: {
		short?: string;
		relative?: string;
		full?: string;
	};
	author?: {
		name: string;
		username: string;
	};
}

export class ReviewItem extends vscode.TreeItem {
	public constructor(
		public readonly mergeRequest: GitLabMergeRequest,
	) {
		super(
			mergeRequest.title,
			vscode.TreeItemCollapsibleState.None,
		);

		const projectName =
			ReviewItem.getProjectName(mergeRequest);

		this.description = [
			mergeRequest.author?.name,
			`!${mergeRequest.iid}`,
			projectName,
		]
			.filter(
				(value): value is string =>
					Boolean(value),
			)
			.join(' ');

		this.tooltip = new vscode.MarkdownString(
			[
				`**${mergeRequest.title}**`,
				'',
				`Автор: ${
					mergeRequest.author?.name ??
					'неизвестен'
				}`,
				'',
				`Merge request: !${mergeRequest.iid}`,
				'',
				`Проект: ${projectName ?? 'неизвестен'}`,
				'',
				`Обновлён: ${new Date(
					mergeRequest.updated_at,
				).toLocaleString()}`,
			].join('\n'),
		);

		this.iconPath = new vscode.ThemeIcon(
			mergeRequest.draft
				? 'git-pull-request-draft'
				: 'git-pull-request',
		);

		this.command = {
			command:
				'gitlabMrReview.openMergeRequest',
			title: 'Open Merge Request',
			arguments: [mergeRequest],
		};

		this.contextValue = 'gitlabMergeRequest';
	}

	private static getProjectName(
		mergeRequest: GitLabMergeRequest,
	): string | undefined {
		const fullReference =
			mergeRequest.references?.full;

		if (!fullReference) {
			return undefined;
		}

		const projectPath =
			fullReference.split('!')[0];

		return projectPath
			.split('/')
			.filter(Boolean)
			.pop();
	}
}
