import * as vscode from 'vscode';
import { GitLabApprovalData } from '../model/GitLabApprovalData';
import { MergeRequestReviewerItem } from './MergeRequestReviewerItem';

export class MergeRequestApprovedItem
	extends vscode.TreeItem
{
	private readonly _approvedBy: { name: string; username: string }[];

	public constructor(
		approvalData: GitLabApprovalData,
	) {
		const count = approvalData.approvedBy.length;
		super(
			`Approved (${count})`,
			count > 0
				? vscode.TreeItemCollapsibleState.Collapsed
				: vscode.TreeItemCollapsibleState.None,
		);

		this._approvedBy = approvalData.approvedBy;
		this.contextValue = 'approved';
		this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
	}

	public getChildren(): MergeRequestReviewerItem[] {
		return this._approvedBy.map(
			(user) => new MergeRequestReviewerItem(user),
		);
	}
}
