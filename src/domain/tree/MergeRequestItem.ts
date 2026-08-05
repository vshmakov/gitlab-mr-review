import { GitLabMergeRequest } from '../model/GitLabMergeRequest';
import { ITreeItem } from './tree-item';
import { MergeRequestsStore } from '../store/MergeRequestsStore';
import { MergeRequestApprovedItem } from './ReviewerListTreeItem';
import { MergeRequestChangesItem } from './MergeRequestChangesItem';
import { MergeRequestFileItem } from './MergeRequestFileItem';
import { MergeRequestReviewerItem } from './MergeRequestReviewerItem';
import { MergeRequestRequestedChangesItem } from './ReviewerListTreeItem';
import { MergeRequestOverviewItem } from './MergeRequestOverviewItem';

export type MergeRequestChildItem =
	| MergeRequestOverviewItem
	| MergeRequestApprovedItem
	| MergeRequestRequestedChangesItem
	| MergeRequestChangesItem
	| MergeRequestFileItem
	| MergeRequestReviewerItem;

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
		this.label = `${mergeRequest.title} !${mergeRequest.iid}`;
		this.description =
			`${mergeRequest.author?.name ?? 'not specified'} ` +
			`${mergeRequest.references?.full ?? ''}`.trim();

		this.tooltip = [
			`${mergeRequest.title} !${mergeRequest.iid}`,
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
		if (!this.store.isApprovalLoading(this.mergeRequest)) {
			const approvalData = this.store.getApprovalData(this.mergeRequest);

			if (!approvalData) {
				this.store.loadApprovalData(this.mergeRequest);
				this.store.loadFiles(this.mergeRequest);
				this.store.loadMergeRequestDetails(this.mergeRequest);
				return [];
			}
		} else {
			return [];
		}

		const approvalData = this.store.getApprovalData(this.mergeRequest);
		if (!approvalData) {
			return [];
		}

		const files = this.store.files.getFiles(this.mergeRequest);
		const fileCount = files ? files.length : undefined;

		return [
			new MergeRequestOverviewItem(this.mergeRequest.user_notes_count),
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