import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { ITreeItem } from './tree-item';
import { MergeRequestsStore } from '../store/MergeRequestsStore';
import { MergeRequestApprovedItem } from './ReviewerListTreeItem';
import { MergeRequestChangesItem } from './MergeRequestChangesItem';
import { MergeRequestFileItem } from './MergeRequestFileItem';
import { MergeRequestMessageItem } from './MergeRequestMessageItem';
import { MergeRequestReviewerItem } from './MergeRequestReviewerItem';
import { MergeRequestRequestedChangesItem } from './ReviewerListTreeItem';

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

export class MergeRequestItem implements ITreeItem {
	readonly label: string;
	readonly description: string;
	readonly tooltip: string;
	readonly contextValue = 'mergeRequest';
	readonly collapsibleState: 'collapsed' = 'collapsed';
	readonly icon = { name: 'git-pull-request' };
	readonly command: { command: string; title: string; arguments: unknown[] };

	public constructor(
		public readonly mergeRequest: GitLabMergeRequest,
		private readonly store: MergeRequestsStore,
	) {
		this.label = `!${mergeRequest.iid} ${mergeRequest.title}`;
		this.description =
			`${mergeRequest.author?.name ?? 'not specified'} ` +
			`${mergeRequest.references?.full ?? ''}`.trim();

		this.tooltip = [
			`**${mergeRequest.title}**`,
			'',
			`Author: ${mergeRequest.author?.name ?? 'not specified'}`,
			'',
			`Updated: ${mergeRequest.updated_at}`,
		].join('\n');

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
			this.store.loadFiles(this.mergeRequest);
			return [new MergeRequestMessageItem('Loading...')];
		}

		const files = this.store.files.getFiles(this.mergeRequest);
		const fileCount = files ? files.length : undefined;

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