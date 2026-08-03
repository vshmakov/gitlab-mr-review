import { GitLabApprovalData } from '../model/GitLabApprovalData';
import { ITreeItem } from '../infra/tree-item';
import { MergeRequestReviewerItem } from './MergeRequestReviewerItem';

export interface ReviewerListConfig {
	label: string;
	contextValue: string;
	iconName: string;
	iconColor: string;
	getReviewers(data: GitLabApprovalData): { name: string; username: string }[];
}

export class ReviewerListTreeItem implements ITreeItem {
	readonly label: string;
	readonly contextValue: string;
	readonly collapsibleState: 'none' | 'collapsed';
	readonly icon: { name: string; color: string };
	private readonly _reviewers: { name: string; username: string }[];

	public constructor(config: ReviewerListConfig, approvalData: GitLabApprovalData) {
		this._reviewers = config.getReviewers(approvalData);
		const count = this._reviewers.length;

		this.label = `${config.label} (${count})`;
		this.contextValue = config.contextValue;
		this.collapsibleState = count > 0 ? 'collapsed' : 'none';
		this.icon = { name: config.iconName, color: config.iconColor };
	}

	public getChildren(): MergeRequestReviewerItem[] {
		return this._reviewers.map(
			(user) => new MergeRequestReviewerItem(user),
		);
	}
}


// --- Configs ---

const approvedConfig: ReviewerListConfig = {
	label: 'Approved',
	contextValue: 'approved',
	iconName: 'check',
	iconColor: 'charts.green',
	getReviewers: (data) => data.approvedBy,
};

const requestedChangesConfig: ReviewerListConfig = {
	label: 'Requested Changes',
	contextValue: 'requestedChanges',
	iconName: 'warning',
	iconColor: 'charts.yellow',
	getReviewers: (data) => data.requestedChanges,
};


// --- Convenience wrappers ---

export class MergeRequestApprovedItem extends ReviewerListTreeItem {
	public constructor(approvalData: GitLabApprovalData) {
		super(approvedConfig, approvalData);
	}
}

export class MergeRequestRequestedChangesItem extends ReviewerListTreeItem {
	public constructor(approvalData: GitLabApprovalData) {
		super(requestedChangesConfig, approvalData);
	}
}