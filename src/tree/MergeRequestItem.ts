import * as vscode from 'vscode';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { MergeRequestsStore } from '../store/MergeRequestsStore';
import { MergeRequestFileItem } from './MergeRequestFileItem';
import { MergeRequestMessageItem } from './MergeRequestMessageItem';

export type MergeRequestCategory =
	| 'needsReview'
	| 'approved'
	| 'requestedChanges'
	| 'missed'
	| 'my';

export class MergeRequestItem
	extends vscode.TreeItem
{
	public constructor(
		public readonly mergeRequest:
			GitLabMergeRequest,
		private readonly store: MergeRequestsStore,
	) {
		super(
			`!${mergeRequest.iid} ${mergeRequest.title}`,
			vscode.TreeItemCollapsibleState.Collapsed,
		);

		this.description =
			`${mergeRequest.author?.name ?? 'не указан'} ` +
			`${mergeRequest.references?.full ?? ''}`.trim();

		this.tooltip = new vscode.MarkdownString(
			[
				`**${mergeRequest.title}**`,
				'',
				`Автор: ${
					mergeRequest.author?.name ??
					'не указан'
				}`,
				'',
				`Обновлён: ${mergeRequest.updated_at}`,
			].join('\n'),
		);

		this.contextValue = 'mergeRequest';

		this.iconPath =
			new vscode.ThemeIcon('git-pull-request');

		this.command = {
			command: 'gitlabMrReview.openMergeRequest',
			title: 'Открыть Merge Request',
			arguments: [mergeRequest],
		};
	}

	public getChildren(): (MergeRequestFileItem | MergeRequestMessageItem)[] {
		if (this.store.isFilesLoading(this.mergeRequest)) {
			return [new MergeRequestMessageItem('Loading files...')];
		}

		const files = this.store.files.getFiles(this.mergeRequest);
		if (files) {
			return files.map((f) =>
				new MergeRequestFileItem(
					this.mergeRequest,
					f,
				),
			);
		}

		this.store.loadFiles(this.mergeRequest);
		return [new MergeRequestMessageItem('Loading files...')];
	}
}