import * as vscode from 'vscode';
import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { MergeRequestsStore } from '../store/MergeRequestsStore';
import { MergeRequestApprovedItem } from './MergeRequestApprovedItem';
import { MergeRequestChangesItem } from './MergeRequestChangesItem';
import { MergeRequestFileItem } from './MergeRequestFileItem';
import { MergeRequestMessageItem } from './MergeRequestMessageItem';
import { MergeRequestReviewerItem } from './MergeRequestReviewerItem';
import { MergeRequestRequestedChangesItem } from './MergeRequestRequestedChangesItem';

export type MergeRequestChildItem =
	| MergeRequestApprovedItem
	| MergeRequestRequestedChangesItem
	| MergeRequestChangesItem
	| MergeRequestFileItem
	| MergeRequestReviewerItem
	| MergeRequestMessageItem;

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
			`${mergeRequest.author?.name ?? 'not specified'} ` +
			`${mergeRequest.references?.full ?? ''}`.trim();

		this.tooltip = new vscode.MarkdownString(
			[
				`**${mergeRequest.title}**`,
				'',
				`Author: ${
					mergeRequest.author?.name ??
					'not specified'
				}`,
				'',
				`Updated: ${mergeRequest.updated_at}`,
			].join('\n'),
		);

		this.contextValue = 'mergeRequest';

		this.iconPath =
			new vscode.ThemeIcon('git-pull-request');

		this.command = {
			command: 'gitlabMrReview.openMergeRequest',
			title: 'Open Merge Request',
			arguments: [mergeRequest],
		};
	}

	public getChildren(): MergeRequestChildItem[] {
		if (this.store.isApprovalLoading(this.mergeRequest)) {
			return [new MergeRequestMessageItem('Loading...')];
		}

		let approvalData = this.store.getApprovalData(this.mergeRequest);

		if (!approvalData) {
			this.store.loadApprovalData(this.mergeRequest);
			return [new MergeRequestMessageItem('Loading...')];
		}

		const fileCount = (() => {
			const files = this.store.files.getFiles(this.mergeRequest);
			return files ? files.length : 0;
		})();

		return [
			new MergeRequestApprovedItem(approvalData),
			new MergeRequestRequestedChangesItem(approvalData),
			new MergeRequestChangesItem(
				this.mergeRequest,
				this.store,
				fileCount,
			),
		];
	}
}