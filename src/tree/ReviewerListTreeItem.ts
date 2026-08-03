import * as vscode from 'vscode';
import { GitLabApprovalData } from '../model/GitLabApprovalData';
import { MergeRequestReviewerItem } from './MergeRequestReviewerItem';

export interface ReviewerListConfig {
	label: string;
	contextValue: string;
	iconName: string;
	iconColor: vscode.ThemeColor;
	getReviewers(data: GitLabApprovalData): { name: string; username: string }[];
}

export class ReviewerListTreeItem extends vscode.TreeItem {
	private readonly _reviewers: { name: string; username: string }[];

	public constructor(config: ReviewerListConfig, approvalData: GitLabApprovalData) {
		const reviewers = config.getReviewers(approvalData);
		const count = reviewers.length;

		super(
			`${config.label} (${count})`,
			count > 0
				? vscode.TreeItemCollapsibleState.Collapsed
				: vscode.TreeItemCollapsibleState.None,
		);

		this._reviewers = reviewers;
		this.contextValue = config.contextValue;
		this.iconPath = new vscode.ThemeIcon(config.iconName, config.iconColor);
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
	iconColor: new vscode.ThemeColor('charts.green'),
	getReviewers: (data) => data.approvedBy,
};

const requestedChangesConfig: ReviewerListConfig = {
	label: 'Requested Changes',
	contextValue: 'requestedChanges',
	iconName: 'warning',
	iconColor: new vscode.ThemeColor('charts.yellow'),
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